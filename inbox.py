from flask import session
from psycopg2.extras import RealDictCursor
from database import get_db
from security import login_required, user_today
from errors import Unauthorized

@login_required
def completed_reviews_today():
    if 'user_id' not in session:
        raise Unauthorized("Please log in.")
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT review_log FROM topics WHERE user_id = %s", (session['user_id'],))
        reviews = cur.fetchall()
        today = str(user_today())
        completed = 0
        for row in reviews:
            arr = dict(row)['review_log']
            if len(arr) > 0 and arr[len(arr) - 1]['completed_on'] == today:
                completed += 1
    return completed