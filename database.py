import psycopg2
from psycopg2.extras import RealDictCursor

levels = ['Washed', 'Mastered']
intervals = [1, 3, 7, 16, 35] # then multiply based on performance

def get_db():
    conn = psycopg2.connect(
        dbname="newkal",
        user="justinprasetyo",
        host="localhost",
        port=5432
    )
    return conn

def init_db(): #initialize table on startup
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS topics (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            progress INTEGER NOT NULL DEFAULT 0,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE,
            interval_step INTEGER NOT NULL DEFAULT 0,
            next_review DATE NOT NULL,
            level TEXT NOT NULL
        );
    """)
    conn.commit()
    cur.close()
    conn.close()

def create_topic(topic_obj):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO topics (name, progress, created_at, interval_step, next_review, level)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        topic_obj['name'], topic_obj['progress'], topic_obj['created_at'],
        topic_obj['interval_step'], topic_obj['next_review'], topic_obj['level']
    ))
    conn.commit()
    cur.close()
    conn.close()

def get_alltopics():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT name, progress, created_at, interval_step, next_review, level
        FROM topics
        ORDER BY created_at
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(row) for row in rows]