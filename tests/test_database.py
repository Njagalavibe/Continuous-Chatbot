import os
import sys

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chatBot_project.settings')
django.setup()

from chatBot.models import Conversation, Message, User

def test_database_models():
    """Test database models and relationships"""
    print("Testing Database Models...")
    
    try:
        # Test user creation
        user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
        print("User created successfully")
        
        # Test conversation auto-creation
        conversation = Conversation.objects.get(user=user)
        print("Conversation auto-created successfully")
        
        # Test message creation
        message = Message.objects.create(
            conversation=conversation,
            role='user',
            content='Test message'
        )
        print("Message created successfully")
        
        # Test relationship
        messages = conversation.messages.all()
        print(f"Conversation has {len(messages)} messages")
        
        # Cleanup
        user.delete()
        print("Test data cleaned up")
        
        return True
        
    except Exception as e:
        print(f"Database test failed: {e}")
        return False

if __name__ == "__main__":
    test_database_models()