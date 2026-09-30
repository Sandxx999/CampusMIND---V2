from typing import Dict, Any, List, Optional
from core.logging import logger
from okf.graph_agent import OKFGraphAgent

class OKFHybridRetriever:
    def __init__(self):
        self.graph_agent = OKFGraphAgent()
        # Legacy retriever deprecated
        
    def query(self, query: str, user_attributes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Routes the query. Tries OKF Graph Agent first. 
        Falls back to legacy text retriever if no answer is generated (e.g. zero entities or traversal failure).
        """
        if user_attributes is None:
            user_attributes = {"role": "all"}
            
        logger.info(f"Routing query to OKF Graph Agent: {query}")
        anchors = self.graph_agent.extract_anchors(query)
        graph_response = self.graph_agent.answer_query(query) if anchors else None
        
        if graph_response:
            return {
                "source": "okf_graph",
                "reasoning": graph_response.reasoning,
                "answer": graph_response.answer,
                "context": [], # Graph context already synthesized in answer
                "extracted_anchors": anchors
            }
            
        logger.info("Graph Agent returned no entities or failed to answer. Executing graceful text fallback hook.")
        
        # Legacy ChromaDB vector retrieval deprecated in Phase 4
        # Returning graceful fallback string to avoid exceptions
        return {
            "source": "fallback_text",
            "reasoning": "Fallback to text RAG deprecated. Entities not found in graph.",
            "answer": "I don't have information on that in the official campus database.",
            "context": [],
            "extracted_anchors": []
        }
