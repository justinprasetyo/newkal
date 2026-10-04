import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta

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
    #cur.execute("DROP TABLE IF EXISTS topics CASCADE;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS topics (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            progress INTEGER NOT NULL DEFAULT 0,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE,
            interval_step INTEGER NOT NULL DEFAULT 0,
            next_review DATE NOT NULL,
            level TEXT NOT NULL,
            all_reviews DATE[] NOT NULL DEFAULT ARRAY[]::DATE[]
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

    if obj['all_reviews']:
        for date in obj['all_reviews']:
            date = date.isoformat()

def create_topic(topic_obj):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO topics (name, progress, created_at, interval_step, next_review, level, all_reviews)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        topic_obj['name'], topic_obj['progress'], topic_obj['created_at'],
        topic_obj['interval_step'], topic_obj['next_review'], topic_obj['level'], topic_obj['all_reviews']
    ))
    conn.commit()
    cur.close()
    conn.close()

def get_topicById(id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, progress, created_at, interval_step, next_review, level, all_reviews
        FROM topics
        WHERE id = %s
    """, (
        id,
    ))

    topic = cur.fetchone()
    cur.close()
    conn.close()
    formatDates(dict(topic))
    return dict(topic) if topic else None

def get_alltopics():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, progress, created_at, interval_step, next_review, level, all_reviews
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
    all_reviewsByDate = {}
    for obj in arr:
        for review in obj['all_reviews']:
            if str(review) in all_reviewsByDate:
                all_reviewsByDate[str(review)].append(obj)
            else:
                all_reviewsByDate[str(review)] = [obj]
    return all_reviewsByDate

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

def create_nextReview(id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        UPDATE topics
        SET 
            interval_step = interval_step + 1,
            next_review = next_review + (%s::int[])[interval_step + 1] * INTERVAL '1 day',
            all_reviews = all_reviews || (next_review + (%s::int[])[interval_step + 1] * INTERVAL '1 day')::date
        WHERE id = %s
        RETURNING id, name, progress, created_at, interval_step, next_review, level, all_reviews;
    """, (intervals, intervals, id))

    row = cur.fetchone()
    
    conn.commit()
    cur.close()
    conn.close()
    print(row['all_reviews'])
    return 'Topic not found', 404

def seed_reviews():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO topics (name, progress, created_at, interval_step, next_review, level, all_reviews)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, ("Sliding windows leetcode", 0, "2026-10-13", 0, "2026-10-14", "Beginner"
    ))
    conn.commit()
    cur.close()
    conn.close()

#seed_reviews()
