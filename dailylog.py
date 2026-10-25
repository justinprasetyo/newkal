from flask import session
from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from database import intervals, levels, get_db, formatDates

def create_daily_log(topic_obj):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO daily_log (name, created_at, description)
        VALUES (%s, %s, %s)
    """, (
        topic_obj['name'], topic_obj['created_at'], topic_obj['description']
    ))
    conn.commit()
    cur.close()
    conn.close()

def get_allDaily_logs():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, created_at, description
        FROM daily_log
        ORDER BY created_at
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()
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
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, created_at, description
        FROM daily_log
        WHERE id = %s
    """, (
        id,
    ))

    topic = cur.fetchone()
    cur.close()
    conn.close()
    formatDates(dict(topic))
    return dict(topic) if topic else None

def delete_logById(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM daily_log
        WHERE id = %s
    """, (
        id,
    ))
    print(f"DELETED {id}")
    conn.commit()
    cur.close()
    conn.close()

def edit_log_description(id, desc):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        UPDATE daily_log
        SET description = %s
        WHERE id = %s
    """, (
        desc, id
    ))
    conn.commit()
    cur.close()
    conn.close()
    return '', 204