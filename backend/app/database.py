from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Table, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database URL - using PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/chaosclub")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user")  # "user" or "admin"
    avatar_url = Column(String, nullable=True)  # Cloudinary CDN URL
    bio = Column(String, nullable=True)
    badges = Column(Text, default="[]")  # JSON list of badge strings
    
    predictions = relationship("Prediction", back_populates="user")
    leaderboard = relationship("LeaderboardRow", back_populates="user", uselist=False)
    comments = relationship("Comment", back_populates="user")
    reward_logs = relationship("RewardLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, nullable=True)  # From API-Football
    league = Column(String, nullable=True)
    home_team = Column(String, index=True)
    away_team = Column(String, index=True)
    kickoff_at = Column(DateTime(timezone=True), index=True)
    status = Column(String, default="upcoming")  # "upcoming", "finished"
    competition = Column(String)
    venue = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    predictions = relationship("Prediction", back_populates="match")
    result = relationship("MatchResult", back_populates="match", uselist=False)


class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    result_pick = Column(String)  # "home", "draw", "away"
    home_goals = Column(Integer)
    away_goals = Column(Integer)
    goalscorers = Column(Text)  # JSON string of list
    locked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    match = relationship("Match", back_populates="predictions")
    user = relationship("User", back_populates="predictions")


class MatchResult(Base):
    __tablename__ = "match_results"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), unique=True, index=True)
    home_goals = Column(Integer)
    away_goals = Column(Integer)
    result = Column(String)  # "home", "draw", "away"
    goalscorers = Column(Text)  # JSON string of list
    finalized_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    match = relationship("Match", back_populates="result")


class LeaderboardRow(Base):
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    points = Column(Integer, default=0)
    monthly_points = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="leaderboard")


class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    title = Column(String, index=True)
    excerpt = Column(String)
    content = Column(Text)
    author = Column(String)
    image_url = Column(String)
    title_image_url = Column(String)
    context_images = Column(Text)  # JSON string of list
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    scheduled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    comments = relationship(
        "Comment",
        back_populates="article",
        cascade="all, delete-orphan",
        order_by="Comment.created_at",
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    article = relationship("Article", back_populates="comments")
    user = relationship("User", back_populates="comments")


class DailyFact(Base):
    __tablename__ = "daily_facts"
    
    id = Column(Integer, primary_key=True, index=True)
    fact = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Verification(Base):
    __tablename__ = "verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class FunZoneConfig(Base):
    __tablename__ = "funzone_config"

    id = Column(Integer, primary_key=True, index=True)
    riddle = Column(Text, default="{}")       # JSON
    rumor = Column(Text, default="{}")        # JSON
    charades = Column(Text, default="{}")     # JSON
    var_room = Column(Text, default="{}")     # JSON
    on_this_day = Column(Text, default="{}")  # JSON
    prediction = Column(Text, default="{}")   # JSON
    tic_tac_toe = Column(Text, default="{}")  # JSON
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    scheduled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class RewardLog(Base):
    __tablename__ = "reward_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    match_id = Column(Integer, index=True)
    result_points = Column(Integer, default=0)
    scoreline_points = Column(Integer, default=0)
    goalscorer_points = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    eligible_for_gift = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reward_logs")


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    match = relationship("Match")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String(200))
    message = Column(Text)
    link = Column(String(500), nullable=True) # Optional link to article or match
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
