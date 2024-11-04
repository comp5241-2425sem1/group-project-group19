from flask import Flask, jsonify, request
import Conversation2Markdown as c2m

app = Flask(__name__)

@app.route('/get_result', methods=['GET'])
def get_result():
    result = c2m.get_result()
    return result

