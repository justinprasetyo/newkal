from flask import session
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
from contextlib import contextmanager
import os

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]
levels = ['Beginner', 'Washed', 'Intermediate', 'Advanced', 'Mastered']
intervals = [0, 1, 3, 7, 16, 35, 70, 180, 365]

connection_pool = psycopg2.pool.ThreadedConnectionPool(
    2, 10, DATABASE_URL,
    keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5,
)

@contextmanager
def get_db():
    #return psycopg2.connect(DATABASE_URL) #use when deploying
    conn = connection_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        connection_pool.putconn(conn)

def init_db(): #initialize table on startup
    with get_db() as conn, conn.cursor() as cur:
        #cur.execute("DROP TABLE IF EXISTS topics CASCADE;")
        #cur.execute("DROP TABLE IF EXISTS daily_log CASCADE;")
        #cur.execute("DROP TABLE IF EXISTS users CASCADE;")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                progress INTEGER NOT NULL DEFAULT 0,
                created_at DATE NOT NULL DEFAULT CURRENT_DATE,
                interval_step INTEGER NOT NULL DEFAULT 0,
                next_review DATE NOT NULL DEFAULT CURRENT_DATE,
                level TEXT NOT NULL,
                review_log JSONB NOT NULL DEFAULT '[]'::jsonb,
                user_id INTEGER REFERENCES users(id)
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS daily_log (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                created_at DATE NOT NULL DEFAULT CURRENT_DATE,
                description TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id)
            );
        """)

        conn.commit()

init_db()

def formatDates(obj):
    if 'created_at' in obj:
        obj['created_at'] = obj['created_at'].isoformat()

    if 'next_review' in obj:
        obj['next_review'] = obj['next_review'].isoformat()

def create_topic(topic_obj):
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO topics (name, progress, created_at, interval_step, next_review, level, review_log, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            topic_obj['name'], topic_obj['progress'], topic_obj['created_at'], topic_obj['interval_step'],
            topic_obj['next_review'], topic_obj['level'], topic_obj['review_log'], session['user_id']
        ))
        conn.commit()

def get_topicById(id):
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, progress, created_at, interval_step, next_review, level, review_log
            FROM topics
            WHERE id = %s AND user_id = %s
        """, (
            id, session['user_id']
        ))

        topic = cur.fetchone()
        if topic is None: return None
        formatDates(dict(topic))
        return dict(topic) if topic else None

def get_alltopics():
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, progress, created_at, interval_step, next_review, level, review_log
            FROM topics
            WHERE user_id = %s
            ORDER BY next_review
        """, (
            session['user_id'],
        ))

        rows = cur.fetchall()
        arr = []
        for row in rows:
            formatDates(row)
            arr.append(dict(row))
        return arr

def load_topics():
    arr = get_alltopics()
    all_reviewsByDate = {}
    for obj in arr:
        for review in obj['review_log']:
            if 'date' in review:
                if str(review['date']) in all_reviewsByDate:
                    all_reviewsByDate[str(review['date'])].append(obj)
                else:
                    all_reviewsByDate[str(review['date'])] = [obj]

    for obj in arr:
        if str(obj['created_at']) in all_reviewsByDate:
            all_reviewsByDate[str(obj['created_at'])].append(obj)
        else:
            all_reviewsByDate[str(obj['created_at'])] = [obj]
    return all_reviewsByDate

def delete_topicById(id):
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            DELETE FROM topics
            WHERE id = %s AND user_id = %s
        """, (
            id, session['user_id'],
        ))
        print(f"DELETED {id}")
        conn.commit()

def delete_alltopics():
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            DELETE FROM topics
            WHERE user_id = %s
        """, (
            session['user_id'],
        ))
        conn.commit()
