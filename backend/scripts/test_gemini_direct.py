import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def test_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY is missing.")
        return

    client = genai.Client(api_key=api_key)
    
    queries = [
        "What is my current attendance percentage?",
        "How much did I score in Deep Learning (AI301)?"
    ]
    
    system_prompt = """You are CampusMIND AI, an intelligent institutional copilot. You are talking to Gadde Sandeep (student, Roll/ID: STU_2024_015, Dept: Artificial Intelligence).
Authenticated Student/Faculty Data:
- Attendance: 88.5%
- Mid Term Marks/Results:
- AI301 (Deep Learning): 38.0/40.0 (A+, Pass)
- CS201 (Data Structures): 35.0/40.0 (A, Pass)
- MATH202 (Discrete Math): 32.0/40.0 (B+, Pass)
- AI302 (Knowledge Representation): 39.0/40.0 (A+, Pass)
- Timetable/Schedule:
- Monday 09:00-10:30: AI301 at Lab 1
- Tuesday 11:00-12:30: CS201 at Room 302

Be helpful, concise, and professional. IMPORTANT: Directly answer the specific question asked using only the relevant data. Do NOT dump all student data or graph context every turn. If they ask for a specific mark, just give that mark.
"""

    for query in queries:
        print(f"\n--- Testing Query: {query} ---")
        try:
            try:
                response = client.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=query,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.3,
                        max_output_tokens=600
                    )
                )
            print(f"Response: {response.text}")
            assert "fallback" not in response.text.lower(), "Response seems to be a fallback"
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            raise e

    print("\n[PASSED] Gemini Direct Call Verification OK")

if __name__ == "__main__":
    test_gemini()
