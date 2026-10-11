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
    print(arr)
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
