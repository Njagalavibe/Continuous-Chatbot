import os
import sys
import requests

# Add the project root to Python path so we can import settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

def test_openrouter_connection():
    """Test OpenRouter API connection"""
    api_key = os.getenv('DEEPSEEK_API_KEY')
    print(f"API Key: {api_key}")
    
    if not api_key:
        print("No API key found in .env file")
        return False
    
    # Test the exact same configuration as services.py
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "OmniContext"
    }
    
    payload = {
        "model": "deepseek/deepseek-chat",
        "messages": [
            {"role": "user", "content": "Hello! Please respond with 'OpenRouter integration successful'"}
        ],
        "stream": False,
        "max_tokens": 100
    }
    
    try:
        print("Testing OpenRouter API...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("SUCCESS!")
            print(f"Response: {result['choices'][0]['message']['content']}")
            print(f"Model: {result.get('model', 'Unknown')}")
            return True
        else:
            print(f"ERROR: {response.text}")
            return False
            
    except Exception as e:
        print(f"Request failed: {e}")
        return False

if __name__ == "__main__":
    test_openrouter_connection()