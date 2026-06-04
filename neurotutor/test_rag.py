import chromadb
from chromadb.utils import embedding_functions

# Configuration
CHROMA_PATH = "data/chromadb"
COLLECTION_NAME = "course_content"

def test_rag():
    print(f"Connecting to ChromaDB at {CHROMA_PATH}...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    try:
        collection = client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=ef
        )
        print(f"✓ Collection '{COLLECTION_NAME}' found")
        print(f"  Total items: {collection.count()}")
    except Exception as e:
        print(f"✗ Error accessing collection: {e}")
        return

    # Test queries
    queries = [
        ("What is a variable?", None),
        ("Explain the difference between TCP and UDP", {"category": "computer_networks"}),
        ("How does a binary search tree work?", {"topic": "Binary Search Trees"})
    ]
    
    print("\n" + "="*50)
    print("RUNNING RETRIEVAL TESTS")
    print("="*50)
    
    for query_text, filter_dict in queries:
        print(f"\nQUERY: '{query_text}'")
        if filter_dict:
            print(f"FILTER: {filter_dict}")
        
        results = collection.query(
            query_texts=[query_text],
            n_results=2,
            where=filter_dict
        )
        
        if not results['documents'][0]:
            print("  ⚠️ No results found")
            continue
            
        for i, doc in enumerate(results['documents'][0]):
            meta = results['metadatas'][0][i]
            print(f"  RESULT {i+1} ({meta['topic']} - {meta['section']}):")
            print(f"  Length: {len(doc)} chars")
            print(f"  Preview: {doc[:100]}...") 
            print("-" * 30)

if __name__ == "__main__":
    test_rag()
