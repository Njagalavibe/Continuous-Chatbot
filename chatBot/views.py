from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Conversation, Message
from .services import DeepSeekService 

# Home view - if authenticated, show chat interface
def home(request):
    if request.user.is_authenticated:
        # Get user's conversation
        conversation = Conversation.objects.get(user=request.user)
        # Get all messages in this conversation
        messages = Message.objects.filter(conversation=conversation)
        return render(request, 'chat.html', {
            'messages': messages,
            'conversation': conversation
        })
    else:
        return render(request, 'home.html')

#user registration view
def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Conversation auto-created by our signal
            login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'regester.html', {'form': form})

#api endpoint to send and receive messages
@csrf_exempt
def send_message(request):
    """
    API endpoint to send message to DeepSeek and save response
    """
    if request.method == 'POST' and request.user.is_authenticated:
        try:
            data = json.loads(request.body)
            user_message = data.get('message', '').strip()
            
            if not user_message:
                return JsonResponse({'status': 'error', 'message': 'Message cannot be empty'})
            
            # Get user's conversation
            conversation = Conversation.objects.get(user=request.user)
            
            # Save user message
            Message.objects.create(
                conversation=conversation,
                role='user',
                content=user_message
            )
            
            # Get conversation history for context
            previous_messages = Message.objects.filter(conversation=conversation).order_by('timestamp')
            message_history = DeepSeekService.format_message_history(previous_messages)
            
            # Get AI response from DeepSeek
            ai_response = DeepSeekService.send_message(message_history)
            
            # Save AI response
            ai_msg = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=ai_response
            )
            
            # Update conversation timestamp
            conversation.save()
            
            return JsonResponse({
                'status': 'success',
                'user_message': user_message,
                'ai_response': ai_response
            })
            
        except Exception as e:
            print(f"Error in send_message: {e}")
            return JsonResponse({'status': 'error', 'message': 'Internal server error'})
    
    return JsonResponse({'status': 'error', 'message': 'Unauthorized'})

@csrf_exempt
def get_messages(request):
    """
    API endpoint to get all messages for the current user's conversation
    """
    if request.user.is_authenticated:
        try:
            conversation = Conversation.objects.get(user=request.user)
            messages = Message.objects.filter(conversation=conversation).order_by('timestamp')
            
            messages_data = [
                {
                    'role': msg.role, 
                    'content': msg.content, 
                    'timestamp': msg.timestamp.isoformat()
                }
                for msg in messages
            ]
            
            return JsonResponse({'status': 'success', 'messages': messages_data})
            
        except Conversation.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Conversation not found'})
    
    return JsonResponse({'status': 'error', 'message': 'Unauthorized'})