import os
import json
import feedparser
import requests
from google import genai
from google.genai import types

# Constants
SEEN_POSTS_FILE = "seen_posts.json"
NITTERS = [
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.cz"
]
USERNAME = "karpathy"

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

def load_seen_posts():
    if os.path.exists(SEEN_POSTS_FILE):
        with open(SEEN_POSTS_FILE, "r") as f:
            return json.load(f)
    return []

def save_seen_posts(seen_posts):
    with open(SEEN_POSTS_FILE, "w") as f:
        json.dump(seen_posts, f)

def fetch_rss():
    for mirror in NITTERS:
        url = f"{mirror}/{USERNAME}/rss"
        try:
            print(f"Trying {url}...")
            # We add a small timeout to try the next mirror if it's down
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                feed = feedparser.parse(response.content)
                if feed.entries:
                    return feed.entries
        except requests.RequestException as e:
            print(f"Failed to fetch from {mirror}: {e}")
    return []

def evaluate_post(post_text):
    if not GEMINI_API_KEY:
        print("No GEMINI_API_KEY provided.")
        return "ERROR"
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    prompt = f"""You are a specialized filter for Andrej Karpathy's posts. Ignore generic replies, emojis, or social pleasantries. Identify posts regarding LLM architecture, code releases (GitHub/Gist), AI research papers, or deep technical insights. Return exactly 'SIGNAL' or 'NOISE'.

Post:
"{post_text}"
"""
    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=prompt,
        )
        result = response.text.strip().upper()
        return "SIGNAL" if "SIGNAL" in result else "NOISE"
    except Exception as e:
        print(f"Gemini evaluation error: {e}")
        return "ERROR"

def send_telegram_message(text):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram configuration is missing.")
        return
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            print(f"Failed to send Telegram message: {response.text}")
        else:
            print("Telegram message sent successfully.")
    except Exception as e:
        print(f"Error sending Telegram message: {e}")

def main():
    seen_posts = load_seen_posts()
    entries = fetch_rss()
    
    if not entries:
        print("No entries fetched from any Nitter mirror.")
        return

    new_posts_found = False
    
    # Process oldest to newest or newest to oldest. feedparser usually returns newest first.
    # We will process them from newest, but maybe reverse it to send chronological.
    for entry in reversed(entries):
        post_id = entry.id if hasattr(entry, 'id') else entry.link
        
        if post_id not in seen_posts:
            print(f"New post found: {entry.link}")
            
            # Evaluate
            decision = evaluate_post(entry.title + "\n" + getattr(entry, 'description', ''))
            print(f"Decision: {decision}")
            
            if decision == "SIGNAL":
                # Prepare message
                msg = f"🚨 <b>Karpathy Signal</b> 🚨\n\n{entry.title}\n\n<a href='{entry.link}'>View Post</a>"
                send_telegram_message(msg)
            
            seen_posts.append(post_id)
            new_posts_found = True
            
    if new_posts_found:
        save_seen_posts(seen_posts)
        print("Updated seen_posts.json")
    else:
        print("No new posts to process.")

if __name__ == "__main__":
    main()
