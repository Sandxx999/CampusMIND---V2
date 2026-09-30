from typing import List, Dict, Any

class GraphSerializer:
    @staticmethod
    def serialize_subgraph(subgraph: Dict[str, Any]) -> str:
        """Serializes a subgraph dict (nodes, edges) into dense text format."""
        nodes = subgraph.get("nodes", [])
        edges = subgraph.get("edges", [])
        
        node_map = {n["id"]: n for n in nodes}
        
        lines = []
        lines.append("### Entities Profile")
        for node in nodes:
            name = node.get("name") or node["id"]
            label = node.get("label")
            lines.append(f"- [{node['id']}] {name} ({label})")
            
        lines.append("\n### Graph Relationships")
        for edge in edges:
            src = node_map.get(edge["source_id"], {})
            tgt = node_map.get(edge["target_id"], {})
            src_name = src.get("name") or edge["source_id"]
            tgt_name = tgt.get("name") or edge["target_id"]
            rel = edge["relation"]
            lines.append(f"[{src_name}] --{rel}--> [{tgt_name}]")
            
        return "\n".join(lines)

    @staticmethod
    def serialize_neighbors(anchor_id: str, neighbors: List[Dict[str, Any]]) -> str:
        """Serializes neighbor lists resulting from get_neighbors()."""
        if not neighbors:
            return "No relationships found."
            
        lines = ["### Multi-Hop Graph Relationships"]
        for n in neighbors:
            src_id = n.get("source_id", anchor_id)
            tgt_id = n["node_id"]
            rel = n["relation"]
            tgt_name = n.get("name") or tgt_id
            tgt_label = n.get("label") or "Unknown"
            depth = n.get("depth", 1)
            
            # Simple assumption: if source_id isn't in our list of resolved names, just use ID
            lines.append(f"(Depth {depth}) [{src_id}] --{rel}--> [{tgt_name}] ({tgt_label})")
            
        return "\n".join(lines)
