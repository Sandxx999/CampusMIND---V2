import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from db.base import Base
from db.session import get_db_session, get_engine
from sqlalchemy.sql import func
from core.config import settings

# Depending on the DB driver natively connected, use JSONB or JSON
# (SQLAlchemy maps JSON to JSONB automatically on Postgres, but explicitly picking JSONB for Neon is safe)
JSON_TYPE = JSONB().with_variant(JSON(), "sqlite")

class OKFNode(Base):
    __tablename__ = 'okf_nodes'
    
    id = Column(String, primary_key=True)
    label = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    properties = Column(JSON_TYPE, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class OKFEdge(Base):
    __tablename__ = 'okf_edges'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String, ForeignKey('okf_nodes.id', ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(String, ForeignKey('okf_nodes.id', ondelete="CASCADE"), nullable=False, index=True)
    relation = Column(String, nullable=False, index=True)
    properties = Column(JSON_TYPE, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('source_id', 'relation', 'target_id', name='uix_edge_source_rel_target'),
    )


class GraphStore:
    def upsert_node(self, id: str, label: str, name: Optional[str] = None, properties: Optional[Dict[str, Any]] = None) -> str:
        props = properties or {}
        with get_db_session() as session:
            node = session.query(OKFNode).filter(OKFNode.id == id).first()
            if node:
                node.label = label
                node.name = name
                # Merge dictionaries cleanly
                merged = dict(node.properties) if node.properties else {}
                merged.update(props)
                node.properties = merged
            else:
                node = OKFNode(id=id, label=label, name=name, properties=props)
                session.add(node)
            return node.id

    def upsert_edge(self, source_id: str, relation: str, target_id: str, properties: Optional[Dict[str, Any]] = None) -> str:
        props = properties or {}
        with get_db_session() as session:
            edge = session.query(OKFEdge).filter(
                OKFEdge.source_id == source_id,
                OKFEdge.relation == relation,
                OKFEdge.target_id == target_id
            ).first()
            if edge:
                merged = dict(edge.properties) if edge.properties else {}
                merged.update(props)
                edge.properties = merged
                return edge.id
            else:
                edge = OKFEdge(source_id=source_id, relation=relation, target_id=target_id, properties=props)
                session.add(edge)
                return edge.id

    def get_neighbors(self, node_id: str, depth: int = 1) -> List[Dict[str, Any]]:
        """
        Retrieves neighbors using a recursive CTE traversal across relations.
        """
        query = f"""
        WITH RECURSIVE graph_cte AS (
            SELECT 
                target_id as node_id,
                source_id,
                relation,
                1 as depth
            FROM okf_edges
            WHERE source_id = :node_id
            
            UNION ALL
            
            SELECT 
                source_id as node_id,
                target_id as source_id,
                relation,
                1 as depth
            FROM okf_edges
            WHERE target_id = :node_id
            
            UNION ALL
            
            SELECT 
                e.target_id as node_id,
                e.source_id,
                e.relation,
                g.depth + 1
            FROM okf_edges e
            INNER JOIN graph_cte g ON e.source_id = g.node_id
            WHERE g.depth < :depth
        )
        SELECT g.node_id, g.source_id, g.relation, g.depth, n.label, n.name
        FROM graph_cte g
        JOIN okf_nodes n ON g.node_id = n.id;
        """
        with get_db_session() as session:
            result = session.execute(text(query), {"node_id": node_id, "depth": depth})
            neighbors = []
            for row in result:
                neighbors.append({
                    "node_id": row[0],
                    "source_id": row[1],
                    "relation": row[2],
                    "depth": row[3],
                    "label": row[4],
                    "name": row[5]
                })
            return neighbors

    def query_subgraph(self, entity_ids: List[str]) -> Dict[str, Any]:
        """
        Fetches all nodes in entity_ids and any edges existing directly between them.
        """
        if not entity_ids:
            return {"nodes": [], "edges": []}
            
        with get_db_session() as session:
            nodes = session.query(OKFNode).filter(OKFNode.id.in_(entity_ids)).all()
            edges = session.query(OKFEdge).filter(
                OKFEdge.source_id.in_(entity_ids),
                OKFEdge.target_id.in_(entity_ids)
            ).all()
            
            return {
                "nodes": [{"id": n.id, "label": n.label, "name": n.name, "properties": n.properties} for n in nodes],
                "edges": [{"source_id": e.source_id, "target_id": e.target_id, "relation": e.relation, "properties": e.properties} for e in edges]
            }

graph_store = GraphStore()
