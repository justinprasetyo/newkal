from psycopg2.extras import RealDictCursor
from database import get_db, formatDates
from errors import NotFound

def create_daily_log(user_id, topic_obj):
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO daily_log (name, created_at, description, user_id)
            VALUES (%s, %s, %s, %s)
        """, (
            topic_obj['name'], topic_obj['created_at'], topic_obj['description'], user_id
        ))
        conn.commit()

def get_allDaily_logs(user_id):
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, created_at, description
            FROM daily_log
            WHERE user_id = %s
            ORDER BY created_at
        """, (
            user_id,
        ))

        rows = cur.fetchall()
        arr = []
        for row in rows:
            formatDates(row)
            arr.append(dict(row))
        return arr

def load_daily_logs(user_id):
    arr = get_allDaily_logs(user_id)
    all_logsByDate = {}
    for obj in arr:
        dateKey = obj['created_at']
        if str(dateKey) in all_logsByDate:
            all_logsByDate[str(dateKey)].append(obj)
        else:
            all_logsByDate[str(dateKey)] = [obj]
    return all_logsByDate

def get_daily_logById(user_id, id):
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, created_at, description
            FROM daily_log
            WHERE id = %s AND user_id = %s
        """, (
            id, user_id,
        ))

        topic = cur.fetchone()
        if topic is None:
            raise NotFound("Daily log is not found.")
        formatDates(dict(topic))
        return dict(topic)

def delete_logById(user_id, id):
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            DELETE FROM daily_log
            WHERE id = %s AND user_id = %s
            RETURNING id
        """, (
            id, user_id,
        ))
        topic = cur.fetchone()
        if topic is None:
            raise NotFound("Daily log is not found.")
        print(f"DELETED {id}")
        conn.commit()

def edit_log_description(user_id, id, desc):
     with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE daily_log
            SET description = %s
            WHERE id = %s AND user_id = %s
        """, (
            desc, id, user_id
        ))
        conn.commit()
        return '', 204