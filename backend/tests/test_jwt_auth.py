import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

TEST_DB_PATH = Path(__file__).with_name("test_jwt_auth.db")
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["JWT_EXPIRATION_MINUTES"] = "60"

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.auth import get_current_admin, get_current_user
from app.database import Base, Match, Prediction, SessionLocal, User, engine
from app.main import create_match, login, register, submit_prediction
from app.schemas import LoginRequest, MatchCreateRequest, PredictionRequest, RegisterRequest


class JwtAuthTests(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        if TEST_DB_PATH.exists():
            TEST_DB_PATH.unlink()

    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        db = SessionLocal()
        try:
            db.add(
                User(
                    name="Chaos Admin",
                    email="admin@chaosclub.com",
                    password="admin123",
                    role="admin",
                )
            )
            db.add(
                User(
                    name="PitchMaster",
                    email="fan@chaosclub.com",
                    password="fan12345",
                    role="user",
                )
            )
            db.add(
                Match(
                    home_team="Liverpool",
                    away_team="Arsenal",
                    kickoff_at=datetime.now(timezone.utc) + timedelta(days=2),
                    status="upcoming",
                    competition="Premier League",
                    venue="Anfield",
                )
            )
            db.commit()
        finally:
            db.close()

    def _get_user_from_token(self, token: str, db):
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        return get_current_user(credentials=credentials, db=db)

    def test_login_upgrades_legacy_password_and_returns_token(self):
        db = SessionLocal()
        try:
            payload = login(LoginRequest(email="fan@chaosclub.com", password="fan12345"), db=db)
            self.assertIn("token", payload)
            self.assertEqual(payload["role"], "user")

            user = db.query(User).filter(User.email == "fan@chaosclub.com").first()
            self.assertIsNotNone(user)
            self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        finally:
            db.close()

    def test_prediction_uses_authenticated_user_identity(self):
        db = SessionLocal()
        try:
            auth_payload = register(
                RegisterRequest(
                    name="GoalSeer",
                    email="goalseer@chaosclub.com",
                    password="fan12345",
                ),
                db=db,
            )
            current_user = self._get_user_from_token(auth_payload["token"], db)

            response = submit_prediction(
                match_id=1,
                payload=PredictionRequest(
                    result_pick="home",
                    home_goals=2,
                    away_goals=1,
                    goalscorers=["Salah"],
                ),
                current_user=current_user,
                db=db,
            )

            self.assertEqual(response["message"], "Prediction saved and locked")
            prediction = db.query(Prediction).first()
            self.assertIsNotNone(prediction)
            self.assertEqual(prediction.user_id, auth_payload["user_id"])
        finally:
            db.close()

    def test_regular_user_cannot_access_admin_route(self):
        db = SessionLocal()
        try:
            auth_payload = login(LoginRequest(email="fan@chaosclub.com", password="fan12345"), db=db)
            current_user = self._get_user_from_token(auth_payload["token"], db)

            with self.assertRaises(HTTPException) as exc:
                create_match(
                    payload=MatchCreateRequest(
                        home_team="Barcelona",
                        away_team="Atletico",
                        kickoff_at=datetime.now(timezone.utc) + timedelta(days=4),
                        competition="La Liga",
                        venue="Camp Nou",
                    ),
                    admin=get_current_admin(current_user),
                    db=db,
                )

            self.assertEqual(exc.exception.status_code, 403)
        finally:
            db.close()

    def test_admin_can_access_admin_route(self):
        db = SessionLocal()
        try:
            auth_payload = login(LoginRequest(email="admin@chaosclub.com", password="admin123"), db=db)
            current_user = self._get_user_from_token(auth_payload["token"], db)

            payload = create_match(
                payload=MatchCreateRequest(
                    home_team="Barcelona",
                    away_team="Atletico",
                    kickoff_at=datetime.now(timezone.utc) + timedelta(days=4),
                    competition="La Liga",
                    venue="Camp Nou",
                ),
                admin=get_current_admin(current_user),
                db=db,
            )

            self.assertEqual(payload["home_team"], "Barcelona")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
