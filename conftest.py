import os
from datetime import date

import pytest

# security. never run the suite against a real database
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://localhost/newkal_test")
db_name = TEST_DATABASE_URL.split("?")[0].rsplit("/", 1)[-1]
assert "test" in db_name, f"refusing to run tests against database {db_name!r}" # no test in url, not a test db.

# database.py and app.py read these at import time, so set them BEFORE importing either
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["SECRET_KEY"] = "test-secret-key"

from psycopg2.extras import Json                        # noqa: E402
from werkzeug.security import generate_password_hash    # noqa: E402
from database import get_db                             # noqa: E402

@pytest.fixture(autouse=True)
def clean_db():
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("TRUNCATE users, topics, daily_log RESTART IDENTITY CASCADE")


@pytest.fixture
def today(monkeypatch):
    fixed = date(2026, 11, 20)
    for target in ("app.user_today", "retention.user_today", "inbox.user_today"):
        monkeypatch.setattr(target, lambda: fixed)
    return fixed


@pytest.fixture
def client():
    from app import app, limiter
    app.config.update(TESTING=True)
    limiter.enabled = False
    return app.test_client()


@pytest.fixture
def login_as(client):
    def _login(user_id, tz="America/New_York"):
        with client.session_transaction() as sess:
            sess["user_id"] = user_id
            sess["tz"] = tz
    return _login


@pytest.fixture
def make_user():
    def _make(username="alice"):
        with get_db() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, generate_password_hash("pw-for-tests")),
            )
            return cur.fetchone()[0]
    return _make


@pytest.fixture
def make_topic(today):
    def _make(user_id, name="Binary search", step=0, next_review=None, log=None, level="Beginner"):
        with get_db() as conn, conn.cursor() as cur:
            cur.execute(
                """INSERT INTO topics
                       (name, progress, created_at, interval_step, next_review, level, review_log, user_id)
                   VALUES (%s, 0, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (name, today, step, next_review or today, level, Json(log or []), user_id),
            )
            return cur.fetchone()[0]
    return _make


@pytest.fixture
def log_entry():
    def _entry(rating=75, step=1, offset=0, due="2026-11-25", completed_on="2026-11-18"):
        return {"date": due, "rating": rating, "interval_step": step,
                "offset_days": offset, "completed_on": completed_on}
    return _entry


@pytest.fixture
def make_daily_Log(today):
    def _make(user_id, name="Binary search", desc="cut sorted array in half until value found."):
        with get_db() as conn, conn.cursor() as cur:
            cur.execute(
                """INSERT INTO daily_log
                       (name, created_at, description, user_id)
                   VALUES ( %s, %s, %s, %s) RETURNING id""",
                (name, today, desc, user_id),
            )
            return cur.fetchone()[0]
    return _make