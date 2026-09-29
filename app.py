from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests

from database import init_db, create_topic, get_alltopics

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    init_db()
    return render_template('index.html')

@app.route('/api/topics', methods=['POST'])
def uploadInput():
    obj = {'name': 'Sliding windows leetcode', 'progress': '0', 'created_at': '09/28/2026', 'interval_step': '0', 'next_review': '09/29/2026', 'level': 'Beginner'}
    create_topic(obj)
    print(get_alltopics())
    return jsonify({'status': True})

@app.route('/api/topics', methods=['GET'])
def list_topics():
    return jsonify(get_alltopics())


if __name__ == '__main__':
    app.run(port="8080", debug="True")