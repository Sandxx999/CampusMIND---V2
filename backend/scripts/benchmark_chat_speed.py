import os
import time
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

from google import genai
from google.genai import types

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")

client = genai.Client(api_key=api_key)

config = types.GenerateContentConfig(
    temperature=0.2,
    max_output_tokens=200
)

system_prompt = """You are CampusMIND AI assistant.
Student Context:
- Name: Gadde Sandeep (ID: 2024_015)
- Attendance: 88.5% (160 Present, 20 Absent)
- Mid Term 1: AI301 (38/40, A+), CS201 (35/40, A), MATH202 (32/40, B+), AI302 (39/40, A+), AI303 (36/40, A)
Answer the question concisely in 1 to 2 sentences without generic preambles."""

queries = [
    ("What is my current attendance and exam eligibility?", "88.5%"),
    ("my test scores", "38/40"),
    ("How did I perform in Deep Learning AI301?", "38")
]

print("\n--- Running AI Latency and Accuracy Benchmark ---")
for query, expected in queries:
    t0 = time.time()
    query_config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.2,
        max_output_tokens=50
    )
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=f"User Query: {query}",
        config=query_config
    )
    elapsed = time.time() - t0
    text = response.text.strip()
    is_accurate = expected.lower() in text.lower()
    
    print(f"Query: '{query}'")
    print(f"Time: {elapsed:.2f}s | Match Found: {is_accurate}")
    print(f"Reply: {text}\n")
    
    assert elapsed < 5.0, f"Latency check failed: took {elapsed:.2f}s (must be < 5.0s)"
    assert is_accurate, f"Accuracy check failed: expected '{expected}' in response"

print("--- Benchmark Passed: Model is responsive and accurate ---")
