import os
import sys

# Add backend to sys.path to allow module imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from okf.graph_store import graph_store, OKFNode, OKFEdge
from okf.ontology import EntityType, Predicate, EntityRef, Triple, validate_triple
from db.session import get_engine
from db.base import Base

def test_graph():
    print("Creating OKF tables (if they don't exist)...")
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    # 1. Ontology Validation
    print("\nValidating Triple Ontology...")
    t = Triple(
        subject=EntityRef(id="course:cs101", label=EntityType.COURSE, name="Intro to CS"),
        predicate=Predicate.PREREQUISITE_FOR,
        object=EntityRef(id="course:cs201", label=EntityType.COURSE, name="Data Structures"),
        properties={"confidence": 0.99, "source": "catalog"}
    )
    validate_triple(t)
    print("Triple validated successfully.")
    
    # 2. Insert Nodes
    print("\nUpserting Nodes...")
    n1_id = graph_store.upsert_node("course:cs101", EntityType.COURSE.value, "Intro to CS", {"credits": 3})
    n2_id = graph_store.upsert_node("course:cs201", EntityType.COURSE.value, "Data Structures", {"credits": 4})
    n3_id = graph_store.upsert_node("dept:cse", EntityType.DEPARTMENT.value, "Computer Science", {})
    print(f"Upserted nodes: {n1_id}, {n2_id}, {n3_id}")
    
    # 3. Insert Edges
    print("\nUpserting Edges...")
    graph_store.upsert_edge("course:cs101", Predicate.PREREQUISITE_FOR.value, "course:cs201", {"required": True})
    graph_store.upsert_edge("course:cs101", Predicate.BELONGS_TO.value, "dept:cse", {})
    graph_store.upsert_edge("course:cs201", Predicate.BELONGS_TO.value, "dept:cse", {})
    print("Edges upserted.")
    
    # 4. Get Neighbors
    print("\nQuerying Neighbors for course:cs101 (depth=1)...")
    neighbors = graph_store.get_neighbors("course:cs101", depth=1)
    for n in neighbors:
        print(f" -> [{n['relation']}] -> {n['node_id']} ({n['label']}: {n['name']})")
        
    # 5. Query Subgraph
    print("\nQuerying Subgraph for multiple entities...")
    subgraph = graph_store.query_subgraph(["course:cs101", "course:cs201", "dept:cse"])
    print(f"Subgraph Nodes: {len(subgraph['nodes'])}")
    for node in subgraph['nodes']:
        print(f"  - Node: {node['id']} ({node['label']})")
        
    print(f"Subgraph Edges: {len(subgraph['edges'])}")
    for edge in subgraph['edges']:
        print(f"  - Edge: {edge['source_id']} -[{edge['relation']}]-> {edge['target_id']}")
    
    print("\nGraph store verification complete!")

if __name__ == "__main__":
    test_graph()
