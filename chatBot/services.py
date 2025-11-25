import os
import requests
import json
from django.conf import settings

class DeepSeekService:
    @staticmethod
    def send_message(message_history):
        """
        Send messages to OpenRouter API and return the response
        """
        api_key = settings.DEEPSEEK_API_KEY
        
        if not api_key:
            return "Error: OpenRouter API key not configured. Please check your .env file."
        
        # OpenRouter API endpoint (NOT DeepSeek direct)
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:8000",  #  OpenRouter
            "X-Title": "chatBot"  #  OpenRouter
        }
        
        payload = {
            "model": "deepseek/deepseek-chat",  # OpenRouter model format
            "messages": message_history,
            "stream": False,
            "max_tokens": 2048
        }
        
        try:
            print(f"Sending request to OpenRouter API...")
            print(f"API Key exists: {bool(api_key)}")
            print(f"Message history length: {len(message_history)}")
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            print(f"Response status: {response.status_code}")
            
            # If we get a non-200 response, show the error
            if response.status_code != 200:
                error_detail = response.text
                print(f"API Error {response.status_code}: {error_detail}")
                return f"API Error {response.status_code}: {error_detail}"
            
            response.raise_for_status()
            
            result = response.json()
            print(f"API Response received successfully")
            print(f"Model used: {result.get('model', 'Unknown')}")
            return result['choices'][0]['message']['content']
        
        except requests.exceptions.RequestException as e:
            print(f"API Request Error: {e}")
            return f"Sorry, I'm having trouble connecting to the AI service. Error: {str(e)}"
        
        except (KeyError, IndexError) as e:
            print(f"Response parsing error: {e}")
            if 'response' in locals():
                print(f"Response content: {response.text}")
            return "Sorry, I encountered an error processing the AI response."
    
    @staticmethod
    def format_message_history(messages_queryset):
        """
        Convert Django messages queryset to API format
        """
        message_history = []
        
        for msg in messages_queryset:
            message_history.append({
                "role": msg.role,
                "content": msg.content
            })
            
        return message_history