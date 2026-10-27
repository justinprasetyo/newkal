from flask import session, request, jsonify
from database import get_db
from werkzeug.security import generate_password_hash, check_password_hash

def register(data):
    username, password = data['username'], data['password']

    hashed = generate_password_hash(password)   # scrypt by default, salted automatically

    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, hashed))
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close(); conn.close()

    session['user_id'] = user_id   # logs them in immediately after registering
    return True if 'user_id' in session else False

def login(data):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (data['username'],))
    user = cur.fetchone()
    cur.close(); conn.close()

    if user is None or not check_password_hash(user[1], data['password']):
        return "Invalid username or password", 401

    session['user_id'] = user[0]
    return True if 'user_id' in session else False

def logout():
    session.pop('user_id', None)
    return True if 'user_id' in session else False