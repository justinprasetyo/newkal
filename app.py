from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests

from database import init_db, create_topic, get_alltopics, delete_alltopics, load_topics
from datetime import date, datetime, timedelta

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    init_db()
    delete_alltopics() # delete topics on startup 
    return render_template('index.html')

@app.route('/api/topics', methods=['POST'])
def uploadInput():
    data = request.get_json() 

    if data is None:
        return jsonify({"error": "No valid data received"}), 400
    print(data)
    obj = {'name': data['input'], 'progress': '0', 'created_at': date.today().isoformat(), 'interval_step': '0', 'next_review': (date.today() + timedelta(days=1)).isoformat(), 'level': 'Beginner'}
    create_topic(obj)
    print((date.today() + timedelta(days=1)).isoformat())
    return jsonify(get_alltopics())

@app.route('/api/topics', methods=['GET'])
def list_topics():
    return jsonify(load_topics())


if __name__ == '__main__':
    app.run(port="8080", debug="True")