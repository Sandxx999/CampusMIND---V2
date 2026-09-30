from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_graph_api():
    print("--- Starting Graph Visualization API Test ---")
    
    # 1. Elements API
    print("a. Testing GET /api/graph/elements")
    res1 = client.get("/api/graph/elements")
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
    data1 = res1.json()
    assert "elements" in data1
    assert "nodes" in data1["elements"]
    assert "edges" in data1["elements"]
    assert len(data1["elements"]["nodes"]) > 0
    assert "data" in data1["elements"]["nodes"][0]
    print("   [OK] GET /api/graph/elements returned valid Cytoscape schema")
    
    # 2. Stats API
    print("b. Testing GET /api/graph/stats")
    res2 = client.get("/api/graph/stats")
    assert res2.status_code == 200, f"Expected 200, got {res2.status_code}"
    data2 = res2.json()
    assert "total_nodes" in data2
    assert "total_edges" in data2
    assert "nodes_by_label" in data2
    assert "edges_by_relation" in data2
    print(f"   [OK] Found {data2['total_nodes']} nodes and {data2['total_edges']} edges")
    
    # 3. Centered Subgraph API
    print("c. Testing GET /api/graph/elements?center_node=course:ai301")
    res3 = client.get("/api/graph/elements?center_node=course:ai301")
    assert res3.status_code == 200, f"Expected 200, got {res3.status_code}"
    data3 = res3.json()
    
    node_ids = [n["data"]["id"] for n in data3["elements"]["nodes"]]
    assert "course:ai301" in node_ids, "Center node AI301 not found in subgraph"
    print("   [OK] Fetched centered subgraph successfully")
    
    print("\n[PASSED] Graph API Verification OK")

if __name__ == "__main__":
    test_graph_api()
