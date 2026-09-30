import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from pydantic import BaseModel, Field

from google import genai
from google.genai import types

from core.config import settings
from okf.ontology import EntityType, Predicate, EntityRef, Triple, validate_triple

class ExtractedEntity(BaseModel):
    id: str = Field(description="Deterministic canonical ID, e.g. 'course:cs101', 'dept:cse', 'policy:attendance_rule'")
    label: EntityType
    name: str

class ExtractedTriple(BaseModel):
    subject_id: str
    predicate: Predicate
    object_id: str

class ExtractionResult(BaseModel):
    entities: List[ExtractedEntity]
    triples: List[ExtractedTriple]


class TripletExtractor:
    def __init__(self, model_name: str = "gemini-3.5-flash"):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = model_name

    def extract(self, text: str, source_doc_id: str) -> List[Triple]:
        prompt = f"""
        Extract knowledge graph entities and relationships from the following text.
        Text: {text}
        
        Rules:
        1. Strictly adhere to the EntityType and Predicate enums provided in the schema.
        2. Canonicalize entity IDs deterministically (e.g., lowercased, spaces replaced by underscores, prefixed by type, like 'course:cs101' or 'dept:cse').
        3. Only extract relationships that use the exact permitted Predicates.
        """
        
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractionResult,
                        temperature=0.1
                    )
                )
                result = ExtractionResult.model_validate_json(response.text)
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                from core.logging import logger
                logger.error(f"Failed to extract triples: {e}")
                return []
            
        entity_map = {e.id: e for e in result.entities}
        valid_triples = []
        extracted_at = datetime.now(timezone.utc).isoformat()
        
        for t in result.triples:
            if t.subject_id not in entity_map or t.object_id not in entity_map:
                continue
                
            subj = entity_map[t.subject_id]
            obj = entity_map[t.object_id]
            
            subject_ref = EntityRef(id=subj.id, label=subj.label, name=subj.name)
            object_ref = EntityRef(id=obj.id, label=obj.label, name=obj.name)
            
            triple = Triple(
                subject=subject_ref,
                predicate=t.predicate,
                object=object_ref,
                properties={
                    "confidence": 0.9,
                    "source_doc_id": source_doc_id,
                    "extracted_at": extracted_at
                }
            )
            
            try:
                validate_triple(triple)
                valid_triples.append(triple)
            except ValueError as e:
                from core.logging import logger
                logger.warning(f"Skipping invalid triple: {e}")
                
        return valid_triples
