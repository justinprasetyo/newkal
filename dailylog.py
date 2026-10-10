from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from database import intervals, levels, get_db

def create_topic(topic_obj):
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