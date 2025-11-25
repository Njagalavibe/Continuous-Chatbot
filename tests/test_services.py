import os
import sys

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chatBot_project.settings')
django.setup()

from chatBot_app.services import DeepSeekService

def test_services():
    """Test the DeepSeekService class"""
    print("Testing Services...")
    
    try:
        # Test message history formatting
        from chatBot_app.models import Conversation, Message, User
        
        # Create test data
        user = User.objects.create_user('service_test_user', 'service@test.com', 'testpass')
        conversation = Conversation.objects.get(user=user)
        
        # Create test messages
        Message.objects.create(conversation=conversation, role='user', content='Hello')
        Message.objects.create(conversation=conversation, role='assistant', content='Hi there!')
        
        # Test formatting
        messages = Message.objects.filter(conversation=conversation)
        formatted = DeepSeekService.format_message_history(messages)
        
        print(f"Message history formatted: {len(formatted)} messages")
        print(f"Format: {formatted}")
        
        # Test API call (optional - might use credits)
        # response = DeepSeekService.send_message(formatted)
        # print(f"API Response: {response}")
        
        # Cleanup
        user.delete()
        
        return True
        
    except Exception as e:
        print(f"Services test failed: {e}")
        return False

if __name__ == "__main__":
    test_services()