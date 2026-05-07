import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

for model in ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']:
    print(f"Testing {model}...")
    try:
        response = client.models.generate_content(
            model=model,
            contents="Say hi"
        )
        print(f"SUCCESS {model}: {response.text.strip()}")
    except Exception as e:
        print(f"FAILED {model}: {e}")
