from psycopg2.extras import RealDictCursor
from database import get_db
from security import user_today

def get_allreviews_today(user_id):
    today = user_today()
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""SELECT id, name, TO_CHAR(next_review, 'YYYY-MM-DD') AS next_review, review_log 
                        FROM topics 
                        WHERE user_id = %s AND (next_review <= %s OR review_log -> -1 ->> 'completed_on' = %s) ORDER BY next_review
                        """, (user_id, today, str(today)))
        return cur.fetchall()