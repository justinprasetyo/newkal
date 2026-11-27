from flask import Flask, request, jsonify, render_template, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_limiter.errors import RateLimitExceeded
from psycopg2.extras import Json
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix
import os

from security import login, register, logout, login_required, user_today, get_username, VALID_TIMEZONES
from database import create_topic, get_alltopics, load_topics, get_topicById, delete_topicById
from retention import complete_review, undo_review, get_ontime_percentage, get_streak
from dailylog import create_daily_log, load_daily_logs, get_daily_logById, delete_logById, edit_log_description
from errors import AppError, Invalid
from inbox import get_allreviews_today

load_dotenv()
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=3)
app.secret_key = os.environ["SECRET_KEY"]
limiter = Limiter(get_remote_address, app=app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/me')
def whoami():
    if 'user_id' in session:
        username = get_username(session['user_id'])
        return jsonify({"logged_in": 'user_id' in session, 'username': username})
    else:
        return jsonify({"logged_in": 'user_id' in session})

@app.route('/api/timezone', methods=['POST'])
def get_timezone():
    data = request.get_json()
    if ('timezone' not in data) or ('timezone' in data and data['timezone'] not in VALID_TIMEZONES):
        raise Invalid("Invalid user timezone.")
    session['tz'] = data['timezone']
    return jsonify({"status": 'recieved'})

@app.route('/api/register', methods=['POST'])
@limiter.limit("5 per 5 minutes")
def register_user():
    data = request.get_json()
    result = register(data)
    return result

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per 5 minutes")
def login_user():
    data = request.get_json()
    result = login(data)
    return result

@app.route('/api/logout', methods=['POST'])
@login_required
def logout_user():
    result = logout()
    return result

@app.route('/api/inbox', methods=['GET'])
@login_required
def update_inbox():
    return jsonify(get_allreviews_today(session['user_id']))

@app.route('/api/topics', methods=['POST'])
@login_required
def uploadInput():
    data = request.get_json() 
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    today = user_today()
    if data['daily_log'] and data['daily_log'] == True:
        obj = {'name': data['input'], 'created_at': today, 'description': ''}
        create_daily_log(session['user_id'], obj)
        print('short term topic created')
        return jsonify(get_alltopics(session['user_id']))

    obj = {'name': data['input'], 'progress': 0, 'created_at': today, 'interval_step': 0, 
           'next_review': today, 'level': 'Beginner', 'review_log': Json([])}
    
    create_topic(session['user_id'], obj)
    return jsonify(get_alltopics(session['user_id']))

@app.route('/api/topics', methods=['GET'])
@login_required
def list_topics():
    return jsonify(load_topics(session['user_id']))

@app.route('/api/topics/percentage', methods=['GET'])
@login_required
def update_review_percentage():
    return jsonify(get_ontime_percentage(session['user_id']))

@app.route('/api/streak', methods=['GET'])
@login_required
def update_streak():
    return jsonify(get_streak(session['user_id']))

@app.route('/api/topics/stats', methods=['POST'])
@login_required
def load_topicStats():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    return jsonify(get_topicById(session['user_id'], data['id']))

@app.route('/api/topics/update', methods=['POST'])
@login_required
def update_topicInterval():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    leveled_up = complete_review(session['user_id'], data['id'], data['rating'])
    return jsonify(leveled_up)

@app.route('/api/topics/undo', methods=['POST'])
@login_required
def undo_topicReview():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    level_down = undo_review(session['user_id'], data['id'])
    return jsonify(level_down)

@app.route('/api/topics/delete', methods=['POST'])
@login_required
def delete_topicReview():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    delete_topicById(session['user_id'], data['id'])
    return '', 204

@app.route('/api/daily_logs', methods=['GET'])
@login_required
def list_daily_logs():
    return jsonify(load_daily_logs(session['user_id']))

@app.route('/api/daily_logs/content', methods=['POST'])
@login_required
def load_logContent():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    return jsonify(get_daily_logById(session['user_id'], data['id']))

@app.route('/api/daily_logs/update/description', methods=['POST'])
@login_required
def update_description():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    edit_log_description(session['user_id'], data['id'], data['description'])
    return '', 204

@app.route('/api/daily_logs/delete', methods=['POST'])
@login_required
def delete_log():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    delete_logById(session['user_id'], data['id'])
    return '', 204

@app.route('/api/test', methods=['GET'])
@login_required
def test():
    return '', 204

@app.errorhandler(AppError)
def handle_app_error(e):
    return jsonify({"error": e.message}), e.status

@app.errorhandler(RateLimitExceeded)
def handle_rate_limit(e):
    return jsonify({"error": "Too many attempts. Please wait before trying again."}), 429


if __name__ == '__main__':
    app.run(port=int(os.environ.get("PORT", 8080)), threaded=True, debug=False)