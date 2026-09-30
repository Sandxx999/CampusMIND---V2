import os
import glob
from typing import List, Dict, Any, Optional

from core.logging import logger
from rag.chunker import InstitutionalChunker
from okf.extractor import TripletExtractor
from okf.graph_store import graph_store
from db.models import KnowledgeDocument
from db.session import get_db_session

DATA_RAW_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/raw"))
SUPPORTED_EXTENSIONS = {".txt", ".md"}

class OKFIngestionPipeline:
    def __init__(self, data_dir: str = DATA_RAW_DIR):
        self.data_dir = os.path.abspath(data_dir)
        self.chunker = InstitutionalChunker(chunk_size=1000, chunk_overlap=100)
        self.extractor = TripletExtractor()
        
    def validate_file(self, file_path: str) -> tuple[bool, str]:
        if not os.path.isfile(file_path):
            return False, f"File does not exist: {file_path}"
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            return False, f"Unsupported file extension '{ext}'"
        return True, "Valid"

    def ingest_single_document(self, file_path: str) -> Dict[str, Any]:
        is_valid, reason = self.validate_file(file_path)
        if not is_valid:
            logger.warning(f"Ingestion skipped for '{file_path}': {reason}")
            return {"status": "failed", "file": file_path, "error": reason}
            
        doc_name = os.path.basename(file_path)
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Try to find corresponding KnowledgeDocument for source_doc_id
        source_doc_id = doc_name
        with get_db_session() as session:
            doc_record = session.query(KnowledgeDocument).filter(
                KnowledgeDocument.file_path == file_path
            ).first()
            if doc_record:
                source_doc_id = doc_record.id

        doc_dict = {
            "id": source_doc_id,
            "name": doc_name,
            "title": doc_name,
            "content": content,
            "category": "general",
            "audience": "all",
            "version": "1.0",
            "checksum": "okf_checksum",
            "source_path": file_path,
        }
        
        chunks = self.chunker.chunk_document(doc_dict)
        if not chunks:
            return {"status": "failed", "file": file_path, "error": "No valid chunks produced."}
            
        total_triples_extracted = 0
        total_nodes_upserted = set()
        
        for chunk in chunks:
            triples = self.extractor.extract(chunk["text"], source_doc_id=source_doc_id)
            total_triples_extracted += len(triples)
            
            for t in triples:
                # Upsert subject node
                graph_store.upsert_node(
                    id=t.subject.id,
                    label=t.subject.label.value,
                    name=t.subject.name,
                    properties={}
                )
                total_nodes_upserted.add(t.subject.id)
                
                # Upsert object node
                graph_store.upsert_node(
                    id=t.object_.id,
                    label=t.object_.label.value,
                    name=t.object_.name,
                    properties={}
                )
                total_nodes_upserted.add(t.object_.id)
                
                # Upsert edge
                graph_store.upsert_edge(
                    source_id=t.subject.id,
                    relation=t.predicate.value,
                    target_id=t.object_.id,
                    properties=t.properties
                )
                
        logger.info(f"Successfully processed OKF for '{doc_name}'. Extracted {total_triples_extracted} triples.")
        return {
            "status": "indexed_okf",
            "document_id": source_doc_id,
            "triples_extracted": total_triples_extracted,
            "unique_nodes": len(total_nodes_upserted)
        }

    def ingest_directory(self) -> List[Dict[str, Any]]:
        files = glob.glob(os.path.join(self.data_dir, "*.txt")) + glob.glob(os.path.join(self.data_dir, "*.md"))
        results = []
        for file_path in files:
            res = self.ingest_single_document(file_path)
            results.append(res)
        return results

def ingest_okf_data(data_dir: str = DATA_RAW_DIR) -> List[Dict[str, Any]]:
    pipeline = OKFIngestionPipeline(data_dir=data_dir)
    return pipeline.ingest_directory()

if __name__ == "__main__":
    results = ingest_okf_data()
    print(f"OKF Ingestion completed. Processed {len(results)} documents.")
