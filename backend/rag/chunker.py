from typing import Dict, Any, List
from langchain.text_splitter import RecursiveCharacterTextSplitter

class InstitutionalChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )

    def chunk_document(self, doc_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        content = doc_dict.get("content", "")
        doc_id = doc_dict.get("id", "")
        
        chunks_text = self.splitter.split_text(content)
        
        chunks = []
        for i, text in enumerate(chunks_text):
            chunk_id = f"{doc_id}_{i}"
            metadata = {
                "document_id": doc_id,
                "name": doc_dict.get("name", ""),
                "title": doc_dict.get("title", ""),
                "category": doc_dict.get("category", ""),
                "audience": doc_dict.get("audience", ""),
                "version": doc_dict.get("version", ""),
                "source_path": doc_dict.get("source_path", ""),
                "chunk_index": i
            }
            chunks.append({
                "id": chunk_id,
                "text": text,
                "metadata": metadata
            })
            
        return chunks
