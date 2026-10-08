from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from database import intervals, levels, get_db\

def add_rating(id, rating):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
            UPDATE topics
            SET review_ratings = review_ratings || %s::int
            WHERE id = %s
            RETURNING id, name, progress, created_at, interval_step, next_review, level, all_reviews, review_ratings
        """, (rating, id))
    
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(row)


def update_level(id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT review_ratings, interval_step FROM topics WHERE id = %s", (id,))
    topic = cur.fetchone()
    if topic is None:
        cur.close(); conn.close()
        return None

    ratingAverage = 0
    for rate in topic['review_ratings']:
        ratingAverage += rate

    ratingAverage /= len(topic['review_ratings'])
    rating = ratingAverage * (topic['interval_step'] + 1)


    cur.execute("""
        UPDATE topics
        SET progress = %s::int
        WHERE id = %s
        RETURNING id, name, progress, created_at, interval_step, next_review, level, all_reviews, review_ratings
    """, (rating, id))

    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(row)