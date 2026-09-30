import json
import time
from typing import List, Dict, Any, Optional

from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from core.config import settings
from core.logging import logger
from okf.graph_store import graph_store
from okf.graph_serializer import GraphSerializer

class AnchorExtraction(BaseModel):
    anchor_ids: List[str] = Field(description="List of canonical entity IDs extracted from the query, e.g. ['course:cs201', 'faculty:alan_turing'].")

class AgentResponse(BaseModel):
    reasoning: str = Field(description="Step-by-step reasoning trace citing graph nodes and edges.")
    answer: str = Field(description="The final synthesized answer to the user's question.")

class OKFGraphAgent:
    def __init__(self, model_name: str = "gemini-2.0-flash"):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = model_name

    def extract_anchors(self, query: str) -> List[str]:
        prompt = f"""
        Extract canonical knowledge graph entity IDs from the user query.
        Examples: "CS201" -> "course:cs201", "CSE department" -> "dept:cse", "Alan Turing" -> "faculty:alan_turing".
        Lower case the entity name and replace spaces with underscores, prefixed by type.
        Query: {query}
        """
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AnchorExtraction,
                        temperature=0.3,
                        max_output_tokens=600
                    )
                )
                result = AnchorExtraction.model_validate_json(response.text)
                return result.anchor_ids
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(15)
                    continue
                logger.error(f"Anchor extraction failed: {e}")
                return []

    def answer_query(self, query: str) -> Optional[AgentResponse]:
        # 1. Extract anchors
        anchors = self.extract_anchors(query)
        if not anchors:
            return None
            
        # 2. Graph Traversal
        context_parts = []
        for anchor in anchors:
            neighbors = graph_store.get_neighbors(anchor, depth=2)
            if neighbors:
                context_parts.append(f"Anchor: {anchor}\n" + GraphSerializer.serialize_neighbors(anchor, neighbors))
                
        if not context_parts:
            return None
            
        context_text = "\n\n".join(context_parts)
        
        # 3. Context Synthesis
        prompt = f"""
        You are the CampusMIND Graph Reasoning Agent. Answer the user's query strictly based on the provided Knowledge Graph context.
        Provide a step-by-step reasoning trace, explicitly citing the nodes and relationships (edges) you traverse.
        
        Graph Context:
        {context_text}
        
        Query: {query}
        """
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AgentResponse,
                        temperature=0.2
                    )
                )
                return AgentResponse.model_validate_json(response.text)
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(15)
                    continue
                logger.error(f"Graph context synthesis failed: {e}")
                return None
        return None
