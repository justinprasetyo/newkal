import psycopg2
from flask import session, request, jsonify
from database import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "not logged in"}), 401
        return f(*args, **kwargs)
    return decorated

def register(data):
    username, password = data['username'], data['password']

    hashed = generate_password_hash(password)   # scrypt by default, salted automatically

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id", (username, hashed))
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        cur.close(); conn.close()
        return {"status": "error: username already taken"}, 409
    
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close(); conn.close()

    session['user_id'] = user_id   # logs them in immediately after registering
    return {"status": "account registered"}

def login(data):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (data['username'],))
    user = cur.fetchone()
    cur.close(); conn.close()

    if user is None or not check_password_hash(user[1], data['password']):
        return {"status": "error: invalid username or password"}, 401

    session['user_id'] = user[0]
    return {"status": "logged in"}

def logout():
    session.pop('user_id', None)
    return {"status": "logged out"}