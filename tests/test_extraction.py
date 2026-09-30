import pytest
from backend.okf.extractor import extractor
from backend.okf.ontology import Triple, EntityType, Predicate

def test_extract_from_text_mocked(monkeypatch):
    """Test the extractor logic without calling the real LLM."""
    
    # We mock the genai generation
    class MockResponse:
        text = '''
        {
            "triples": [
                {
                    "subject": {"id": "course:cs101", "label": "Course", "name": "Intro to CS"},
                    "predicate": "BELONGS_TO",
                    "object_": {"id": "dept:cs", "label": "Department", "name": "Computer Science"}
                },
                {
                    "subject": {"id": "faculty:jdoe", "label": "Faculty", "name": "John Doe"},
                    "predicate": "TEACHES",
                    "object_": {"id": "course:cs101", "label": "Course", "name": "Intro to CS"}
                }
            ]
        }
        '''
    monkeypatch.setattr(extractor.model, 'generate_content', lambda *args, **kwargs: MockResponse())
    
    # We don't need real text since it's mocked
    triples = extractor.extract_from_text("John Doe teaches CS101 in the CS department.")
    
    assert len(triples) == 2
    assert triples[0].subject.id == "course:cs101"
    assert triples[0].subject.label == EntityType.COURSE
    assert triples[0].predicate == Predicate.BELONGS_TO
    assert triples[0].object_.id == "dept:cs"
    assert triples[0].object_.label == EntityType.DEPARTMENT
    
    assert triples[1].subject.id == "faculty:jdoe"
    assert triples[1].predicate == Predicate.TEACHES
    assert triples[1].object_.id == "course:cs101"

def test_invalid_ontology_skipped(monkeypatch):
    """Test that triples violating ontology rules are skipped."""
    
    class MockResponse:
        # TEACHES should be FACULTY -> COURSE. We'll provide STUDENT -> COURSE to trigger validation error.
        text = '''
        {
            "triples": [
                {
                    "subject": {"id": "student:alice", "label": "Student", "name": "Alice"},
                    "predicate": "TEACHES",
                    "object_": {"id": "course:cs101", "label": "Course", "name": "Intro to CS"}
                }
            ]
        }
        '''
    monkeypatch.setattr(extractor.model, 'generate_content', lambda *args, **kwargs: MockResponse())
    
    triples = extractor.extract_from_text("Alice teaches CS101.")
    # The invalid triple should be skipped by the extractor
    assert len(triples) == 0
