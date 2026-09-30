from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.session import get_db_session
from okf.graph_export import get_cytoscape_elements
from okf.graph_store import OKFNode, OKFEdge

router = APIRouter(prefix="/api/graph", tags=["Graph"])

@router.get("/elements")
def get_elements(limit: int = 100, center_node: Optional[str] = None):
    with get_db_session() as db:
        return get_cytoscape_elements(db, limit, center_node)

@router.get("/stats")
def get_stats():
    with get_db_session() as db:
        total_nodes = db.query(func.count(OKFNode.id)).scalar()
        total_edges = db.query(func.count(OKFEdge.id)).scalar()
        
        # Node count by label
        node_counts_query = db.query(OKFNode.label, func.count(OKFNode.id)).group_by(OKFNode.label).all()
        node_counts = {label: count for label, count in node_counts_query}
        
        # Edge count by relation
        edge_counts_query = db.query(OKFEdge.relation, func.count(OKFEdge.id)).group_by(OKFEdge.relation).all()
        edge_counts = {relation: count for relation, count in edge_counts_query}
        
        return {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "nodes_by_label": node_counts,
            "edges_by_relation": edge_counts
        }
