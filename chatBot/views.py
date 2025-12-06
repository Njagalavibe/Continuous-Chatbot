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
        # Get user's most recent conversation
        conversation = Conversation.objects.filter(user=request.user, is_active=True).order_by('-updated_at').first()
        if not conversation:
            conversation = Conversation.objects.create(user=request.user)
        
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
            conversation_id = data.get('conversation_id')
            
            if not user_message:
                return JsonResponse({'status': 'error', 'message': 'Message cannot be empty'})
            
            # Get or create conversation
            if conversation_id:
                try:
                    conversation = Conversation.objects.get(id=conversation_id, user=request.user, is_active=True)
                except Conversation.DoesNotExist:
                    return JsonResponse({'status': 'error', 'message': 'Conversation not found'})
            else:
                conversation = Conversation.objects.create(user=request.user)
            
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
                'ai_response': ai_response,
                'conversation_id': conversation.id
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
            conversation_id = request.GET.get('conversation_id')
            if conversation_id:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user, is_active=True)
            else:
                # Get most recent conversation
                conversation = Conversation.objects.filter(user=request.user, is_active=True).order_by('-updated_at').first()
                if not conversation:
                    return JsonResponse({'status': 'success', 'messages': []})
            
            messages = Message.objects.filter(conversation=conversation).order_by('timestamp')
            
            messages_data = [
                {
                    'role': msg.role, 
                    'content': msg.content, 
                    'timestamp': msg.timestamp.isoformat()
                }
                for msg in messages
            ]
            
            return JsonResponse({'status': 'success', 'messages': messages_data, 'conversation_id': conversation.id})
            
        except Conversation.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Conversation not found'})
    
    return JsonResponse({'status': 'error', 'message': 'Unauthorized'})

# Add the conversation history endpoints from our previous work
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import timedelta

def get_time_display(dt):
    """Convert datetime to display format for sidebar"""
    now = timezone.now()
    diff = now - dt
    
    if diff.days == 0:
        return dt.strftime('%I:%M %p').lstrip('0')  # 2:30 PM
    elif diff.days == 1:
        return 'Yesterday'
    elif diff.days < 7:
        return dt.strftime('%A')  # Monday, Tuesday, etc.
    else:
        return dt.strftime('%b %d')  # Mar 15

@login_required
@require_http_methods(["GET"])
def conversation_history(request):
    """Get all conversations for the current user, grouped by date"""
    conversations = Conversation.objects.filter(
        user=request.user, 
        is_active=True
    ).prefetch_related('messages').order_by('-updated_at')
    
    # Get current date info
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    last_week = today - timedelta(days=7)
    
    # Organize conversations by date groups
    history_data = {
        'today': [],
        'yesterday': [],
        'last_7_days': [],
        'older': []
    }
    
    for conv in conversations:
        conv_data = {
            'id': conv.id,
            'title': conv.title,
            'preview': conv.preview_text,
            'message_count': conv.message_count,
            'last_updated': conv.updated_at.isoformat(),
            'time_display': get_time_display(conv.updated_at)
        }
        
        # Categorize by date
        conv_date = conv.updated_at.date()
        if conv_date == today:
            history_data['today'].append(conv_data)
        elif conv_date == yesterday:
            history_data['yesterday'].append(conv_data)
        elif conv_date >= last_week:
            history_data['last_7_days'].append(conv_data)
        else:
            history_data['older'].append(conv_data)
    
    return JsonResponse({'conversations': history_data})

@login_required
@require_http_methods(["GET"])
def get_conversation(request, conversation_id):
    """Load a specific conversation with all its messages"""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id, 
            user=request.user, 
            is_active=True
        )
        messages = conversation.messages.all()
        
        messages_data = []
        for msg in messages:
            messages_data.append({
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat()
            })
        
        return JsonResponse({
            'status': 'success',
            'conversation': {
                'id': conversation.id,
                'title': conversation.title,
                'messages': messages_data
            }
        })
    except Conversation.DoesNotExist:
        return JsonResponse({
            'status': 'error', 
            'message': 'Conversation not found'
        }, status=404)

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def create_conversation(request):
    """Create a new empty conversation"""
    try:
        conversation = Conversation.objects.create(user=request.user)
        
        return JsonResponse({
            'status': 'success',
            'conversation': {
                'id': conversation.id,
                'title': conversation.title,
                'preview': conversation.preview_text,
                'message_count': conversation.message_count,
                'last_updated': conversation.updated_at.isoformat(),
                'time_display': get_time_display(conversation.updated_at)
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def delete_conversation(request, conversation_id):
    """Soft delete a conversation"""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id, 
            user=request.user
        )
        conversation.is_active = False
        conversation.save()
        
        return JsonResponse({'status': 'success'})
    except Conversation.DoesNotExist:
        return JsonResponse({
            'status': 'error', 
            'message': 'Conversation not found'
        }, status=404)