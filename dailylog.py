from flask import session
from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from database import intervals, levels, get_db, formatDates

def create_daily_log(topic_obj):
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO daily_log (name, created_at, description, user_id)
            VALUES (%s, %s, %s, %s)
        """, (
            topic_obj['name'], topic_obj['created_at'], topic_obj['description'], session['user_id']
        ))
        conn.commit()

def get_allDaily_logs():
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, created_at, description
            FROM daily_log
            WHERE user_id = %s
            ORDER BY created_at
        """, (
            session['user_id'],
        ))

        rows = cur.fetchall()
        arr = []
        for row in rows:
            formatDates(row)
            arr.append(dict(row))
        return arr

def load_daily_logs():
    arr = get_allDaily_logs()
    all_logsByDate = {}
    for obj in arr:
        dateKey = obj['created_at']
        if str(dateKey) in all_logsByDate:
            all_logsByDate[str(dateKey)].append(obj)
        else:
            all_logsByDate[str(dateKey)] = [obj]
    return all_logsByDate

def get_daily_logById(id):
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, created_at, description
            FROM daily_log
            WHERE id = %s AND user_id = %s
        """, (
            id, session['user_id'],
        ))

        topic = cur.fetchone()
        if topic is None: return None
        formatDates(dict(topic))
        return dict(topic)

def delete_logById(id):
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            DELETE FROM daily_log
            WHERE id = %s AND user_id = %s
        """, (
            id, session['user_id'],
        ))
        print(f"DELETED {id}")
        conn.commit()

def edit_log_description(id, desc):
     with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE daily_log
            SET description = %s
            WHERE id = %s AND user_id = %s
        """, (
            desc, id, session['user_id']
        ))
        conn.commit()
        return '', 204