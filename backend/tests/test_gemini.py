import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded (first 5 chars): {api_key[:5] if api_key else 'None'}")

if not api_key:
    print("No API key found!")
    exit(1)

client = genai.Client(api_key=api_key)
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Hello, just testing the API."
    )
    print("Success! Response:", response.text)
except Exception as e:
    print("Error calling Gemini API:", e)
