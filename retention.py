from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from database import intervals, levels, get_db

def complete_review(id, rating):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        UPDATE topics
        SET review_ratings = review_ratings || %s::int
        WHERE id = %s
        RETURNING review_ratings, interval_step, next_review
    """, (rating, id))
    row = cur.fetchone()
    if row is None:
        cur.close(); conn.close()
        return None

    new_step = min(row['interval_step'] + 1, len(intervals) - 1)
    new_next_review = row['next_review'] + timedelta(days=intervals[new_step])

    avg = sum(row['review_ratings']) / len(row['review_ratings'])
    mastery = (avg * (new_step + 1)) / 5

    level = 0
    if mastery > 90: level = 4
    elif mastery > 75: level = 3
    elif mastery > 50: level = 2
    elif mastery > 20: level = 1

    cur.execute("""
        UPDATE topics
        SET interval_step = %s, next_review = %s, all_reviews = all_reviews || %s::date,
            progress = %s, level = %s
        WHERE id = %s
        RETURNING id, name, progress, created_at, interval_step, next_review, level, all_reviews, review_ratings
    """, (new_step, new_next_review, new_next_review, mastery, levels[level], id))

    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(result)