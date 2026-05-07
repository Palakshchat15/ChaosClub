import os
from dotenv import load_dotenv
import json
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='''Give me 1 riddle in JSON format using this schema:
        {
          "riddle": [{"hints": ["string"], "answer": "string", "image_url": "string"}]
        }
        ''',
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    print("Success:", response.text)
except Exception as e:
    print("Error:", e)
