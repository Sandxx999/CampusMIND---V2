from enum import Enum
from typing import Dict, Any, Optional, Union
from pydantic import BaseModel, Field

class EntityType(str, Enum):
    COURSE = "Course"
    POLICY = "Policy"
    DEPARTMENT = "Department"
    EVENT = "Event"
    DOCUMENT_SOURCE = "DocumentSource"
    PERSON = "Person"
    STUDENT = "Student"
    FACULTY = "Faculty"
    PROGRAM = "Program"

class Predicate(str, Enum):
    BELONGS_TO = "BELONGS_TO"
    PREREQUISITE_FOR = "PREREQUISITE_FOR"
    APPLIES_TO = "APPLIES_TO"
    AUTHORED_BY = "AUTHORED_BY"
    MENTIONS = "MENTIONS"
    ENROLLED_IN = "ENROLLED_IN"
    TEACHES = "TEACHES"
    HOSTED_BY = "HOSTED_BY"
    PART_OF = "PART_OF"

class EntityRef(BaseModel):
    id: str = Field(description="Unique identifier for the entity, e.g., 'dept:cse'")
    label: EntityType = Field(description="Ontology entity type")
    name: Optional[str] = Field(None, description="Canonical name of the entity")

class Triple(BaseModel):
    subject: EntityRef
    predicate: Predicate
    object_: Union[EntityRef, str, int, float, bool] = Field(alias="object")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Metadata like confidence, source_doc_id, extracted_at")

    class Config:
        populate_by_name = True

def validate_triple(triple: Triple) -> bool:
    """Validates if a triple adheres to the defined ontology rules."""
    
    # Example constraints mapping
    if triple.predicate == Predicate.PREREQUISITE_FOR:
        if triple.subject.label != EntityType.COURSE:
            raise ValueError(f"PREREQUISITE_FOR subject must be COURSE, got {triple.subject.label}")
        if not isinstance(triple.object_, EntityRef) or triple.object_.label != EntityType.COURSE:
            raise ValueError(f"PREREQUISITE_FOR object must be a COURSE, got {type(triple.object_)}")

    elif triple.predicate == Predicate.ENROLLED_IN:
        if triple.subject.label != EntityType.STUDENT:
            raise ValueError(f"ENROLLED_IN subject must be STUDENT")
        if not isinstance(triple.object_, EntityRef) or triple.object_.label not in [EntityType.COURSE, EntityType.PROGRAM]:
            raise ValueError(f"ENROLLED_IN object must be COURSE or PROGRAM")

    elif triple.predicate == Predicate.TEACHES:
        if triple.subject.label != EntityType.FACULTY:
            raise ValueError("TEACHES subject must be FACULTY")
        if not isinstance(triple.object_, EntityRef) or triple.object_.label != EntityType.COURSE:
            raise ValueError("TEACHES object must be COURSE")
            
    elif triple.predicate == Predicate.BELONGS_TO:
        if not isinstance(triple.object_, EntityRef) or triple.object_.label not in [EntityType.DEPARTMENT, EntityType.PROGRAM]:
            raise ValueError("BELONGS_TO object must be DEPARTMENT or PROGRAM")
            
    return True
