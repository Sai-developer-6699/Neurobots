# generate_course_content.py - COMPLETE FIXED VERSION

import os
import time
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv
from groq import AsyncGroq
import aiofiles
import json

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("generation.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class CourseContentGenerator:
    """Generate comprehensive course materials using Groq API (Async Batch)"""
    
    def __init__(self):
        # Load API keys
        self.api_keys = self._load_api_keys()
        self.base_dir = Path("data/course_materials")
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # Concurrency control
        self.max_concurrent_requests = 10
        self.semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        
        # Statistics
        self.stats = {
            'generated': 0,
            'skipped': 0,
            'failed': 0,
            'total': 0
        }
        
        # Track start time
        self.start_time = None
    
    def _load_api_keys(self) -> List[str]:
        """Load all available API keys from environment"""
        keys = []
        i = 1
        while True:
            key = os.getenv(f'GROQ_API_KEY_{i}')
            if not key:
                if i == 1:
                    key = os.getenv('GROQ_API_KEY')
                if not key:
                    break
            keys.append(key)
            i += 1
        
        if not keys:
            logging.error("No GROQ_API_KEY found in .env")
            raise ValueError("No GROQ_API_KEY found in .env")
        
        logging.info(f"✓ Loaded {len(keys)} API key(s)")
        return keys
    
    def _get_client(self, index: int) -> AsyncGroq:
        """Get AsyncGroq client for a specific key index"""
        return AsyncGroq(api_key=self.api_keys[index % len(self.api_keys)])
    
    def _get_prompt(self, category: str, topic: str) -> str:
        """Generate prompt for content creation"""
        # ... (your existing prompt - unchanged)
        return f"""You are creating educational course material for a Computer Science learning platform.

**Topic:** {topic.replace('_', ' ').title()}
**Category:** {category.replace('_', ' ').title()}
**Target Audience:** Beginner to intermediate programmers
**Language:** Python 3.x

Create comprehensive course material with this EXACT structure:

# {topic.replace('_', ' ').title()}

## Overview
[2-3 sentences: What is this concept and why it matters]

## Key Concepts
- [Core idea 1]
- [Core idea 2]
- [Core idea 3]

## Detailed Explanation
[3-4 paragraphs explaining the concept step-by-step]

## Code Examples

### Example 1: Basic Usage
```python
# Simple example with comments
[code here]
```
**Explanation:** [What this code does]

### Example 2: Practical Application
```python
# Real-world example
[code here]
```
**Explanation:** [How this is used in practice]

### Example 3: Advanced Pattern
```python
# More complex example
[code here]
```
**Explanation:** [Advanced usage]

## Common Mistakes
1. **[Mistake name]**: [Description and how to avoid]
2. **[Mistake name]**: [Description and how to avoid]
3. **[Mistake name]**: [Description and how to avoid]

## Best Practices
- [Practice 1]
- [Practice 2]
- [Practice 3]

## Practice Tips
[How students can master this concept]

## Related Concepts
- **Prerequisites:** [What to learn first]
- **Next Steps:** [What to learn after]

## Quick Reference
```python
# Cheat sheet / most important syntax
[code snippets]
```

Requirements:
- Use clear, simple language
- Include 3+ working code examples
- All code must be valid Python 3.x
- Examples should progress from simple to complex
- Length: 800-1200 words
- Focus on practical application
"""
    
    def _validate_content(self, content: str, topic: str) -> bool:
        """Validate generated content quality"""
        if len(content) < 500:
            return False
        
        required_sections = ['## Overview', '## Code Examples', '## Common Mistakes']
        for section in required_sections:
            if section not in content:
                return False
        
        if '```python' not in content:
            return False
        
        return True
    
    async def generate_topic(
        self, 
        category: str, 
        topic: str, 
        key_index: int, 
        max_retries: int = 3
    ) -> bool:
        """Generate content for a single topic asynchronously"""
        
        file_path = self.base_dir / category / f"{topic}.md"
        
        # Check if already exists
        if file_path.exists():
            logging.info(f"  ⏭️  Skipped: {topic}")
            self.stats['skipped'] += 1
            return True
        
        # Ensure category directory exists
        (self.base_dir / category).mkdir(parents=True, exist_ok=True)
        
        client = self._get_client(key_index)
        
        async with self.semaphore:  # Limit concurrency
            for attempt in range(max_retries):
                try:
                    prompt = self._get_prompt(category, topic)
                    
                    response = await client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        max_tokens=2500,
                        timeout=60
                    )
                    
                    content = response.choices[0].message.content
                    
                    # Validate
                    if not self._validate_content(content, topic):
                        logging.warning(f"    ⚠️  {topic}: Validation failed (Attempt {attempt+1})")
                        if attempt < max_retries - 1:
                            continue
                        return False
                    
                    # Save (Async I/O)
                    async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
                        await f.write(content)
                    
                    logging.info(f"  ✓ {topic} ({len(content)} chars)")
                    self.stats['generated'] += 1
                    return True
                    
                except Exception as e:
                    error_msg = str(e).lower()
                    
                    if 'rate' in error_msg or 'limit' in error_msg:
                        # Rate limited - wait and retry
                        wait_time = 20 * (attempt + 1)
                        logging.warning(f"    ⚠️  {topic}: Rate limit, waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    # Other errors
                    logging.error(f"    ✗ {topic}: Failed attempt {attempt+1}: {e}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(5)
                        continue
            
            # Failed after all retries
            logging.error(f"  ✗ {topic}: Failed after {max_retries} attempts")
            self.stats['failed'] += 1
            return False
    
    async def generate_all(self, course_structure: Dict[str, List[str]]):
        """Generate all course materials concurrently"""
        
        self.start_time = time.time()
        
        # Calculate total
        self.stats['total'] = sum(len(topics) for topics in course_structure.values())
        
        logging.info("=" * 70)
        logging.info("ASYNC COURSE CONTENT GENERATION")
        logging.info("=" * 70)
        logging.info(f"Total topics: {self.stats['total']}")
        logging.info(f"API keys: {len(self.api_keys)}")
        logging.info(f"Concurrent requests: {self.max_concurrent_requests}")
        logging.info("=" * 70)
        
        # Create tasks
        tasks = []
        key_index = 0
        
        for category, topics in course_structure.items():
            logging.info(f"\n📁 {category}")
            for topic in topics:
                tasks.append(
                    self.generate_topic(category, topic, key_index)
                )
                key_index = (key_index + 1) % len(self.api_keys)
        
        # Run all tasks concurrently
        await asyncio.gather(*tasks)
        
        # Print summary
        self._print_summary()
    
    def _print_summary(self):
        """Print generation summary"""
        
        elapsed = time.time() - self.start_time
        
        logging.info("\n" + "=" * 70)
        logging.info("GENERATION COMPLETE")
        logging.info("=" * 70)
        logging.info(f"✓ Generated: {self.stats['generated']}")
        logging.info(f"⏭️  Skipped:   {self.stats['skipped']}")
        logging.info(f"✗ Failed:    {self.stats['failed']}")
        logging.info(f"📊 Total:     {self.stats['total']}")
        logging.info(f"⏱️  Time:      {elapsed / 60:.1f} minutes")
        logging.info("=" * 70)
        
        success_rate = (self.stats['generated'] / self.stats['total'] * 100) if self.stats['total'] > 0 else 0
        logging.info(f"Success Rate: {success_rate:.1f}%")
        
        if self.stats['generated'] > 0:
            avg_time = elapsed / self.stats['generated']
            logging.info(f"Avg time per topic: {avg_time:.1f} seconds")
        
        if self.stats['failed'] > 0:
            logging.warning("\n⚠️  Some topics failed. Run the script again to retry.")


# Course structure (unchanged)
COURSE_STRUCTURE = {
    'programming_basics': [
        'variables_and_datatypes', 'operators', 'control_flow',
        'functions', 'recursion', 'loops', 'arrays', 'strings',
        'pointers', 'structures',
    ],
    'data_structures': [
        'trees', 'binary_search_trees', 'heaps', 'graphs',
        'hash_tables', 'tries',
    ],
    'algorithms': [
        'time_complexity', 'space_complexity', 'sorting_algorithms',
        'searching_algorithms', 'dynamic_programming', 'greedy_algorithms',
        'divide_and_conquer', 'backtracking', 'graph_algorithms',
        'string_algorithms',
    ],
    'operating_systems': [
        'process_management', 'threads', 'cpu_scheduling', 'deadlock',
        'memory_management', 'virtual_memory', 'paging', 'segmentation',
        'file_systems', 'disk_scheduling',
    ],
    'computer_networks': [
        'osi_model', 'tcp_ip', 'http_https', 'dns',
        'routing_algorithms', 'network_security', 'subnetting',
        'tcp_vs_udp', 'socket_programming', 'load_balancing',
    ],
    'database_systems': [
        'relational_model', 'sql_basics', 'normalization', 'transactions',
        'acid_properties', 'indexing', 'query_optimization',
        'nosql_databases', 'database_design', 'concurrency_control',
    ],
    'system_design': [
        'scalability', 'load_balancing', 'caching', 'database_sharding',
        'microservices', 'api_design', 'message_queues', 'cdn',
        'rate_limiting', 'distributed_systems',
    ],
    'devops': [
        'docker', 'kubernetes', 'ci_cd', 'jenkins',
        'git_workflows', 'linux_commands', 'bash_scripting',
        'monitoring', 'logging', 'infrastructure_as_code',
    ],
    'cloud': [
        'rds', 'lambda', 'vpc', 'cloudformation',
        'azure_basics', 'gcp_basics', 'serverless',
    ],
    'software_engineering': [
        'sdlc', 'agile', 'design_patterns', 'solid_principles',
        'testing', 'code_review', 'version_control', 'documentation',
        'debugging', 'refactoring',
    ],
    'security': [
        'authentication', 'authorization', 'encryption', 'hashing',
        'sql_injection', 'xss', 'csrf', 'oauth', 'jwt', 'ssl_tls',
    ],
}


if __name__ == "__main__":
    try:
        generator = CourseContentGenerator()
        asyncio.run(generator.generate_all(COURSE_STRUCTURE))  # ← FIX: Add asyncio.run()
        
    except KeyboardInterrupt:
        print("\n\n⏸️  Generation interrupted by user")
        print("Run script again to resume (existing files will be skipped)")
        
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()