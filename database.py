import psycopg2
from psycopg2.extras import RealDictCursor

levels = ['Beginner', 'Washed', 'Intermediate', 'Advanced', 'Mastered']
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

def formatDates(obj):
    if obj['created_at']:
        obj['created_at'] = obj['created_at'].isoformat()

    if obj['next_review']:
        obj['next_review'] = obj['next_review'].isoformat()

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

def get_topicById(id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, progress, created_at, interval_step, next_review, level
        FROM topics
        WHERE id = %s
    """, (
        id,
    ))

    topic = cur.fetchone()
    cur.close()
    conn.close()
    formatDates(topic)
    return dict(topic) if topic else None

def get_alltopics():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, progress, created_at, interval_step, next_review, level
        FROM topics
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

def load_topics():
    arr = get_alltopics()
    all_reviews = {}
    for obj in arr:
        if obj['next_review'] in all_reviews:
            all_reviews[obj['next_review']].append(obj)
        else:
            all_reviews[obj['next_review']] = [obj]
    return all_reviews

def delete_topicById(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM topics
        WHERE id = %s
    """, (
        id,
    ))
    print("DELETED" + id)
    conn.commit()
    cur.close()
    conn.close()

def delete_alltopics():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM topics;")
    conn.commit()
    cur.close()
    conn.close()


def seed_reviews():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO topics (name, progress, created_at, interval_step, next_review, level)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, ("Sliding windows leetcode", 0, "2026-10-13", 0, "2026-10-14", "Beginner"
    ))
    conn.commit()
    cur.close()
    conn.close()
"""
def seed_reviews():
    connection = get_db()
    count = connection.execute("SELECT COUNT(*) FROM reservations").fetchone()[0]
    if count == 0:
        sample = [
            ("2026-09-28", 0, "Beginner", "Sliding windows leetcode", "2026-09-29", 0),
            (2, "2026-10-03", "2026-10-04", "Community sail day"),
            (3, "2026-10-10", "2026-10-20", "R/V2 8:30 AM example"),
        ]
        connection.executemany(
            "INSERT INTO reservations (dock_number, start_date, end_date, reason) VALUES (?, ?, ?, ?)",
            sample,
        )
        connection.commit()
    connection.close()
"""

#seed_reviews()
