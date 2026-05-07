import os
from google import genai
from google.genai import types
import json
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

def get_client():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        return genai.Client(api_key=api_key)
    return None

def generate_daily_fact(date_str: str, avoid_list: list = None) -> str:
    """Generates a random interesting football fact for the given date, avoiding recent ones."""
    client = get_client()
    if not client:
        return "Did you know? The fastest goal ever scored in professional football was just 2 seconds after kick-off!"
    
    avoid_context = ""
    if avoid_list:
        avoid_context = f"\nDO NOT repeat or use any of the following facts: {', '.join(avoid_list)}"

    prompt = (
        "Give me a single, random, extremely fascinating and surprising football fact. "
        "It should NOT be about 'on this day' — pick any amazing stat, record, unusual event, "
        "or little-known story from football history. Make it engaging and fun for fans. "
        "Keep it under 2 sentences. Return only the fact, no extra text."
        f"{avoid_context}"
    )
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error generating fact: {e}")
        return "Did you know? The fastest goal ever scored in professional football was just 2 seconds after kick-off!"


def _fetch_live_football_context(client, date_str: str) -> str:
    """
    Uses Gemini with Google Search grounding to fetch real-time transfer rumors
    and upcoming fixtures for the current week. Returns a plain-text summary.
    """
    try:
        search_prompt = (
            f"Today is {date_str}. Search the web and give me:\n"
            f"1. The top 3 most discussed football transfer rumors RIGHT NOW (this week, {date_str}). "
            f"Include specific player names, clubs involved, and fee estimates if available.\n"
            f"2. The top 3 most important football matches happening in the next 7 days from {date_str}. "
            f"Include competition name, teams, and date.\n"
            f"Be specific and factual. No old news."
        )
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=search_prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Google Search grounding failed: {e}")
        return ""


def generate_funzone_content(date_str: str) -> dict:
    """Generates a full payload of fun zone content using live web data."""
    client = get_client()
    if not client:
        return {}

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
            },
            "rumor": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string"},
                        "votes": {
                            "type": "object",
                            "properties": {"hot": {"type": "integer"}, "not": {"type": "integer"}},
                            "required": ["hot", "not"]
                        }
                    },
                    "required": ["text", "votes"]
                }
            },
            "charades": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "emojis": {"type": "string"},
                        "answer": {"type": "string"}
                    },
                    "required": ["emojis", "answer"]
                }
            },
            "prediction": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "votes": {
                            "type": "object",
                            "properties": {"yes": {"type": "integer"}, "no": {"type": "integer"}},
                            "required": ["yes", "no"]
                        }
                    },
                    "required": ["question", "votes"]
                }
            },
            "on_this_day": {
                "type": "object",
                "properties": {
                    "fact": {"type": "string"}
                },
                "required": ["fact"]
            }
        },
        "required": ["riddle", "rumor", "charades", "prediction", "on_this_day"]
    }

    # Step 1: fetch live context via Google Search grounding
    live_context = _fetch_live_football_context(client, date_str)

    # Step 2: determine transfer window
    from datetime import datetime as dt, timedelta
    parsed = dt.strptime(date_str, "%Y-%m-%d")
    month = parsed.month
    year = parsed.year
    next_week_str = (parsed + timedelta(days=7)).strftime("%Y-%m-%d")
    if 6 <= month <= 8:
        window = f"the summer {year} transfer window (June–August {year})"
    elif month == 1 or month == 2:
        window = f"the January {year} transfer window"
    else:
        window = f"the upcoming summer {year} transfer window (pre-window speculation)"

    # Build live context block for the prompt
    context_block = ""
    if live_context:
        context_block = f"""
    === LIVE FOOTBALL DATA (fetched from the web right now) ===
    {live_context}
    === END LIVE DATA ===
    
    You MUST use the above live data as your primary source for sections 2 (rumor) and 4 (prediction).
    Do not invent or use any transfer rumors or match predictions that are NOT mentioned in the live data above.
    """

    prompt = f"""
    You are an expert football (soccer) content creator targeting hardcore football fans.
    Today's date is {date_str}. Generate challenging daily mini-games.
    {context_block}
    
    RULES FOR EACH SECTION:
    
    1. riddle (Who Am I?):
       - Pick a player who is NOT immediately obvious (avoid Messi, Ronaldo, Neymar, Mbappé).
       - Choose cult heroes, legendary defenders, historic players, underrated gems, or retired greats.
       - Hint 1: very cryptic (an obscure stat or unusual career fact).
       - Hint 2: more contextual (club era, style, indirect nationality clue).
       - Hint 3: most direct but still not trivially easy.
       - Leave image_url as empty string.
    
    2. rumor (Transfer Rumor Mill):
       - USE ONLY the live transfer rumors from the data above if provided.
       - If no live data, generate plausible rumors relevant to {window}.
       - Write each rumor as an exciting one-sentence headline a fan would click on.
       - votes: hot:0, not:0.
    
    3. charades (Emoji Puzzle):
       - Creative emoji combinations requiring thinking — NOT literal translations.
       - Answers can be players, clubs, stadiums, or famous moments.
       - Example: ⚡🦁👑 = "Didier Drogba"
    
    4. prediction (Bold Prediction):
       - USE ONLY matches from the live data above happening between {date_str} and {next_week_str}.
       - If no live data, create plausible predictions for fixtures in that 7-day window.
       - Ask a specific yes/no question about a real upcoming match or imminent event.
       - Do NOT reference past games or events beyond {next_week_str}.
       - votes: yes:0, no:0.
    
    Provide exactly 3 items for riddle, rumor, charades, and prediction.
    Provide exactly 1 item for on_this_day (fact).
    
    You MUST respond with ONLY valid JSON strictly matching this schema, no markdown blocks or backticks:
    {json.dumps(schema)}
    """

    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
        )
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        return json.loads(clean_text)
    except Exception as e:
        logger.error(f"Error generating funzone content: {e}")
        return {}
