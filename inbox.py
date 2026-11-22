from flask import session
from psycopg2.extras import RealDictCursor
from database import get_db
from security import login_required, user_today
from errors import Unauthorized

def completed_reviews_today():
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM topics WHERE user_id = %s AND review_log -> -1 ->> 'completed_on' = %s", (session['user_id'], str(user_today())))
        reviews = cur.fetchone()
    return reviews[0]

def get_allreviews_today():
    today = user_today()
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, name, review_log FROM topics WHERE user_id = %s AND (next_review <= %s OR review_log -> -1 ->> 'completed_on' = %s)", (session['user_id'], today, str(today)))
        return cur.fetchall()

def load_inbox(reviews_arr):
    return '', 204