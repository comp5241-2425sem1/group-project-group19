from flask import Flask, jsonify, request
from mindmap import Conversation2Markdown as c2m
from chat.chatbot import ChatBot

app = Flask(__name__)
bot = ChatBot()
@app.route('/get_result', methods=['GET'])
def get_result():
    history = bot.get_chat_history()
    history = '\n'.join(history)
    print(history)
    result = c2m.get_result(history)
    print(f"Result: {result}")
    return result

@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    data = request.json
    markdown = data.get('markdown', '')
    summary = c2m.generate_summary(markdown)
    return jsonify({'summary': summary})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    question = data.get('question', '')
    print(f"User question: {question}")
    bot.add_user_question(question)
    response = bot.generate_response()
    print(f"AI response: {response}")
    return jsonify({'response': response})