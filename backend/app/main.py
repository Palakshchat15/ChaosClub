import json
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Query, Depends, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .auth import create_access_token
from .database import init_db, get_db, SessionLocal, User, Match as DBMatch, Prediction, MatchResult, LeaderboardRow as DBLeaderboardRow, Article as DBArticle, Comment as DBComment, DailyFact, FunZoneConfig, RewardLog, ChatLog, Notification
from .data import daily_fact, reward_log
from . import ai_service
from . import upload as upload_service
from . import sports_service
from . import email_service
from .schemas import (
    Article,
    ArticleCreateRequest,
    ArticleUpdateRequest,
    AuthResponse,
    CommentCreateRequest,
    CommentResponse,
    FunZoneConfigRequest,
    FunZoneConfigResponse,
    LeaderboardRow,
    LoginRequest,
    Match,
    MatchCreateRequest,
    MatchResultRequest,
    PredictionRequest,
    PredictionView,
    RegisterRequest,
    RewardResult,
    RewardLogResponse,
    SendCodeRequest,
    UpdateAvatarRequest,
    VerifyCodeRequest,
    UserUpdateBioRequest,
    UserStats,
    UserProfileResponse,
)

app = FastAPI(title="ChaosClub API", version="0.1.0")

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULT_POINTS = 5
SCORELINE_POINTS = 10
GOALSCORER_POINTS = 25
GIFT_THRESHOLD = 15


def _normalize_result_pick(result_pick: str) -> str:
    normalized = result_pick.strip().lower()
    valid = {"home", "draw", "away"}
    if normalized not in valid:
        raise HTTPException(status_code=400, detail="result_pick must be one of: home, draw, away")
    return normalized


def _derive_result(home_goals: int, away_goals: int) -> str:
    if home_goals > away_goals:
        return "home"
    if home_goals < away_goals:
        return "away"
    return "draw"


