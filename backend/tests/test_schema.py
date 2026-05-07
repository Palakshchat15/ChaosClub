import os
from dotenv import load_dotenv
import json
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

schema = {
    "type": "object",
    "properties": {
        "riddle": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "hints": {"type": "array", "items": {"type": "string"}},
                    "answer": {"type": "string"},
                    "image_url": {"type": "string"}
                },
                "required": ["hints", "answer"]
            }
        }
    }
}

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Give me 1 riddle in JSON format.",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
        ),
    )
    print("Success:", response.text)
except Exception as e:
    print("Error:", e)
