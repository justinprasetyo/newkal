from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/subjects', methods=['POST'])
def uploadInput():

    return jsonify({'status': True})


if __name__ == '__main__':
    app.run(port="8080", debug="True")