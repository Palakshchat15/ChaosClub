import os
from dotenv import load_dotenv
import json
from app import ai_service

load_dotenv()
try:
    print("Generating funzone content...")
    data = ai_service.generate_funzone_content("2026-04-29")
    print("Result:", data)
except Exception as e:
    print("Exception occurred:", e)
