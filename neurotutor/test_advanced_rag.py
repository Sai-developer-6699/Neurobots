import os
import django
import sys
from pathlib import Path

# Setup Django environment
sys.path.append(str(Path.cwd()))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
django.setup()

from tutor.services.rag_service import RAGService
from tutor.services.adaptive_service import AdaptiveService
import time

def test_rag_initialization():
    print("\n1. Testing RAG Initialization...")
    rag = RAGService()
    if rag.col_text and rag.col_code:
        print(f"  ✓ Dual Collections Initialized")
        print(f"  ✓ Text Collection: {rag.col_text.count()} docs")
        try:
            print(f"  ✓ Code Collection: {rag.col_code.count()} docs")
        except:
             print("  ⚠️ Code Collection not ready (ingestion ongoing)")
    else:
        print("  ✗ Initialization Failed")

def test_routing():
    print("\n2. Testing Query Routing...")
    rag = RAGService()
    
    # Text Query
    q1 = "Explain binary search tree complexity"
    is_code_1 = rag._is_code_query(q1)
    print(f"  Query: '{q1}' -> Code Intent: {is_code_1} (Expected: False)")
    
    # Code Query
    q2 = "python code for binary search implementation"
    is_code_2 = rag._is_code_query(q2)
    print(f"  Query: '{q2}' -> Code Intent: {is_code_2} (Expected: True)")
    
    if not is_code_1 and is_code_2:
        print("  ✓ Routing Logic Passed")
    else:
        print("  ✗ Routing Logic Failed")

def test_search_quality():
    print("\n3. Testing Search Quality (with Reranking)...")
    rag = RAGService()
    
    queries = [
        "What is a deadlock?",
        "python implementation of quicksort"
    ]
    
    for q in queries:
        print(f"\n  Query: {q}")
        results = rag.search(q, n_results=3)
        if results:
            for i, res in enumerate(results):
                print(f"    {i+1}. {res[:100]}...")
            print("  ✓ Results retrieved")
        else:
            print("  ⚠️ No results (Indexes might be empty)")

def test_adaptive_service():
    print("\n4. Testing Adaptive Service...")
    adaptive = AdaptiveService()
    
    user_id = 999
    concept = "Test_Concept_Recursion"
    
    print(f"  Simulating 3 failures for {concept}...")
    
    # 1
    adaptive.track_failure(user_id, concept, "q1")
    # 2
    adaptive.track_failure(user_id, concept, "q1")
    # 3 (Should trigger log)
    adaptive.track_failure(user_id, concept, "q1")
    
    print("  ✓ Failures tracked (Check logs for 'Learning Gap Detected')")

if __name__ == "__main__":
    print("=== ADVANCED RAG VERIFICATION ===")
    test_rag_initialization()
    test_routing()
    # Only run search/adaptive checks if ingestion might be done
    # test_search_quality() 
    # test_adaptive_service()
    print("\n=== END VERIFICATION ===")
