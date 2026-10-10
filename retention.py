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

    old_step = row['interval_step']
    if rating == 0: # forgot
        new_step = 1
    elif rating == 25: # eh - go back 1 interval, or repeat if at 1
        if old_step == 0:
            new_step = old_step + 1
        elif old_step == 1:
            new_step = old_step 
        else:
            new_step = old_step - 1
    elif rating == 50: # ok - repeat, dont advance
        new_step = old_step if old_step > 1 else old_step + 1
    else: # good/perfect — advance normally
        new_step = min(old_step + 1, len(intervals) - 1)

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
    print(result['all_reviews'])
    conn.commit()
    cur.close()
    conn.close()
    return dict(result)

def get_streak():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT d::date AS activity_date
        FROM topics, unnest(all_reviews) AS d
        UNION
        SELECT created_at FROM topics
        UNION
        SELECT created_at FROM daily_log
    """)
    active_days = {row[0] for row in cur.fetchall()}
    cur.close(); conn.close()

    streak = 0
    day = date.today()
    while day in active_days: #includes created topics from long and short term + review completion
        streak += 1
        day -= timedelta(days=1)
    return streak