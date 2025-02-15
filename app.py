import os
from flask import Flask, render_template, request, jsonify
import datetime
import wikipedia
import pyjokes
import requests
import logging
import urllib.parse

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "your-secret-key")
logging.basicConfig(level=logging.DEBUG)

def get_youtube_url(query):
    """Generate a YouTube search URL for the given query"""
    base_url = "https://www.youtube.com/results"
    params = urllib.parse.urlencode({'search_query': query})
    return f"{base_url}?{params}"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process_command', methods=['POST'])
def process_command():
    data = request.json
    command = data.get('command', '').lower()

    try:
        if 'play' in command:
            song = command.replace('play', '').strip()
            url = get_youtube_url(song)
            return jsonify({
                'response': f'Playing {song}',
                'action': 'play',
                'url': url
            })

        elif 'time' in command:
            time = datetime.datetime.now().strftime('%I:%M %p')
            return jsonify({'response': f'Current time is {time}'})

        elif 'who is' in command:
            name = command.replace('who is', '').strip()
            info = wikipedia.summary(name, 1)
            return jsonify({'response': info})

        elif 'news' in command:
            url = f"https://newsapi.org/v2/top-headlines?country=us&apiKey={NEWS_API_KEY}"
            response = requests.get(url)
            news = response.json()
            headline = news['articles'][0]['title']
            return jsonify({'response': f"Here's the top headline: {headline}"})

        elif 'joke' in command:
            joke = pyjokes.get_joke()
            return jsonify({'response': joke})

        elif 'weather' in command:
            return jsonify({'response': 'Currently, the weather API integration is limited. Please try other commands.'})

        else:
            return jsonify({'response': 'I did not understand that command. Please try again.'})

    except Exception as e:
        logging.error(f"Error processing command: {str(e)}")
        return jsonify({'response': 'Sorry, I encountered an error processing your request.'})

@app.route('/get_greeting', methods=['GET'])
def get_greeting():
    hour = datetime.datetime.now().hour
    if 5 <= hour < 12:
        greeting = "Good morning! How can I help you?"
    elif 12 <= hour < 18:
        greeting = "Good afternoon! How can I help you?"
    else:
        greeting = "Good evening! How can I help you?"
    return jsonify({'greeting': greeting})