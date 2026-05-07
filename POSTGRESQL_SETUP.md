# PostgreSQL Setup Guide for ChaosClub

## Prerequisites
- PostgreSQL 12+ installed on your machine
- Python 3.9+
- Virtual environment activated

## Step 1: Install PostgreSQL

### Windows
1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Note the password you set for the `postgres` user
4. Default port is `5432`
5. During installation, select pgAdmin 4 for easy database management

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create Database and User

### Using pgAdmin (GUI - Easiest)
1. Open pgAdmin 4
2. Right-click on "Databases" → Create → Database
3. Name: `chaosclub`
4. Click "Save"

### Using psql (Command Line)
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE chaosclub;

# Create user (optional, for security)
CREATE USER chaosclub_user WITH PASSWORD 'your_secure_password';
ALTER ROLE chaosclub_user SET client_encoding TO 'utf8';
ALTER ROLE chaosclub_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE chaosclub_user SET default_transaction_deferrable TO on;
ALTER ROLE chaosclub_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE chaosclub TO chaosclub_user;

# Verify
\l  # List all databases
\du # List all users
```

## Step 3: Update Environment Variables

### Create `.env` file in the `backend/` directory
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/chaosclub
```

Or if you created a separate user:
```
DATABASE_URL=postgresql://chaosclub_user:your_secure_password@localhost:5432/chaosclub
```

## Step 4: Update Requirements and Install

The requirements.txt has been updated with PostgreSQL dependencies:
- `sqlalchemy==2.0.23`
- `psycopg2-binary==2.9.9`

Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

## Step 5: Initialize Database

The database tables are automatically created when the server starts (`init_db()` runs in the startup event).

To seed with sample data:
```bash
cd backend
python -m seed
```

Or from Python:
```python
from seed import seed_database
seed_database()
```

## Step 6: Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## Step 7: Start the Frontend

In a new terminal:
```bash
cd frontend
npm run dev
```

## Troubleshooting

### "psycopg2: error: connection to server at localhost (127.0.0.1), port 5432 failed"
- PostgreSQL is not running. Start it:
  - Windows: Use Services app or pgAdmin
  - Mac: `brew services start postgresql`
  - Linux: `sudo systemctl start postgresql`

### "FATAL: Ident authentication failed"
- Update `postgresql.conf` to use `md5` or `scram-sha-256` authentication
- Or use the password you set during installation

### "password authentication failed"
- Check your DATABASE_URL has the correct password
- Use `psql -U postgres -h localhost` to verify credentials

### "database \"chaosclub\" does not exist"
- Create the database first using the steps above

## Verifying Connection

```bash
# Test connection
psql -U postgres -d chaosclub -h localhost
```

If successful, you'll see the PostgreSQL prompt:
```
psql (14.7)
Type "help" for help.

chaosclub=#
```

## Data Persistence

All data (users, matches, predictions, leaderboard, articles) now persists in PostgreSQL across server restarts!

## Backing Up Data

```bash
# Export database
pg_dump -U postgres chaosclub > chaosclub_backup.sql

# Restore database
psql -U postgres chaosclub < chaosclub_backup.sql
```
