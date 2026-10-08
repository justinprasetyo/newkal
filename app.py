from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests

from database import init_db, create_topic, get_alltopics, delete_alltopics, load_topics, get_topicById, delete_topicById, create_nextReview
from retention import add_rating, update_level
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
    #, (date.today() + timedelta(days=1)) if u want both days
    obj = {'name': data['input'], 'progress': 0, 'created_at': date.today(), 'interval_step': 0, 
           'next_review': date.today(), 'level': 'Beginner', 
           'all_reviews': [date.today()], 'review_ratings': []}
    create_topic(obj)
    return jsonify(get_alltopics())

@app.route('/api/topics', methods=['GET'])
def list_topics():
    return jsonify(load_topics())

@app.route('/api/topics/stats', methods=['POST'])
def load_topicStats():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    return jsonify(get_topicById(data['id']))

@app.route('/api/topics/delete', methods=['POST'])
def delete_topicReview():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    
    delete_topicById(data['id'])
    return '', 204

@app.route('/api/topics/update', methods=['POST'])
def update_topicInterval():
    data = request.get_json() 
    
    if data is None:
        return jsonify({"error": "No valid data received"}), 400

    update_level(data['id'], data['rating'])
    create_nextReview(data['id'])
    return '', 204


if __name__ == '__main__':
    app.run(port="8080", debug="True")