import os
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize ChromaDB
client = chromadb.PersistentClient(path="data/chromadb")

# Embedding Functions
ef_text = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

ef_code = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="microsoft/codebert-base"
)

# Collections
TEXT_COLLECTION_NAME = "course_content_text"
CODE_COLLECTION_NAME = "course_content_code"

def chunk_markdown(content: str, filename: str) -> list[dict]:
    chunks = []
    lines = content.split('\n')
    
    current_chunk = []
    current_header = "Overview"
    chunk_index = 0
    
    category = filename.split('_')[0] if '_' in filename else 'General'
    topic = filename.replace('.md', '').replace('_', ' ').title()
    
    in_code_block = False
    
    for line in lines:
        # Toggle code block state
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            
        # Detect headers (H1, H2, H3) only if not in code block
        if line.startswith('#') and not in_code_block:
            # Save previous chunk
            if current_chunk:
                process_chunk(chunks, current_chunk, filename, topic, category, current_header, chunk_index)
                chunk_index += 1
            
            # Start new chunk
            current_header = line.lstrip('#').strip()
            current_chunk = []
        else:
            current_chunk.append(line)
            
    # Add final chunk
    if current_chunk:
        process_chunk(chunks, current_chunk, filename, topic, category, current_header, chunk_index)
            
    return chunks

def process_chunk(chunks, lines, filename, topic, category, header, index):
    full_text = "\n".join(lines).strip()
    if len(full_text) == 0:
        return

    # Determine type (Code vs Text)
    # Headers that typically contain code or if the chunk has a code block
    is_code = "Code Example" in header or "Quick Reference" in header or "```" in full_text
    chunk_type = "code" if is_code else "text"
    
    # Smart Chunking logic (Windowed)
    MAX_CHUNK_SIZE = 1000
    OVERLAP = 200
    
    if len(full_text) <= MAX_CHUNK_SIZE:
        text_segments = [full_text]
    else:
        text_segments = []
        start = 0
        while start < len(full_text):
            end = start + MAX_CHUNK_SIZE
            # Try to find natural break
            if end < len(full_text):
                search_window = full_text[end-100:end]
                last_period = search_window.rfind('.')
                last_newline = search_window.rfind('\n')
                split_point = max(last_period, last_newline)
                if split_point != -1:
                    end = (end - 100) + split_point + 1
            
            text_segments.append(full_text[start:end].strip())
            start = end - OVERLAP if end < len(full_text) else end

    for i, segment in enumerate(text_segments):
        chunks.append({
            "id": f"{filename}_{header}_{index}_{i}",
            "text": f"{topic} - {header}: {segment}",
            "type": chunk_type,
            "metadata": {
                "source": filename,
                "topic": topic,
                "category": category,
                "section": header,
                "type": chunk_type
            }
        })

def ingest_content():
    CONTENT_PATH = "data/course_materials"
    
    logging.info("Resetting collections...")
    try: client.delete_collection(TEXT_COLLECTION_NAME)
    except: pass
    try: client.delete_collection(CODE_COLLECTION_NAME)
    except: pass
    
    # Create collections
    col_text = client.create_collection(name=TEXT_COLLECTION_NAME, embedding_function=ef_text)
    col_code = client.create_collection(name=CODE_COLLECTION_NAME, embedding_function=ef_code)
    
    print(f"scanning {CONTENT_PATH}...")
    
    batch_text = {"ids": [], "docs": [], "metas": []}
    batch_code = {"ids": [], "docs": [], "metas": []}
    
    files = list(Path(CONTENT_PATH).rglob("*.md"))
    print(f"Found {len(files)} markdown files.")
    
    total_docs = 0
    
    for file_path in files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            chunks = chunk_markdown(content, file_path.name)
            
            for c in chunks:
                if c['type'] == 'code':
                    batch_code['ids'].append(c['id'])
                    batch_code['docs'].append(c['text'])
                    batch_code['metas'].append(c['metadata'])
                else:
                    batch_text['ids'].append(c['id'])
                    batch_text['docs'].append(c['text'])
                    batch_text['metas'].append(c['metadata'])
            
            total_docs += 1
            if total_docs % 10 == 0:
                print(f"Processed {total_docs}/{len(files)} files...")
                
        except Exception as e:
            logging.error(f"Error processing {file_path}: {e}")
    
    # Batch Insert Text
    if batch_text['ids']:
        print(f"Ingesting {len(batch_text['ids'])} TEXT chunks...")
        for i in range(0, len(batch_text['ids']), 500):
            col_text.add(
                ids=batch_text['ids'][i:i+500],
                documents=batch_text['docs'][i:i+500],
                metadatas=batch_text['metas'][i:i+500]
            )
            print(f"  Text Batch {i//500 + 1} done")

    # Batch Insert Code
    if batch_code['ids']:
        print(f"Ingesting {len(batch_code['ids'])} CODE chunks...")
        for i in range(0, len(batch_code['ids']), 500):
            col_code.add(
                ids=batch_code['ids'][i:i+500],
                documents=batch_code['docs'][i:i+500],
                metadatas=batch_code['metas'][i:i+500]
            )
            print(f"  Code Batch {i//500 + 1} done")

    print("INGESTION COMPLETE (Dual Embedding)")

if __name__ == "__main__":
    ingest_content()
