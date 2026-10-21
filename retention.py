from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
from database import intervals, levels, get_db, get_alltopics
import json

def complete_review(id, rating):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT interval_step, next_review, review_log FROM topics WHERE id = %s", (id,))
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

    if row['next_review'] >= date.today():
        new_next_review = row['next_review'] + timedelta(days=intervals[new_step])
    else: #if already late, use todays date as 'next_review'
        new_next_review = date.today() + timedelta(days=intervals[new_step])
    offset_days = (date.today() - row['next_review']).days #we still have the 'next_review' data point for easy access

    entry = {"date": str(new_next_review), "rating": rating, #'date' meaning next review date that completion created
            "interval_step": new_step, "offset_days": offset_days}    

    cur.execute("""
        UPDATE topics
        SET review_log = review_log || %s::jsonb,
            interval_step = %s,
            next_review = %s
        WHERE id = %s
        RETURNING id, name, progress, created_at, interval_step, next_review, level, review_log
    """, (json.dumps([entry]), new_step, new_next_review, id))
    
    result = cur.fetchone()

    rating_sum = 0
    for completed_review in result['review_log']:
        if len(completed_review) > 0:
            rating_sum += completed_review['rating']

    avg = rating_sum / len(result['review_log'])
    mastery = (avg * (new_step + 1)) / 5

    level = 0
    if mastery > 90: level = 4
    elif mastery > 75: level = 3
    elif mastery > 50: level = 2
    elif mastery > 20: level = 1

    cur.execute("""
        UPDATE topics
        SET level = %s, progress = %s
        WHERE id = %s
        RETURNING id, name, progress, created_at, interval_step, next_review, level, review_log
    """, (levels[level], mastery, id))

    final_result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(final_result)

def undo_review(id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT review_log, created_at FROM topics WHERE id = %s", (id,))
    row = cur.fetchone()
    if row is None or len(row['review_log']) == 0:
        cur.close(); conn.close()
        return None  # nothing to undo

    log = row['review_log'][:-1]  # drop the most recent completion

    if len(log) > 0:
        new_step = log[-1]['interval_step']
        new_next_review = log[-1]['date']
    else:
        new_step = 0
        new_next_review = row['created_at']  # back to day one if 0 completed reviews

    rating_sum = 0
    for completed_review in result['review_log']:
        if len(completed_review) > 0:
            rating_sum += completed_review['rating']

    avg = rating_sum / len(result['review_log'])
    mastery = (avg * (new_step + 1)) / 5

    level = 0
    if mastery > 90: level = 4
    elif mastery > 75: level = 3
    elif mastery > 50: level = 2
    elif mastery > 20: level = 1

    cur.execute("""
        UPDATE topics
        SET review_log = %s::jsonb, interval_step = %s, next_review = %s,
            progress = %s, level = %s
        WHERE id = %s
        RETURNING id, name, progress, created_at, interval_step, next_review, level, review_log
    """, (json.dumps(log), new_step, new_next_review, mastery, levels[level], id))

    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(result)

def get_ontime_percentage():
    all_topics = get_alltopics()
    late_reviews = 0
    all_reviews_count = 0
    for topic in all_topics:
        if date.fromisoformat(topic['next_review']) < date.today(): #including NON-completed reviews that are overdue
            late_reviews += 1
        for review in topic['review_log']:
            all_reviews_count += 1
            if review['offset_days'] > 0:
                late_reviews += 1
    if all_reviews_count == 0:
        return 0
    percentage = ((all_reviews_count - late_reviews) / all_reviews_count) * 100
    return round(percentage, 2)

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