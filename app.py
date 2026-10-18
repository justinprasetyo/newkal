from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from psycopg2.extras import Json
import requests, json

from database import init_db, create_topic, get_alltopics, delete_alltopics, load_topics, get_topicById, delete_topicById
from retention import complete_review, undo_review, get_ontime_percentage
from dailylog import create_daily_log, load_daily_logs, get_daily_logById, delete_logById
from datetime import date, datetime, timedelta

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    init_db()
    #delete_alltopics() # delete topics on startup 
    return render_template('index.html')

@app.route('/api/topics', methods=['POST'])
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
def list_topics():
    return jsonify(load_topics())

@app.route('/api/topics/percentage', methods=['GET'])
def update_review_percentage():
    return jsonify(get_ontime_percentage())

@app.route('/api/topics/stats', methods=['POST'])
def load_topicStats():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    return jsonify(get_topicById(data['id']))

@app.route('/api/topics/update', methods=['POST'])
def update_topicInterval():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    complete_review(data['id'], data['rating'])
    return '', 204

@app.route('/api/topics/undo', methods=['POST'])
def undo_topicReview():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    undo_review(data['id'])
    return '', 204

@app.route('/api/topics/delete', methods=['POST'])
def delete_topicReview():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    delete_topicById(data['id'])
    return '', 204

@app.route('/api/daily_logs', methods=['GET'])
def list_daily_logs():
    return jsonify(load_daily_logs())

@app.route('/api/daily_logs/content', methods=['POST'])
def load_logContent():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    return jsonify(get_daily_logById(data['id']))

@app.route('/api/daily_logs/delete', methods=['POST'])
def delete_log():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    delete_logById(data['id'])
    return '', 204

@app.route('/api/test', methods=['GET'])
def test():
    print(load_daily_logs())
    return '', 204




if __name__ == '__main__':
    app.run(port="8080", debug="True")