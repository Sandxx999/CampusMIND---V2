from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from okf.graph_store import OKFNode, OKFEdge, GraphStore

def get_cytoscape_elements(db: Session, limit: int = 100, center_node: Optional[str] = None) -> Dict[str, Any]:
    nodes_data = []
    edges_data = []
    
    if center_node:
        # Use existing logic from GraphStore or build a localized query
        # We will fetch up to 'limit' edges radiating from center_node up to depth 2.
        query = text("""
        WITH RECURSIVE graph_cte AS (
            SELECT target_id as node_id, source_id, relation, 1 as depth
            FROM okf_edges WHERE source_id = :node_id
            UNION ALL
            SELECT source_id as node_id, target_id as source_id, relation, 1 as depth
            FROM okf_edges WHERE target_id = :node_id
            UNION ALL
            SELECT e.target_id as node_id, e.source_id, e.relation, g.depth + 1
            FROM okf_edges e
            INNER JOIN graph_cte g ON e.source_id = g.node_id
            WHERE g.depth < 2
        )
        SELECT g.node_id, g.source_id, g.relation, g.depth
        FROM graph_cte g
        LIMIT :limit
        """)
        
        result = db.execute(query, {"node_id": center_node, "limit": limit}).fetchall()
        
        node_ids = set([center_node])
        for row in result:
            node_ids.add(row.node_id)
            node_ids.add(row.source_id)
            
        nodes = db.query(OKFNode).filter(OKFNode.id.in_(node_ids)).all()
        
        for n in nodes:
            name = n.properties.get('name', '') if n.properties else ''
            label = f"{name} ({n.name})" if name and n.name else (n.name or n.id)
            if n.label == "STUDENT": label = n.name
            elif n.label == "FACULTY": label = n.name
            elif n.label == "DEPARTMENT": label = n.name
            nodes_data.append({
                "data": {
                    "id": n.id,
                    "label": label,
                    "type": n.label.capitalize() if n.label else "",
                    "properties": n.properties or {}
                }
            })
            
        edge_id_counter = 1
        for row in result:
            edges_data.append({
                "data": {
                    "id": f"edge_{edge_id_counter}",
                    "source": row.source_id,
                    "target": row.node_id,
                    "label": row.relation,
                    "properties": {}
                }
            })
            edge_id_counter += 1
            
    else:
        # Fetch top nodes
        nodes = db.query(OKFNode).limit(limit).all()
        node_ids = {n.id for n in nodes}
        
        for n in nodes:
            name = n.properties.get('name', '') if n.properties else ''
            label = f"{name} ({n.name})" if name and n.name else (n.name or n.id)
            if n.label == "STUDENT": label = n.name
            elif n.label == "FACULTY": label = n.name
            elif n.label == "DEPARTMENT": label = n.name
            nodes_data.append({
                "data": {
                    "id": n.id,
                    "label": label,
                    "type": n.label.capitalize() if n.label else "",
                    "properties": n.properties or {}
                }
            })
            
        if node_ids:
            edges = db.query(OKFEdge).filter(
                (OKFEdge.source_id.in_(node_ids)) & (OKFEdge.target_id.in_(node_ids))
            ).all()
            
            for e in edges:
                edges_data.append({
                    "data": {
                        "id": str(e.id),
                        "source": e.source_id,
                        "target": e.target_id,
                        "label": e.relation,
                        "properties": e.properties or {}
                    }
                })
                
    return {
        "elements": {
            "nodes": nodes_data,
            "edges": edges_data
        }
    }
