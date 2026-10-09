from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from database import intervals, levels, get_db

def update_level(id, rating): # we can do the same function for both to save time
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
            UPDATE topics
            SET review_ratings = review_ratings || %s::int
            WHERE id = %s
            RETURNING id, name, progress, created_at, interval_step, next_review, level, all_reviews, review_ratings
        """, (rating, id))

    topic = cur.fetchone()
    if topic is None:
        cur.close(); conn.close()
        return None
    
    new_ratings = topic['review_ratings']
    interval_step = topic['interval_step']

    if not new_ratings or len(new_ratings) == 0:
        cur.close(); conn.close()
        return 'Error: no possible ratings to asses', 404
    
    ratingAverage = sum(new_ratings) / len(new_ratings)

    rating = (ratingAverage * (topic['interval_step'] + 1)) / 5 # 500 is max (before division by 5), 175-200 is mid/below average

    level = 0
    if rating > 90:
        level = 4
    elif rating > 75:
        level = 3
    elif rating > 50:
        level = 2
    elif rating > 20: # level = 0 after first session.
        level = 1

    cur.execute("""
        UPDATE topics
        SET progress = %s, level = %s
        WHERE id = %s
        RETURNING id, name, progress, created_at, interval_step, next_review, level, all_reviews, review_ratings
    """, (level, levels[level], id))

    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(row) if row else None