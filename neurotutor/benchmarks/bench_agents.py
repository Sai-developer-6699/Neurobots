#!/usr/bin/env python3
"""
Performance Benchmarks for Multi-Agent System

Measures latency, throughput, and resource usage for all agents.
Run with: python benchmarks/bench_agents.py

Results are saved to benchmarks/results/ with timestamp.
"""

import os
import sys
import json
import time
import asyncio
import statistics
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
import django
django.setup()

from tutor.agents.orchestrator import orchestrator
from tutor.agents.base import AgentContext
from tutor.models import Question, User


class BenchmarkRunner:
    """Runs performance benchmarks for all agents"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'system_info': self._get_system_info(),
            'benchmarks': {}
        }
        self.output_dir = Path(__file__).parent / 'results'
        self.output_dir.mkdir(exist_ok=True)
    
    def _get_system_info(self) -> Dict[str, Any]:
        """Collect system information for benchmark context"""
        import platform
        import psutil
        
        return {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'cpu_count': psutil.cpu_count(),
            'memory_gb': round(psutil.virtual_memory().total / (1024**3), 2),
            'disk_usage_gb': round(psutil.disk_usage('/').used / (1024**3), 2)
        }
    
    async def _create_test_context(self, user_id: int = 1) -> AgentContext:
        """Create a test context for benchmarking"""
        return AgentContext(
            user_id=user_id,
            question_id=1,
            question_text="What is the time complexity of binary search?",
            correct_answer="O(log n)",
            concept="algorithms",
            bloom_level="analyze",
            user_answer="O(log n)",
            attempt_count=1,
            mastery_level="understand",
            recent_performance=[True, False, True, True, False],
            recent_accuracy=0.6
        )
    
    async def benchmark_evaluation_agent(self, iterations: int = 50) -> Dict[str, Any]:
        """Benchmark EvaluationAgent latency and accuracy"""
        print("🔍 Benchmarking EvaluationAgent...")
        
        ctx = await self._create_test_context()
        latencies = []
        successes = 0
        
        for i in range(iterations):
            start_time = time.perf_counter()
            
            try:
                result = await orchestrator.evaluation_agent.run(ctx)
                latency = (time.perf_counter() - start_time) * 1000  # ms
                latencies.append(latency)
                
                if result.success:
                    successes += 1
                    
            except Exception as e:
                print(f"  ❌ Iteration {i+1} failed: {e}")
                continue
        
        return {
            'iterations': iterations,
            'successes': successes,
            'success_rate': successes / iterations,
            'latency_ms': {
                'mean': statistics.mean(latencies) if latencies else 0,
                'median': statistics.median(latencies) if latencies else 0,
                'p95': latencies[int(len(latencies) * 0.95)] if latencies else 0,
                'p99': latencies[int(len(latencies) * 0.99)] if latencies else 0,
                'min': min(latencies) if latencies else 0,
                'max': max(latencies) if latencies else 0
            }
        }
    
    async def benchmark_hint_agent(self, iterations: int = 30) -> Dict[str, Any]:
        """Benchmark HintAgent latency"""
        print("💡 Benchmarking HintAgent...")
        
        ctx = await self._create_test_context()
        latencies = []
        successes = 0
        
        for i in range(iterations):
            start_time = time.perf_counter()
            
            try:
                result = await orchestrator.hint_agent.run(ctx)
                latency = (time.perf_counter() - start_time) * 1000  # ms
                latencies.append(latency)
                
                if result.success:
                    successes += 1
                    
            except Exception as e:
                print(f"  ❌ Iteration {i+1} failed: {e}")
                continue
        
        return {
            'iterations': iterations,
            'successes': successes,
            'success_rate': successes / iterations,
            'latency_ms': {
                'mean': statistics.mean(latencies) if latencies else 0,
                'median': statistics.median(latencies) if latencies else 0,
                'p95': latencies[int(len(latencies) * 0.95)] if latencies else 0,
                'p99': latencies[int(len(latencies) * 0.99)] if latencies else 0,
                'min': min(latencies) if latencies else 0,
                'max': max(latencies) if latencies else 0
            }
        }
    
    async def benchmark_concept_mapper(self, iterations: int = 100) -> Dict[str, Any]:
        """Benchmark ConceptMapperAgent (should be fast)"""
        print("🗺️ Benchmarking ConceptMapperAgent...")
        
        ctx = await self._create_test_context()
        latencies = []
        successes = 0
        
        for i in range(iterations):
            start_time = time.perf_counter()
            
            try:
                result = await orchestrator.concept_mapper.run(ctx)
                latency = (time.perf_counter() - start_time) * 1000  # ms
                latencies.append(latency)
                
                if result.success:
                    successes += 1
                    
            except Exception as e:
                print(f"  ❌ Iteration {i+1} failed: {e}")
                continue
        
        return {
            'iterations': iterations,
            'successes': successes,
            'success_rate': successes / iterations,
            'latency_ms': {
                'mean': statistics.mean(latencies) if latencies else 0,
                'median': statistics.median(latencies) if latencies else 0,
                'p95': latencies[int(len(latencies) * 0.95)] if latencies else 0,
                'p99': latencies[int(len(latencies) * 0.99)] if latencies else 0,
                'min': min(latencies) if latencies else 0,
                'max': max(latencies) if latencies else 0
            }
        }
    
    async def benchmark_full_orchestration(self, iterations: int = 20) -> Dict[str, Any]:
        """Benchmark complete orchestration flow"""
        print("🎯 Benchmarking Full Orchestration...")
        
        # Create mock user and question for realistic test
        try:
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(
                    username='benchmark_user',
                    email='bench@example.com',
                    password='bench123'
                )
            
            question = Question.objects.first()
            if not question:
                question = Question.objects.create(
                    text="What is the time complexity of binary search?",
                    correct_answer="O(log n)",
                    concept="algorithms",
                    bloom_level="analyze",
                    difficulty="medium"
                )
        except Exception as e:
            print(f"  ⚠️ Could not create test data: {e}")
            return {'error': 'Test data creation failed'}
        
        latencies = []
        successes = 0
        
        for i in range(iterations):
            start_time = time.perf_counter()
            
            try:
                result = await orchestrator.evaluate_answer(
                    user=user,
                    question=question,
                    user_answer="O(log n)"
                )
                latency = (time.perf_counter() - start_time) * 1000  # ms
                latencies.append(latency)
                
                if result and 'is_correct' in result:
                    successes += 1
                    
            except Exception as e:
                print(f"  ❌ Iteration {i+1} failed: {e}")
                continue
        
        return {
            'iterations': iterations,
            'successes': successes,
            'success_rate': successes / iterations,
            'latency_ms': {
                'mean': statistics.mean(latencies) if latencies else 0,
                'median': statistics.median(latencies) if latencies else 0,
                'p95': latencies[int(len(latencies) * 0.95)] if latencies else 0,
                'p99': latencies[int(len(latencies) * 0.99)] if latencies else 0,
                'min': min(latencies) if latencies else 0,
                'max': max(latencies) if latencies else 0
            }
        }
    
    async def benchmark_concurrent_load(self, concurrent_users: int = 10, requests_per_user: int = 5) -> Dict[str, Any]:
        """Benchmark concurrent load handling"""
        print(f"🚀 Benchmarking Concurrent Load ({concurrent_users} users × {requests_per_user} requests)...")
        
        async def user_session(user_id: int):
            """Simulate one user making multiple requests"""
            session_latencies = []
            session_successes = 0
            
            for req in range(requests_per_user):
                start_time = time.perf_counter()
                
                try:
                    ctx = await self._create_test_context(user_id)
                    result = await orchestrator.evaluation_agent.run(ctx)
                    latency = (time.perf_counter() - start_time) * 1000
                    session_latencies.append(latency)
                    
                    if result.success:
                        session_successes += 1
                        
                except Exception as e:
                    print(f"  ❌ User {user_id} request {req+1} failed: {e}")
                    continue
            
            return {
                'user_id': user_id,
                'latencies': session_latencies,
                'successes': session_successes,
                'success_rate': session_successes / requests_per_user
            }
        
        # Run all user sessions concurrently
        tasks = [user_session(i) for i in range(1, concurrent_users + 1)]
        session_results = await asyncio.gather(*tasks)
        
        # Aggregate results
        all_latencies = []
        total_successes = 0
        total_requests = concurrent_users * requests_per_user
        
        for session in session_results:
            all_latencies.extend(session['latencies'])
            total_successes += session['successes']
        
        return {
            'concurrent_users': concurrent_users,
            'requests_per_user': requests_per_user,
            'total_requests': total_requests,
            'total_successes': total_successes,
            'overall_success_rate': total_successes / total_requests,
            'latency_ms': {
                'mean': statistics.mean(all_latencies) if all_latencies else 0,
                'median': statistics.median(all_latencies) if all_latencies else 0,
                'p95': all_latencies[int(len(all_latencies) * 0.95)] if all_latencies else 0,
                'p99': all_latencies[int(len(all_latencies) * 0.99)] if all_latencies else 0,
                'min': min(all_latencies) if all_latencies else 0,
                'max': max(all_latencies) if all_latencies else 0
            },
            'throughput_rps': total_requests / (max(all_latencies) / 1000) if all_latencies else 0
        }
    
    def print_summary(self):
        """Print benchmark summary to console"""
        print("\n" + "="*60)
        print("📊 BENCHMARK RESULTS SUMMARY")
        print("="*60)
        
        for name, results in self.results['benchmarks'].items():
            if 'error' in results:
                print(f"\n❌ {name}: {results['error']}")
                continue
                
            print(f"\n✅ {name}:")
            print(f"   Success Rate: {results['success_rate']:.1%}")
            
            if 'latency_ms' in results:
                lat = results['latency_ms']
                print(f"   Latency (ms): mean={lat['mean']:.1f}, median={lat['median']:.1f}, p95={lat['p95']:.1f}")
            
            if 'throughput_rps' in results:
                print(f"   Throughput: {results['throughput_rps']:.1f} RPS")
        
        # Performance recommendations
        print(f"\n🎯 PERFORMANCE RECOMMENDATIONS:")
        
        eval_results = self.results['benchmarks'].get('evaluation_agent', {})
        if eval_results.get('latency_ms', {}).get('p95', 0) > 2000:
            print("   ⚠️ EvaluationAgent p95 > 2s - consider optimization")
        
        full_results = self.results['benchmarks'].get('full_orchestration', {})
        if full_results.get('latency_ms', {}).get('p95', 0) > 3000:
            print("   ⚠️ Full orchestration p95 > 3s - may impact user experience")
        
        concurrent_results = self.results['benchmarks'].get('concurrent_load', {})
        if concurrent_results.get('overall_success_rate', 1.0) < 0.95:
            print("   ⚠️ Concurrent load success rate < 95% - check for bottlenecks")
        
        print("="*60)
    
    def save_results(self):
        """Save benchmark results to file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'benchmark_results_{timestamp}.json'
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Results saved to: {filepath}")
        return filepath
    
    async def run_all_benchmarks(self):
        """Run all benchmark suites"""
        print("🚀 Starting Agent Performance Benchmarks")
        print(f"📅 {self.results['timestamp']}")
        print(f"💻 {self.results['system_info']['platform']}")
        print(f"🧠 {self.results['system_info']['cpu_count']} CPUs, {self.results['system_info']['memory_gb']}GB RAM")
        print("-" * 60)
        
        # Run individual agent benchmarks
        self.results['benchmarks']['evaluation_agent'] = await self.benchmark_evaluation_agent()
        self.results['benchmarks']['hint_agent'] = await self.benchmark_hint_agent()
        self.results['benchmarks']['concept_mapper'] = await self.benchmark_concept_mapper()
        
        # Run integration benchmarks
        self.results['benchmarks']['full_orchestration'] = await self.benchmark_full_orchestration()
        self.results['benchmarks']['concurrent_load'] = await self.benchmark_concurrent_load()
        
        # Print and save results
        self.print_summary()
        return self.save_results()


async def main():
    """Main benchmark runner"""
    runner = BenchmarkRunner()
    await runner.run_all_benchmarks()


if __name__ == '__main__':
    print("🔧 Agent Performance Benchmarks")
    print("This will test all agents in the multi-agent system")
    print("Press Ctrl+C to cancel\n")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️ Benchmarks cancelled by user")
    except Exception as e:
        print(f"\n💥 Benchmark failed: {e}")
        sys.exit(1)
