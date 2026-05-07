import os
from dotenv import load_dotenv
from google import genai
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

for model in ['gemini-1.5-pro-latest', 'gemini-1.5-pro', 'gemini-1.0-pro']:
    print(f"Testing {model}...")
    try:
        response = client.models.generate_content(model=model, contents="Say hi")
        print(f"SUCCESS {model}")
    except Exception as e:
        print(f"FAILED {model}: {e}")
