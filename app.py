from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from psycopg2.extras import Json
from dotenv import load_dotenv
import requests, json
import os

from security import login, register, logout, login_required
from database import init_db, create_topic, get_alltopics, delete_alltopics, load_topics, get_topicById, delete_topicById
from retention import complete_review, undo_review, get_ontime_percentage, get_streak
from dailylog import create_daily_log, load_daily_logs, get_daily_logById, delete_logById, edit_log_description
from datetime import date, datetime, timedelta

load_dotenv()
app = Flask(__name__)
CORS(app)
app.secret_key = os.environ["SECRET_KEY"]
limiter = Limiter(get_remote_address, app=app)

@app.route('/')
def home():
    init_db()
    #delete_alltopics() # delete topics on startup 
    return render_template('index.html')

@app.route('/api/me')
def whoami():
    return jsonify({"logged_in": 'user_id' in session})

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    result = register(data)
    return jsonify(result)

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    result = login(data)
    print(session)
    return jsonify(result)

@app.route('/api/logout', methods=['POST'])
@login_required
def logout_user():
    session.pop('user_id', None)
    return jsonify({"status": "logged out"})

@app.route('/api/topics', methods=['POST'])
@login_required
def uploadInput():
    data = request.get_json() 

    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    if data['daily_log'] and data['daily_log'] == True:
        obj = {'name': data['input'], 'created_at': date.today(), 'description': ''}
        create_daily_log(obj)
        print('short term topic created')
        return jsonify(get_alltopics())

    obj = {'name': data['input'], 'progress': 0, 'created_at': date.today(), 'interval_step': 0, 
           'next_review': date.today(), 'level': 'Beginner', 'review_log': Json([])}
    
    create_topic(obj)
    return jsonify(get_alltopics())

@app.route('/api/topics', methods=['GET'])
@login_required
def list_topics():
    return jsonify(load_topics())

@app.route('/api/topics/percentage', methods=['GET'])
@login_required
def update_review_percentage():
    return jsonify(get_ontime_percentage())

@app.route('/api/streak', methods=['GET'])
@login_required
def update_streak():
    return jsonify(get_streak())

@app.route('/api/topics/stats', methods=['POST'])
@login_required
def load_topicStats():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    return jsonify(get_topicById(data['id']))

@app.route('/api/topics/update', methods=['POST'])
@login_required
def update_topicInterval():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    complete_review(data['id'], data['rating'])
    return '', 204

@app.route('/api/topics/undo', methods=['POST'])
@login_required
def undo_topicReview():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    undo_review(data['id'])
    return '', 204

@app.route('/api/topics/delete', methods=['POST'])
@login_required
def delete_topicReview():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    delete_topicById(data['id'])
    return '', 204

@app.route('/api/daily_logs', methods=['GET'])
@login_required
def list_daily_logs():
    return jsonify(load_daily_logs())

@app.route('/api/daily_logs/content', methods=['POST'])
def load_logContent():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    return jsonify(get_daily_logById(data['id']))

@app.route('/api/daily_logs/update/description', methods=['POST'])
@login_required
def update_description():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    edit_log_description(data['id'], data['description'])
    print(data['description'])
    return '', 204

@app.route('/api/daily_logs/delete', methods=['POST'])
@login_required
def delete_log():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    delete_logById(data['id'])
    return '', 204

@app.route('/api/test', methods=['GET'])
@login_required
def test():
    print(load_daily_logs())
    return '', 204




if __name__ == '__main__':
    app.run(port=int(os.environ.get("PORT", 8080)), debug=False)