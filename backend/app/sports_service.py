import requests
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("FOOTBALL_API_KEY")
BASE_URL = "https://api.football-data.org/v4"

HEADERS = {
    "X-Auth-Token": API_KEY
}

# Mapping our common IDs to Football-Data.org codes
# PL=39 (api-sports) -> PL (football-data)
LEAGUE_MAP = {
    "39": "PL",   # Premier League
    "140": "PD",  # La Liga
    "78": "BL1",  # Bundesliga
    "135": "SA",  # Serie A
    "61": "FL1",  # Ligue 1
    "2": "CL",    # Champions League
    "3": "EL"     # Europa League
}

def fetch_upcoming_matches(league_id: str, season: int = 2024):
    """Fetch upcoming scheduled matches for a league"""
    code = LEAGUE_MAP.get(str(league_id), str(league_id))
    url = f"{BASE_URL}/competitions/{code}/matches?status=SCHEDULED"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200:
        try:
            err = response.json()
            raise Exception(err.get("message", "API Request Failed"))
        except:
            raise Exception(f"API Request Failed with status {response.status_code}")

    data = response.json()
    
    # Adapt to our previous format to avoid breaking main.py logic
    matches = []
    for m in data.get("matches", []):
        matches.append({
            "fixture": {
                "id": m["id"],
                "date": m["utcDate"],
                "venue": m.get("venue", "Unknown Venue"),
            },
            "teams": {
                "home": {"name": m["homeTeam"]["name"]},
                "away": {"name": m["awayTeam"]["name"]}
            },
            "league": {"name": m["competition"]["name"]}
        })
    return matches

def fetch_match_status(fixture_id: int):
    """Fetch result and status for a match"""
    url = f"{BASE_URL}/matches/{fixture_id}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200: return None
    
    m = response.json()
    
    if not m or "status" not in m:
        return None
    
    # Map statuses: FINISHED -> FT
    status = "FT" if m["status"] == "FINISHED" else m["status"]
    
    return {
        "id": m["id"],
        "status": status,
        "home_goals": m["score"]["fullTime"]["home"],
        "away_goals": m["score"]["fullTime"]["away"]
    }

def fetch_match_events(fixture_id: int):
    """Fetch scorers for a match"""
    url = f"{BASE_URL}/matches/{fixture_id}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200: return []
    
    m = response.json()
    
    scorers = []
    # Football-Data.org v4 includes goals in the match object or scorers list
    # Actually, for scorers we might need the match details
    # In v4, /matches/{id} includes goal data if available
    for goal in m.get("goals", []):
        if goal.get("scorer"):
            scorers.append(goal["scorer"]["name"])
            
    return scorers
