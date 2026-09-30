import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from okf.extractor import TripletExtractor
from okf.graph_store import graph_store, OKFNode, OKFEdge
from db.session import get_db_session

def test_okf_extraction():
    print("--- Starting OKF Extraction Test ---")
    
    test_text = """
    The 'Data Structures' (CS201) course is a core requirement for the 'Computer Science' (CSE) department. 
    It is taught by Dr. Alan Turing. Students must complete 'Intro to CS' (CS101) before they can enroll in CS201. 
    The 'Attendance Rule' policy states that students must maintain 75% attendance to pass CS201.
    """
    
    source_id = "test_doc_001"
    
    # 1. Extraction
    print("\n1. Extracting triples from text...")
    extractor = TripletExtractor()
    triples = extractor.extract(test_text, source_id)
    
    print(f"Extracted {len(triples)} valid triples.")
    for t in triples:
        print(f"  - {t.subject.id} ({t.subject.label.value}) -[{t.predicate.value}]-> {t.object_.id} ({t.object_.label.value})")
        
    assert len(triples) > 0, "Failed to extract any valid triples!"
    
    # 2. Ingestion
    print("\n2. Upserting nodes and edges into Neon PostgreSQL...")
    nodes_upserted = set()
    for t in triples:
        graph_store.upsert_node(t.subject.id, t.subject.label.value, t.subject.name, {})
        graph_store.upsert_node(t.object_.id, t.object_.label.value, t.object_.name, {})
        graph_store.upsert_edge(t.subject.id, t.predicate.value, t.object_.id, t.properties)
        nodes_upserted.add(t.subject.id)
        nodes_upserted.add(t.object_.id)
    print("Upsert successful.")
    
    # 3. Traversal
    print("\n3. Testing recursive CTE graph traversal...")
    # Find the id for CS201 to query neighbors
    cs201_id = next((t.subject.id for t in triples if "cs201" in t.subject.id.lower()), None)
    if not cs201_id:
        cs201_id = next((t.object_.id for t in triples if "cs201" in t.object_.id.lower()), None)
    
    assert cs201_id, "Could not find CS201 node in extracted triples."
    
    neighbors = graph_store.get_neighbors(cs201_id, depth=2)
    print(f"Found {len(neighbors)} neighbors for {cs201_id}:")
    for n in neighbors:
        print(f"  -> [{n['relation']}] -> {n['node_id']} ({n['label']}: {n['name']})")
        
    assert len(neighbors) > 0, "Failed to retrieve any neighbors from DB."
    
    # 4. Cleanup
    print("\n4. Cleaning up test records...")
    with get_db_session() as session:
        session.query(OKFNode).filter(OKFNode.id.in_(list(nodes_upserted))).delete(synchronize_session=False)
        session.commit()
    print("Cleanup complete.")
    
    print("\n--- Test Completed Successfully ---")

if __name__ == "__main__":
    test_okf_extraction()
