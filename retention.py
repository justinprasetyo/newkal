from flask import session
from psycopg2.extras import RealDictCursor
from datetime import date, datetime, timedelta
import json

from database import intervals, levels, get_db, get_alltopics
from security import user_today

def complete_review(id, rating):
    if type(rating) is not int or rating not in [0, 25, 50, 75, 100]:
        return "Invalid rating", 400
    
    with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:

        cur.execute("""
            SELECT interval_step, next_review, review_log, level, progress
            FROM topics
            WHERE id = %s AND user_id = %s
        """, (id, session['user_id'],))
        row = cur.fetchone()
        if row is None:
            return None, 404

        old_progress = row['progress']
        old_level = levels.index(row['level'])
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

        today = user_today()
        if row['next_review'] >= today:
            new_next_review = row['next_review'] + timedelta(days=intervals[new_step])
        else: #if already late, use todays date as 'next_review'
            new_next_review = today + timedelta(days=intervals[new_step])
        offset_days = (today - row['next_review']).days #we still have the 'next_review' data point for easy access

        entry = {"date": str(new_next_review), "rating": rating, #'date' meaning next review date that completion created
                "interval_step": new_step, "offset_days": offset_days}    
        
        cur.execute("""
            UPDATE topics
            SET review_log = review_log || %s::jsonb,
                interval_step = %s,
                next_review = %s
            WHERE id = %s AND user_id = %s
            RETURNING id, name, progress, created_at, interval_step, next_review, level, review_log
        """, (json.dumps([entry]), new_step, new_next_review, id, session['user_id']))
        
        result = cur.fetchone()

        rating_sum = 0
        for completed_review in result['review_log']:
            if len(completed_review) > 0:
                rating_sum += completed_review['rating']

        avg = rating_sum / len(result['review_log'])
        mastery = (avg * new_step) / 5 #5 perfects right off the bat = Mastered

        level = 0
        if mastery > 90: level = 4
        elif mastery > 75: level = 3
        elif mastery > 50: level = 2
        elif mastery > 20: level = 1

        cur.execute("""
            UPDATE topics
            SET level = %s, progress = %s
            WHERE id = %s AND user_id = %s
            RETURNING id, name, progress, created_at, interval_step, next_review, level, review_log
        """, (levels[level], mastery, id, session['user_id']))

        final_result = cur.fetchone()
        conn.commit()
        if level > old_level:
            return {'leveled_up': True, 'level': levels[level], 'progress': mastery, 'old_progress': old_progress}
        return {'leveled_up': False, 'level': levels[level], 'progress': mastery, 'old_progress': old_progress}

def undo_review(id):
     with get_db() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:

        cur.execute("SELECT review_log, created_at, level, progress FROM topics WHERE id = %s AND user_id = %s", (id, session['user_id'],))
        row = cur.fetchone()
        if row is None or len(row['review_log']) == 0:
            return None, 404  # nothing to undo

        old_progress = row['progress']
        old_level = levels.index(row['level'])
        log = row['review_log'][:-1]  # drop the most recent completion

        if len(log) > 0:
            new_step = log[-1]['interval_step']
            new_next_review = log[-1]['date']
        else:
            new_step = 0
            new_next_review = row['created_at']  # back to day one if 0 completed reviews

        rating_sum = 0
        for completed_review in log:
            if len(completed_review) > 0:
                rating_sum += completed_review['rating']

        if len(log) > 0:
            avg = rating_sum / len(log)
        else:
            avg = 0

        mastery = (avg * new_step) / 5

        level = 0
        if mastery > 90: level = 4
        elif mastery > 75: level = 3
        elif mastery > 50: level = 2
        elif mastery > 20: level = 1

        cur.execute("""
            UPDATE topics
            SET review_log = %s::jsonb, interval_step = %s, next_review = %s,
                progress = %s, level = %s
            WHERE id = %s AND user_id = %s
            RETURNING id, name, progress, created_at, interval_step, next_review, level, review_log
        """, (json.dumps(log), new_step, new_next_review, mastery, levels[level], id, session['user_id']))

        result = cur.fetchone()
        conn.commit()
        if old_level > level:
            return {'level_down': True, 'level': levels[level], 'progress': mastery, 'old_progress': old_progress}
        return {'level_down': False, 'level': levels[level], 'progress': mastery, 'old_progress': old_progress}

def get_ontime_percentage(): #700-800ms
    all_topics = get_alltopics()
    today = user_today()
    late_reviews = 0
    all_reviews_count = 0
    for topic in all_topics:
        if date.fromisoformat(topic['next_review']) < today: #including NON-completed reviews that are overdue
            late_reviews += 1
            all_reviews_count += 1
        for review in topic['review_log']:
            all_reviews_count += 1
            if review['offset_days'] > 0:
                late_reviews += 1
    if all_reviews_count == 0:
        return 0
    percentage = ((all_reviews_count - late_reviews) / all_reviews_count) * 100
    return round(percentage, 2)

def get_streak(): #700-800ms
    with get_db() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT created_at::date AS activity_date FROM topics
            WHERE user_id = %s
            UNION
            SELECT created_at::date FROM daily_log
            WHERE user_id = %s
        """, (
            session['user_id'], session['user_id'],
        ))
        rows = cur.fetchall()
        if rows is None:
            return None, 404
        active_days = {row[0] for row in rows}

        streak = 0
        day = user_today()
        while day in active_days: #includes created topics from long and short term + review completion
            streak += 1
            day -= timedelta(days=1)
        return streak
