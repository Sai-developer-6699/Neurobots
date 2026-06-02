import logging
import chromadb
from chromadb.utils import embedding_functions
from django.conf import settings
import os
from rank_bm25 import BM25Okapi
import numpy as np
from sentence_transformers import CrossEncoder

logger = logging.getLogger(__name__)

class RAGService:
    """
    Advanced RAG Service:
    - Dual Embeddings (Text + Code)
    - Hybrid Search (Vector + BM25)
    - Reranking (Cross-Encoder)
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RAGService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize ChromaDB clients, collections, and models"""
        try:
            logger.info("Initializing Advanced RAG Service...")
            base_dir = settings.BASE_DIR
            chroma_path = os.path.join(base_dir, "data", "chromadb")
            
            self.client = chromadb.PersistentClient(path=chroma_path)
            
            # 1. Text Collection
            self.ef_text = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )
            self.col_text = self.client.get_collection(
                name="course_content_text",
                embedding_function=self.ef_text
            )
            
            # 2. Code Collection
            self.ef_code = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="microsoft/codebert-base"
            )
            try:
                self.col_code = self.client.get_collection(
                    name="course_content_code",
                    embedding_function=self.ef_code
                )
            except:
                logger.warning("Code collection not found (run ingestion first)")
                self.col_code = None

            # 3. Reranker
            self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            
            # 4. BM25 Index (Global)
            self._build_bm25_index()
            logger.info("RAGService initialized successfully")
            
        except Exception as e:
            logger.error(f"RAGService initialization failed: {e}")
            self.col_text = None
            self.col_code = None

    def _build_bm25_index(self):
        """Build BM25 index from Text collection (primary knowledge)"""
        try:
            data = self.col_text.get()
            self.doc_ids = data['ids']
            self.documents = data['documents']
            self.metadatas = data['metadatas']
            
            self.doc_map = {ids: {'text': doc, 'meta': meta} for ids, doc, meta in zip(self.doc_ids, self.documents, self.metadatas)}
            
            tokenized_corpus = [doc.lower().split() for doc in self.documents]
            self.bm25 = BM25Okapi(tokenized_corpus)
            logger.info(f"BM25 Index built ({len(self.documents)} docs)")
            
        except Exception as e:
            logger.error(f"Error building BM25 index: {e}")
            self.bm25 = None

    def _is_code_query(self, query: str) -> bool:
        """Heuristic to detect code-intent queries"""
        keywords = ['code', 'python', 'function', 'class', 'implement', 'syntax', 'example', 'def ', 'import ']
        return any(k in query.lower() for k in keywords)

    def search(self, query: str, n_results: int = 3, where: dict = None) -> list[str]:
        """
        Advanced Search Pipeline:
        1. Routing (Text vs Code)
        2. Retrieval (Vector + BM25) -> Top 10
        3. Reranking -> Top 3
        """
        if not self.col_text: return []
        
        try:
            # 1. Routing
            target_col = self.col_code if (self._is_code_query(query) and self.col_code) else self.col_text
            
            # 2. Retrieval (Get candidates)
            candidates = []
            seen_ids = set()
            
            # Vector Search
            vec_res = target_col.query(
                query_texts=[query],
                n_results=10, # Get more for reranking
                where=where
            )
            
            if vec_res['ids']:
                for i, doc_id in enumerate(vec_res['ids'][0]):
                    if doc_id not in seen_ids:
                        candidates.append({
                            'id': doc_id,
                            'text': vec_res['documents'][0][i],
                            'score': 0.0 # Will be reranked
                        })
                        seen_ids.add(doc_id)
            
            # BM25 Search (Only for Text collection usually, keeping simple)
            if self.bm25 and target_col == self.col_text:
                tokenized = query.lower().split()
                scores = self.bm25.get_scores(tokenized)
                top_idxs = np.argsort(scores)[::-1][:10]
                
                for idx in top_idxs:
                    doc_id = self.doc_ids[idx]
                    if doc_id not in seen_ids:
                        # Check filter
                        if where:
                            meta = self.doc_map[doc_id]['meta']
                            match = all(meta.get(k) == v for k, v in where.items())
                            if not match: continue
                            
                        candidates.append({
                            'id': doc_id,
                            'text': self.doc_map[doc_id]['text'],
                            'score': 0.0
                        })
                        seen_ids.add(doc_id)
            
            if not candidates:
                return []
                
            # 3. Reranking
            pairs = [[query, c['text']] for c in candidates]
            scores = self.reranker.predict(pairs)
            
            for i, c in enumerate(candidates):
                c['score'] = scores[i]
                
            # Sort and Select
            ranked = sorted(candidates, key=lambda x: x['score'], reverse=True)
            final_results = [c['text'] for c in ranked[:n_results]]
            
            return final_results
            
        except Exception as e:
            logger.error(f"Error in Advanced Search: {e}")
            return []

    def format_context(self, chunks: list[str]) -> str:
        """Format chunks into a single string for the Prompt"""
        return "\n\n---\n\n".join(chunks)

# Singleton instance
rag_service = RAGService()
