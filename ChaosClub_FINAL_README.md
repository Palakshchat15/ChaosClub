# Chaos Club - Fullstack Starter

Chaos Club is a football fan platform built from your visual direction:
- Dark premium UI with neon green accents
- News feed and article cards
- Match prediction center
- Weekly/all-time leaderboard
- Login + signup screens

This project now includes both a working frontend and backend starter.

---

## Stack Implemented

### Frontend
- React (Vite)
- React Router
- Custom CSS theme matching your screenshots

### Backend
- FastAPI
- In-memory seed data (ready to swap for PostgreSQL later)
- CORS enabled for local frontend integration

---

## Project Structure

```text
chaos/
  frontend/
    src/
      components/
      data/
      pages/
      App.jsx
      index.css
      main.jsx
  backend/
    app/
      __init__.py
      data.py
      main.py
      schemas.py
    requirements.txt
  ChaosClub_FINAL_README.md
```

---

## Run The Project

### 1) Start Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend docs:
- http://127.0.0.1:8000/docs

### 2) Start Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend:
- http://127.0.0.1:5173

---

## API Endpoints Implemented

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Content
- `GET /api/articles`

### Prediction
- `GET /api/matches/upcoming`
- `POST /api/matches/{match_id}/prediction`

### Leaderboard and AI
- `GET /api/leaderboard?scope=all_time`
- `GET /api/leaderboard?scope=weekly`
- `GET /api/facts/today`

---

## What To Build Next

1. Connect frontend pages to backend APIs
2. Add persistent database (PostgreSQL + ORM)
3. Add admin panel for articles/matches/results
4. Implement JWT auth with protected routes
5. Add point engine and result settlement job

---

Built for football fans.
