import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/chaosclub")
engine = create_engine(DATABASE_URL)

def test_query():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=30)
    
    with engine.connect() as conn:
        print(f"Testing filter: created_at >= {cutoff} AND scheduled_at <= {now}")
        
        # Test 1: No filter
        res1 = conn.execute(text("SELECT COUNT(*) FROM articles;")).scalar()
        print(f"Total articles in DB: {res1}")
        
        # Test 2: Only cutoff
        res2 = conn.execute(text("SELECT COUNT(*) FROM articles WHERE created_at >= :c;"), {"c": cutoff}).scalar()
        print(f"Articles >= cutoff: {res2}")
        
        # Test 3: Only schedule
        res3 = conn.execute(text("SELECT COUNT(*) FROM articles WHERE scheduled_at <= :n;"), {"n": now}).scalar()
        print(f"Articles <= now: {res3}")
        
        # Test 4: Both
        res4 = conn.execute(text("SELECT COUNT(*) FROM articles WHERE created_at >= :c AND scheduled_at <= :n;"), {"c": cutoff, "n": now}).scalar()
        print(f"Articles matching both: {res4}")

if __name__ == "__main__":
    test_query()
