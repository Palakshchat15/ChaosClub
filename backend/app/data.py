from datetime import datetime, timedelta, timezone

now = datetime.now(timezone.utc)

users = [
    {"id": 1, "name": "Chaos Admin", "email": "admin@chaosclub.com", "password": "admin123", "role": "admin"},
    {"id": 2, "name": "PitchMaster", "email": "fan@chaosclub.com", "password": "fan12345", "role": "user"},
]

articles = [
    {
        "id": 1,
        "category": "Football",
        "title": "The Club is launching. Are you ready?",
        "excerpt": "ChaosClub is building the fan HQ where predictions, stories and rewards meet.",
        "content": "ChaosClub is building the fan HQ where predictions, stories and rewards meet. This starter article can be replaced from the admin dashboard.",
        "created_at": now - timedelta(hours=5),
        "author": "Chaos Admin",
        "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
        "title_image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
        "context_images": [
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
        ],
    }
]

matches = [
    {
        "id": 1,
        "home_team": "Liverpool",
        "away_team": "Arsenal",
        "kickoff_at": now + timedelta(days=2),
        "status": "upcoming",
        "competition": "Premier League",
        "venue": "Anfield",
    },
    {
        "id": 2,
        "home_team": "Barcelona",
        "away_team": "Atletico",
        "kickoff_at": now + timedelta(days=3),
        "status": "upcoming",
        "competition": "La Liga",
        "venue": "Camp Nou",
    },
]

predictions: list[dict] = []
match_results: dict[int, dict] = {}
reward_log: list[dict] = []

leaderboard = [
    {"rank": 1, "fan": "Chaos Admin", "points": 130},
    {"rank": 2, "fan": "PitchMaster", "points": 118},
    {"rank": 3, "fan": "GoalSeer", "points": 103},
]

daily_fact = {
    "date": now.date().isoformat(),
    "fact": "In football, the first official international match was played in 1872 between Scotland and England."
}