def _find_or_create_leaderboard_row(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    row = db.query(DBLeaderboardRow).filter(DBLeaderboardRow.user_id == user_id).first()
    if row:
        return row

    new_row = DBLeaderboardRow(user_id=user_id, points=0)
    db.add(new_row)
    db.commit()
    db.refresh(new_row)
    return new_row


def _resort_leaderboard(db: Session):
    rows = db.query(DBLeaderboardRow).all()
    # Rows are already ordered by points in the query
    pass


def _is_admin(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    return bool(user and user.role == "admin")


def _create_notification(db: Session, user_id: int, title: str, message: str, link: str = None):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link
    )
    db.add(notif)
    db.commit()
    return notif


def _settle_match_predictions(db: Session, match: DBMatch, home_goals: int, away_goals: int, goalscorers: list[str]) -> list[dict]:
    match.status = "finished"
    normalized_actual_result = _derive_result(home_goals, away_goals)
    normalized_scorers = sorted({name.strip().lower() for name in goalscorers if name.strip()})

    new_result = MatchResult(
        match_id=match.id,
        home_goals=home_goals,
        away_goals=away_goals,
        result=normalized_actual_result,
        goalscorers=json.dumps(normalized_scorers),
        finalized_at=datetime.now(timezone.utc),
    )
    db.add(new_result)
    db.commit()

    rows = []
    predictions = db.query(Prediction).filter(Prediction.match_id == match.id).all()
    
    for prediction in predictions:
        result_points = RESULT_POINTS if prediction.result_pick == normalized_actual_result else 0
        scoreline_points = (
            SCORELINE_POINTS
            if prediction.home_goals == home_goals and prediction.away_goals == away_goals
            else 0
        )
        predicted_scorers = sorted({name.strip().lower() for name in json.loads(prediction.goalscorers) if name.strip()})
        goalscorer_points = GOALSCORER_POINTS if predicted_scorers == normalized_scorers and normalized_scorers else 0

        total_points = result_points + scoreline_points + goalscorer_points
        row = _find_or_create_leaderboard_row(db, prediction.user_id)
        row.points += total_points
        row.monthly_points += total_points
        
        db_reward = RewardLog(
            user_id=prediction.user_id,
            match_id=match.id,
            result_points=result_points,
            scoreline_points=scoreline_points,
            goalscorer_points=goalscorer_points,
            total_points=total_points,
            eligible_for_gift=total_points >= GIFT_THRESHOLD,
        )
        db.add(db_reward)
        db.commit()

        _create_notification(
            db, 
            prediction.user_id, 
            "Match Settled!", 
            f"Result for {match.home_team} vs {match.away_team} is out. You earned {total_points} points!",
            "/profile"
        )

        rows.append({
            "user_id": prediction.user_id,
            "match_id": match.id,
            "result_points": result_points,
            "scoreline_points": scoreline_points,
            "goalscorer_points": goalscorer_points,
            "total_points": total_points,
            "eligible_for_gift": total_points >= GIFT_THRESHOLD,
        })
    return rows


@app.get("/health")
def health():
    return {"status": "ok", "service": "chaosclub-api"}


@app.get("/debug/predictions")
def debug_predictions(db: Session = Depends(get_db)):
    predictions = db.query(Prediction).all()
    return {
        "all_predictions": [
            {
                "match_id": p.match_id,
                "user_id": p.user_id,
                "result_pick": p.result_pick,
                "home_goals": p.home_goals,
                "away_goals": p.away_goals,
                "goalscorers": json.loads(p.goalscorers) if p.goalscorers else [],
                "locked_at": p.locked_at.isoformat(),
            }
            for p in predictions
        ],
        "total": len(predictions)
    }


@app.post("/api/auth/send-verification-code")
def send_code(payload: SendCodeRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    import random
    from .email_service import send_verification_email
    from .database import Verification
    
    # Check if user already exists
    user_exists = db.query(User).filter(User.email.ilike(payload.email)).first()
    if user_exists:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Store in DB
    new_verification = Verification(email=payload.email.lower(), code=code)
    db.add(new_verification)
    db.commit()
    
    # LOG TO CONSOLE FOR TESTING (in case email fails)
    print(f"\n--- VERIFICATION CODE for {payload.email}: {code} ---\n")

    # Send email in background to avoid blocking
    background_tasks.add_task(send_verification_email, payload.email, code)
    
    return {"ok": True}


@app.post("/api/auth/verify-code")
def verify_code(payload: VerifyCodeRequest, db: Session = Depends(get_db)):
    from .database import Verification
    
    # Get latest code for this email
    v = db.query(Verification).filter(
        Verification.email.ilike(payload.email),
        Verification.code == payload.code
    ).order_by(Verification.created_at.desc()).first()
    
    if not v:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Check expiry (10 mins)
    elapsed = (datetime.now(timezone.utc) - v.created_at.replace(tzinfo=timezone.utc)).total_seconds()
    if elapsed > 600:
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    return {"ok": True}


@app.post("/api/auth/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email.ilike(payload.email)).first()
    if exists:
        raise HTTPException(status_code=409, detail="Email already registered")

    from .auth import hash_password
    new_user = User(
        name=payload.name,
        email=payload.email.lower(),
        password=hash_password(payload.password),
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "token": create_access_token(new_user),
        "user_id": new_user.id,
        "name": new_user.name,
        "role": new_user.role,
        "avatar_url": new_user.avatar_url,
    }


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    from .auth import verify_password
    user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "token": create_access_token(user),
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "avatar_url": user.avatar_url,
    }


@app.get("/api/articles", response_model=list[Article])
def list_articles(db: Session = Depends(get_db)):
    # Calculate the cutoff date (30 days ago)
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Filter articles to only show those published in the last 30 days and not scheduled for future
    articles_with_avatars = db.query(DBArticle, User.avatar_url).outerjoin(
        User, User.name == DBArticle.author
    ).filter(
        DBArticle.created_at >= cutoff_date,
        DBArticle.scheduled_at <= datetime.now(timezone.utc)
    ).order_by(DBArticle.scheduled_at.desc()).all()

    return [
        {
            "id": a.id,
            "category": a.category,
            "title": a.title,
            "excerpt": a.excerpt,
            "content": a.content,
            "author": a.author,
            "author_avatar_url": avatar_url,
            "image_url": a.image_url,
            "title_image_url": a.title_image_url,
            "context_images": json.loads(a.context_images) if a.context_images else [],
            "created_at": a.created_at,
            "scheduled_at": a.scheduled_at,
        }
        for a, avatar_url in articles_with_avatars
    ]


@app.post("/api/admin/articles", response_model=Article)
def create_article(payload: ArticleCreateRequest, admin_user_id: int = Query(...), background_tasks: BackgroundTasks = BackgroundTasks(), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")

    admin = db.query(User).filter(User.id == admin_user_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found")

    context_images = [url.strip() for url in payload.context_images if url.strip()] if payload.context_images else []
    
    new_article = DBArticle(
        category=payload.category.strip(),
        title=payload.title.strip(),
        excerpt=payload.excerpt.strip(),
        content=payload.content.strip(),
        author=admin.name,
        image_url=payload.title_image_url.strip() if payload.title_image_url else None,
        title_image_url=payload.title_image_url.strip() if payload.title_image_url else None,
        context_images=json.dumps(context_images),
        created_at=datetime.now(timezone.utc),
        scheduled_at=payload.scheduled_at if payload.scheduled_at else datetime.now(timezone.utc),
    )
    try:
        db.add(new_article)
        db.commit()
        db.refresh(new_article)
        
        # Notify all users in background
        if background_tasks:
            async def notify_all():
                # Re-open session for background
                local_db = SessionLocal()
                try:
                    all_users = local_db.query(User).all()
                    for u in all_users:
                        _create_notification(
                            local_db, 
                            u.id, 
                            "New Article Published!", 
                            f"{new_article.category}: {new_article.title}",
                            f"/news/{new_article.id}"
                        )
                        # Send real email alert
                        if u.email:
                            await email_service.send_new_article_email(u.email, new_article.title, new_article.id)
                    local_db.commit()
                finally:
                    local_db.close()
            
            background_tasks.add_task(notify_all)
    except Exception as e:
        db.rollback()
        print(f"ERROR in create_article: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save article: {str(e)}")
    
    return {
        "id": new_article.id,
        "category": new_article.category,
        "title": new_article.title,
        "excerpt": new_article.excerpt,
        "content": new_article.content,
        "author": new_article.author,
        "image_url": new_article.image_url,
        "title_image_url": new_article.title_image_url,
        "context_images": json.loads(new_article.context_images) if new_article.context_images else [],
        "created_at": new_article.created_at,
        "scheduled_at": new_article.scheduled_at,
    }


@app.put("/api/admin/articles/{article_id}", response_model=Article)
def update_article(article_id: int, payload: ArticleUpdateRequest, admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    article = db.query(DBArticle).filter(DBArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    context_images = [url.strip() for url in payload.context_images if url.strip()] if payload.context_images else []
    article.category = payload.category.strip()
    article.title = payload.title.strip()
    article.excerpt = payload.excerpt.strip()
    article.content = payload.content.strip()
    article.image_url = payload.title_image_url.strip() if payload.title_image_url else None
    article.title_image_url = payload.title_image_url.strip() if payload.title_image_url else None
    article.context_images = json.dumps(context_images)
    if payload.scheduled_at:
        article.scheduled_at = payload.scheduled_at
    db.commit()
    db.refresh(article)
    return {
        "id": article.id, "category": article.category, "title": article.title,
        "excerpt": article.excerpt, "content": article.content, "author": article.author,
        "image_url": article.image_url, "title_image_url": article.title_image_url,
        "context_images": json.loads(article.context_images) if article.context_images else [],
        "created_at": article.created_at,
        "scheduled_at": article.scheduled_at,
    }


@app.delete("/api/admin/articles/{article_id}")
def delete_article(article_id: int, admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    article = db.query(DBArticle).filter(DBArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    return {"ok": True, "deleted_id": article_id}


# ─── Comments ───────────────────────────────────────────────────────────────

@app.get("/api/articles/{article_id}/comments", response_model=list[CommentResponse])
def list_comments(article_id: int, db: Session = Depends(get_db)):
    article = db.query(DBArticle).filter(DBArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    comments = db.query(DBComment).filter(DBComment.article_id == article_id).order_by(DBComment.created_at).all()
    return [
        {
            "id": c.id, "article_id": c.article_id, "user_id": c.user_id,
            "author": c.user.name if c.user else "Unknown",
            "body": c.body, "created_at": c.created_at,
            "avatar_url": c.user.avatar_url if c.user else None,
        }
        for c in comments
    ]


@app.post("/api/articles/{article_id}/comments", response_model=CommentResponse)
def create_comment(article_id: int, payload: CommentCreateRequest, db: Session = Depends(get_db)):
    article = db.query(DBArticle).filter(DBArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    comment = DBComment(article_id=article_id, user_id=payload.user_id, body=payload.body.strip())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id, "article_id": comment.article_id, "user_id": comment.user_id,
        "author": user.name, "body": comment.body, "created_at": comment.created_at,
        "avatar_url": user.avatar_url,
    }


@app.put("/api/articles/{article_id}/comments/{comment_id}", response_model=CommentResponse)
def update_comment(article_id: int, comment_id: int, payload: CommentCreateRequest, db: Session = Depends(get_db)):
    comment = db.query(DBComment).filter(DBComment.id == comment_id, DBComment.article_id == article_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != payload.user_id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this comment")
    comment.body = payload.body.strip()
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id, "article_id": comment.article_id, "user_id": comment.user_id,
        "author": comment.user.name, "body": comment.body, "created_at": comment.created_at,
        "avatar_url": comment.user.avatar_url if comment.user else None,
    }


@app.delete("/api/articles/{article_id}/comments/{comment_id}")
def delete_comment(article_id: int, comment_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    comment = db.query(DBComment).filter(DBComment.id == comment_id, DBComment.article_id == article_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    caller = db.query(User).filter(User.id == user_id).first()
    if not caller:
        raise HTTPException(status_code=404, detail="User not found")
    if comment.user_id != user_id and caller.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to delete this comment")
    db.delete(comment)
    db.commit()
    return {"ok": True, "deleted_id": comment_id}


@app.get("/api/users/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate stats
    predictions = db.query(Prediction).filter(Prediction.user_id == user_id).all()
    results = db.query(MatchResult).all()
    results_map = {r.match_id: r for r in results}
    
    total_preds = len(predictions)
    correct_results = 0
    perfect_scores = 0
    
    for p in predictions:
        res = results_map.get(p.match_id)
        if res:
            # Correct result?
            if p.result_pick == res.result:
                correct_results += 1
                # Perfect score?
                if p.home_goals == res.home_goals and p.away_goals == res.away_goals:
                    perfect_scores += 1
    
    accuracy = (correct_results / total_preds * 100) if total_preds > 0 else 0.0
    
    # Get points from leaderboard
    total_points = user.leaderboard.points if user.leaderboard else 0
    monthly_points = user.leaderboard.monthly_points if user.leaderboard else 0
    
    # DYNAMIC BADGES (Awarded based on stats)
    badges = json.loads(user.badges) if user.badges else []
    if total_points >= 100 and "Centurion" not in badges: badges.append("Centurion")
    if total_preds >= 10 and "Club Legend" not in badges: badges.append("Club Legend")
    if accuracy >= 50 and total_preds >= 5 and "Sharpshooter" not in badges: badges.append("Sharpshooter")
    if perfect_scores >= 1 and "Sniper" not in badges: badges.append("Sniper")
    if monthly_points >= 50 and "Monthly Star" not in badges: badges.append("Monthly Star")
    
    return {
        "id": user.id,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "badges": badges,
        "stats": {
            "total_points": total_points,
            "monthly_points": monthly_points,
            "total_predictions": total_preds,
            "correct_results": correct_results,
            "perfect_scores": perfect_scores,
            "accuracy_percentage": round(accuracy, 1),
        }
    }


@app.put("/api/users/{user_id}/bio")
def update_user_bio(user_id: int, payload: UserUpdateBioRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.bio = payload.bio
    db.commit()
    return {"message": "Bio updated successfully"}


@app.get("/api/notifications")
def get_notifications(user_id: int = Query(...), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifs
    ]


@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"ok": True}


@app.get("/api/users/{user_id}/predictions")
def get_user_predictions(user_id: int, db: Session = Depends(get_db)):
    predictions = db.query(Prediction).filter(Prediction.user_id == user_id).all()
    results = db.query(MatchResult).all()
    results_map = {r.match_id: r for r in results}
    
    history = []
    for p in predictions:
        res = results_map.get(p.match_id)
        match = p.match
        
        # Find reward for this specific match
        reward = db.query(RewardLog).filter(RewardLog.user_id == user_id, RewardLog.match_id == p.match_id).first()
        
        history.append({
            "id": p.id,
            "match_id": p.match_id,
            "teams": f"{match.home_team} vs {match.away_team}",
            "kickoff_at": match.kickoff_at,
            "prediction": {
                "result_pick": p.result_pick,
                "score": f"{p.home_goals}-{p.away_goals}",
                "goalscorers": json.loads(p.goalscorers) if p.goalscorers else []
            },
            "actual": {
                "result": res.result if res else None,
                "score": f"{res.home_goals}-{res.away_goals}" if res else None,
                "goalscorers": json.loads(res.goalscorers) if res and res.goalscorers else []
            } if res else None,
            "is_settled": res is not None,
            "points_earned": reward.total_points if reward else 0
        })
    
    return sorted(history, key=lambda x: x["kickoff_at"], reverse=True)


@app.get("/api/matches/upcoming", response_model=list[Match])
def list_upcoming_matches(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    matches = db.query(DBMatch).filter(
        DBMatch.kickoff_at > now,
        DBMatch.status == "upcoming"
    ).all()
    return [
        {
            "id": m.id,
            "home_team": m.home_team,
            "away_team": m.away_team,
            "kickoff_at": m.kickoff_at,
            "status": m.status,
            "competition": m.competition,
            "venue": m.venue,
            "external_id": m.external_id,
        }
        for m in matches
    ]


@app.get("/api/matches", response_model=list[Match])
def list_matches(db: Session = Depends(get_db)):
    matches = db.query(DBMatch).order_by(DBMatch.kickoff_at).all()
    return [
        {
            "id": m.id,
            "home_team": m.home_team,
            "away_team": m.away_team,
            "kickoff_at": m.kickoff_at,
            "status": m.status,
            "competition": m.competition,
            "venue": m.venue,
            "external_id": m.external_id,
        }
        for m in matches
    ]


@app.post("/api/matches/{match_id}/prediction")
def submit_prediction(match_id: int, payload: PredictionRequest, db: Session = Depends(get_db)):
    match = db.query(DBMatch).filter(DBMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.kickoff_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Prediction locked after kickoff")

    existing = db.query(Prediction).filter(
        Prediction.match_id == match_id,
        Prediction.user_id == payload.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Prediction already submitted")

    goalscorers = [name.strip().lower() for name in payload.goalscorers if name.strip()]
    new_prediction = Prediction(
        match_id=match_id,
        user_id=payload.user_id,
        result_pick=_normalize_result_pick(payload.result_pick),
        home_goals=payload.home_goals,
        away_goals=payload.away_goals,
        goalscorers=json.dumps(goalscorers),
        locked_at=datetime.now(timezone.utc),
    )
    db.add(new_prediction)
    db.commit()
    
    return {
        "message": "Prediction saved and locked",
        "kickoff_at": match.kickoff_at,
        "timer_seconds": int((match.kickoff_at - datetime.now(timezone.utc)).total_seconds()),
    }


@app.get("/api/matches/{match_id}/prediction/me", response_model=PredictionView)
def get_my_prediction(match_id: int, user_id: int, db: Session = Depends(get_db)):
    match = db.query(DBMatch).filter(DBMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc)
    if now < match.kickoff_at:
        raise HTTPException(status_code=403, detail="Prediction becomes visible after kickoff")

    prediction = db.query(Prediction).filter(
        Prediction.match_id == match_id,
        Prediction.user_id == user_id
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    return {
        "match_id": prediction.match_id,
        "user_id": prediction.user_id,
        "result_pick": prediction.result_pick,
        "home_goals": prediction.home_goals,
        "away_goals": prediction.away_goals,
        "goalscorers": json.loads(prediction.goalscorers) if prediction.goalscorers else [],
        "locked_at": prediction.locked_at,
    }


@app.get("/api/admin/matches/discover")
def discover_matches(league_id: str = Query("39"), admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        api_response = sports_service.fetch_upcoming_matches(league_id)
        cleaned = []
        for item in api_response:
            f = item["fixture"]
            t = item["teams"]
            cleaned.append({
                "external_id": f["id"],
                "home_team": t["home"]["name"],
                "away_team": t["away"]["name"],
                "kickoff_at": f["date"],
                "venue": f["venue"] if isinstance(f["venue"], str) else f["venue"].get("name", "Unknown Venue"),
                "competition": item["league"]["name"]
            })
        return cleaned
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")


@app.post("/api/admin/matches/import")
def import_match(payload: dict, admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    # 1. Check if this exact API match is already imported
    exists = db.query(DBMatch).filter(DBMatch.external_id == payload["external_id"]).first()
    if exists:
        return {"message": "Match already exists", "id": exists.id}
    
    # 2. Smart Link: Check if a manual match with the same teams exists (to avoid duplicates)
    # We allow some flexibility in team names and check date
    kickoff = datetime.fromisoformat(payload["kickoff_at"].replace("Z", "+00:00"))
    manual_match = db.query(DBMatch).filter(
        DBMatch.home_team.ilike(f"%{payload['home_team'][:5]}%"),
        DBMatch.away_team.ilike(f"%{payload['away_team'][:5]}%"),
        DBMatch.external_id == None
    ).first()

    if manual_match:
        # Link the existing manual match to the API
        manual_match.external_id = payload["external_id"]
        manual_match.kickoff_at = kickoff # Sync exact time
        db.commit()
        return {"message": "Existing match linked to API", "id": manual_match.id}
    
    # 3. Create new if no match found
    new_match = DBMatch(
        external_id=payload["external_id"],
        home_team=payload["home_team"],
        away_team=payload["away_team"],
        kickoff_at=kickoff,
        competition=payload["competition"],
        venue=payload["venue"],
        status="upcoming"
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    return {"message": "Match imported successfully", "id": new_match.id}


@app.post("/api/admin/matches/sync-results")
def sync_results(admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    # Get matches that are "upcoming" but kickoff has passed
    now = datetime.now(timezone.utc)
    matches_to_sync = db.query(DBMatch).filter(
        DBMatch.external_id != None,
        DBMatch.status == "upcoming",
        DBMatch.kickoff_at < now
    ).all()
    
    results_found = 0
    for match in matches_to_sync:
        try:
            status_data = sports_service.fetch_match_status(match.external_id)
            if status_data and status_data["status"] == "FT":
                # Match is finished!
                scorers = sports_service.fetch_match_events(match.external_id)
                _settle_match_predictions(
                    db, 
                    match, 
                    status_data["home_goals"], 
                    status_data["away_goals"], 
                    scorers
                )
                results_found += 1
        except Exception as e:
            print(f"Error syncing match {match.id}: {e}")
            
    return {"message": f"Checked {len(matches_to_sync)} matches. Found {results_found} results settled."}


@app.post("/api/admin/matches", response_model=Match)
def create_match(payload: MatchCreateRequest, admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")

    new_match = DBMatch(
        home_team=payload.home_team,
        away_team=payload.away_team,
        kickoff_at=payload.kickoff_at,
        status="upcoming",
        competition=payload.competition,
        venue=payload.venue,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    
    return {
        "id": new_match.id,
        "home_team": new_match.home_team,
        "away_team": new_match.away_team,
        "kickoff_at": new_match.kickoff_at,
        "status": new_match.status,
        "competition": new_match.competition,
        "venue": new_match.venue,
    }


@app.get("/api/admin/matches/{match_id}/fetch-external-result")
def fetch_external_result(match_id: int, admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    match = db.query(DBMatch).filter(DBMatch.id == match_id).first()
    if not match or not match.external_id:
        raise HTTPException(status_code=404, detail="Match not linked to API")
    
    try:
        status_data = sports_service.fetch_match_status(match.external_id)
        if not status_data:
            raise HTTPException(status_code=404, detail="No data found on API")
            
        scorers = sports_service.fetch_match_events(match.external_id)
        return {
            "home_goals": status_data["home_goals"],
            "away_goals": status_data["away_goals"],
            "scorers": scorers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/matches/{match_id}/result", response_model=list[RewardResult])
def publish_match_result(match_id: int, payload: MatchResultRequest, admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")

    match = db.query(DBMatch).filter(DBMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    existing_result = db.query(MatchResult).filter(MatchResult.match_id == match_id).first()
    if existing_result:
        raise HTTPException(status_code=409, detail="Match result already published")

    return _settle_match_predictions(db, match, payload.home_goals, payload.away_goals, payload.goalscorers)


@app.get("/api/leaderboard", response_model=list[LeaderboardRow])
def get_leaderboard(scope: str = "all_time", db: Session = Depends(get_db)):
    if scope == "weekly":
        scope = "monthly"
        
    if scope not in {"all_time", "monthly"}:
        raise HTTPException(status_code=400, detail="scope must be all_time, monthly, or weekly")
    
    if scope == "monthly":
        rows = db.query(DBLeaderboardRow).join(User).order_by(DBLeaderboardRow.monthly_points.desc()).all()
    else:
        rows = db.query(DBLeaderboardRow).join(User).order_by(DBLeaderboardRow.points.desc()).all()
    
    result = []
    for idx, row in enumerate(rows, start=1):
        points = row.monthly_points if scope == "monthly" else row.points
        
        result.append({
            "rank": idx,
            "fan": row.user.name,
            "points": points,
            "avatar_url": row.user.avatar_url,
        })
    
    return result

@app.post("/api/admin/reset_monthly_points")
def reset_monthly_points(admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    db.query(DBLeaderboardRow).update({"monthly_points": 0})
    db.commit()
    return {"ok": True, "message": "Monthly points reset to 0 for all users."}


@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...), folder: str = Query(default="general")):
    """Upload an image to Cloudinary and return the CDN URL."""
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, or WebP images are allowed.")
    
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="Image too large. Maximum size is 10MB.")
    
    try:
        url = upload_service.upload_image(contents, folder=folder)
        return {"url": url}
    except Exception as e:
        print(f"ERROR in upload_image: {e}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


@app.post("/api/users/{user_id}/avatar")
def update_avatar(user_id: int, payload: UpdateAvatarRequest, db: Session = Depends(get_db)):
    """Save the Cloudinary avatar URL for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(user)
    return {
        "user_id": user.id,
        "avatar_url": user.avatar_url,
    }


cached_fact = {"date": None, "fact": None}  # reset forces fresh generation on next request

@app.get("/api/facts/today")
def get_daily_fact(db: Session = Depends(get_db)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # 1. Check if we already have a fact for today in the database
    # We check if the last fact in DB was created today
    today_fact = db.query(DailyFact).filter(
        DailyFact.created_at >= datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    ).first()
    
    if today_fact:
        return {"date": today_str, "fact": today_fact.fact}
    
    # 2. No fact for today, let's generate one. 
    # Fetch last 10 facts to avoid repeats
    recent_facts = db.query(DailyFact).order_by(DailyFact.created_at.desc()).limit(10).all()
    avoid_list = [f.fact for f in recent_facts]
    
    new_fact_text = ai_service.generate_daily_fact(today_str, avoid_list=avoid_list)
    
    # 3. Save to database
    db_fact = DailyFact(fact=new_fact_text)
    db.add(db_fact)
    db.commit()
    db.refresh(db_fact)
    
    return {"date": today_str, "fact": new_fact_text}


@app.get("/api/rewards", response_model=list[RewardLogResponse])
def get_rewards(db: Session = Depends(get_db)):
    rewards = db.query(RewardLog).join(User).order_by(RewardLog.created_at.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "fan_name": r.user.name,
            "match_id": r.match_id,
            "result_points": r.result_points,
            "scoreline_points": r.scoreline_points,
            "goalscorer_points": r.goalscorer_points,
            "total_points": r.total_points,
            "eligible_for_gift": r.eligible_for_gift,
            "created_at": r.created_at,
        }
        for r in rewards
    ]


# ─── Fun Zone ───────────────────────────────────────────────────────────────

@app.post("/api/admin/funzone/generate", response_model=FunZoneConfigResponse)
def generate_funzone_config(admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ai_data = ai_service.generate_funzone_content(today_str)
    
    if not ai_data or "error" in ai_data:
        raise HTTPException(status_code=500, detail="Failed to generate AI content.")
        
    config = db.query(FunZoneConfig).filter(FunZoneConfig.scheduled_at == datetime.now(timezone.utc).replace(second=0, microsecond=0)).first()
    if not config:
        config = FunZoneConfig(scheduled_at=datetime.now(timezone.utc).replace(second=0, microsecond=0))
        db.add(config)
        
    config.riddle = json.dumps(ai_data.get("riddle", []))
    config.rumor = json.dumps(ai_data.get("rumor", []))
    config.charades = json.dumps(ai_data.get("charades", []))
    config.prediction = json.dumps(ai_data.get("prediction", []))
    config.on_this_day = json.dumps(ai_data.get("on_this_day", {}))
    config.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(config)
    return config

@app.get("/api/funzone/current", response_model=FunZoneConfigResponse)
def get_funzone_config(db: Session = Depends(get_db)):
    # Get the latest config that is scheduled for now or earlier
    config = db.query(FunZoneConfig).filter(
        FunZoneConfig.scheduled_at <= datetime.now(timezone.utc)
    ).order_by(FunZoneConfig.scheduled_at.desc()).first()
    
    if not config:
        # Fallback to creating a default if none exists
        config = FunZoneConfig(scheduled_at=datetime.now(timezone.utc))
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@app.put("/api/admin/funzone", response_model=FunZoneConfigResponse)
def update_funzone_config(payload: FunZoneConfigRequest, admin_user_id: int = Query(...), db: Session = Depends(get_db)):
    if not _is_admin(db, admin_user_id):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    # If a config exists for this exact scheduled time, update it. Otherwise create new.
    target_time = payload.scheduled_at if payload.scheduled_at else datetime.now(timezone.utc)
    config = db.query(FunZoneConfig).filter(FunZoneConfig.scheduled_at == target_time).first()
    if not config:
        config = FunZoneConfig(scheduled_at=target_time)
        db.add(config)
    
    config.riddle = payload.riddle
    config.rumor = payload.rumor
    config.charades = payload.charades
    config.var_room = payload.var_room
    config.on_this_day = payload.on_this_day
    config.prediction = payload.prediction
    config.tic_tac_toe = payload.tic_tac_toe
    
    db.commit()
    db.refresh(config)
    return config

@app.post("/api/funzone/vote/{game_type}")
def vote_funzone(game_type: str, vote: str = Query(...), index: int = Query(0), db: Session = Depends(get_db)):
    config = db.query(FunZoneConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="FunZone config not found")
        
    try:
        # Determine which field to update
        if game_type == "rumor":
            field_data = config.rumor
        elif game_type == "var_room":
            field_data = config.var_room
        elif game_type == "prediction":
            field_data = config.prediction
        else:
            raise HTTPException(status_code=400, detail="Invalid game type for voting")
            
        # Parse JSON
        try:
            data = json.loads(field_data) if field_data else {}
        except json.JSONDecodeError:
            data = {}
            
        is_array = isinstance(data, list)
        items = data if is_array else [data] if data else [{}]
        
        if index >= len(items):
            index = 0
            
        target_item = items[index]
            
        # Initialize votes if not present
        if "votes" not in target_item:
            target_item["votes"] = {}
        if vote not in target_item["votes"]:
            target_item["votes"][vote] = 0
            
        target_item["votes"][vote] += 1
        
        # Save back
        updated_json = json.dumps(items if is_array else items[0])
        if game_type == "rumor":
            config.rumor = updated_json
        elif game_type == "var_room":
            config.var_room = updated_json
        elif game_type == "prediction":
            config.prediction = updated_json
            
        db.commit()
        return {"ok": True, "votes": target_item["votes"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, match_id: int):
        await websocket.accept()
        if match_id not in self.active_connections:
            self.active_connections[match_id] = []
        self.active_connections[match_id].append(websocket)

    def disconnect(self, websocket: WebSocket, match_id: int):
        if match_id in self.active_connections:
            self.active_connections[match_id].remove(websocket)

    async def broadcast(self, message: dict, match_id: int):
        if match_id in self.active_connections:
            for connection in self.active_connections[match_id]:
                await connection.send_json(message)

manager = ConnectionManager()


@app.websocket("/ws/chat/{match_id}")
async def websocket_endpoint(websocket: WebSocket, match_id: int, user_id: int = Query(...)):
    await manager.connect(websocket, match_id)
    db = SessionLocal()
    try:
        # Load previous messages
        history = db.query(ChatLog).filter(ChatLog.match_id == match_id).order_by(ChatLog.created_at.desc()).limit(20).all()
        history_list = [
            {
                "user_name": h.user.name,
                "user_avatar": h.user.avatar_url,
                "message": h.message,
                "created_at": h.created_at.isoformat()
            }
            for h in reversed(history)
        ]
        await websocket.send_json({"type": "history", "data": history_list})

        while True:
            data = await websocket.receive_text()
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                continue
                
            # Persist
            new_log = ChatLog(match_id=match_id, user_id=user_id, message=data)
            db.add(new_log)
            db.commit()
            
            # Broadcast
            await manager.broadcast({
                "type": "message",
                "user_name": user.name,
                "user_avatar": user.avatar_url,
                "message": data,
                "created_at": datetime.now(timezone.utc).isoformat()
            }, match_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, match_id)
    finally:
        db.close()

