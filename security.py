import psycopg2
from flask import session, request, jsonify
from database import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from zoneinfo import ZoneInfo, available_timezones
from datetime import datetime

VALID_TIMEZONES = frozenset(available_timezones())

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "not logged in"}), 401
        return f(*args, **kwargs)
    return decorated

def user_today():
    user_tz = ZoneInfo(session.get("tz", "UTC"))
    return datetime.now(user_tz).date()

def register(data):
    username, password = data['username'], data['password']

    hashed = generate_password_hash(password)   # scrypt by default, salted automatically

    with get_db() as conn, conn.cursor() as cur:
        try:
            cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id", (username, hashed))
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return {"status": "error: username already taken"}, 409
        
        user_id = cur.fetchone()[0]
        conn.commit()

        session['user_id'] = user_id   # logs them in immediately after registering
        return {"status": "account registered"}

def login(data):
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (data['username'],))
        user = cur.fetchone()

        if user is None or not check_password_hash(user[1], data['password']):
            return {"status": "error: invalid username or password"}, 401

        session['user_id'] = user[0]
        return {"status": "logged in"}

def logout():
    session.pop('user_id', None)
    session.pop('tz', None)
    return {"status": "logged out"}