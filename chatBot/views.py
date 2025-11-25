from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Conversation, Message

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
    return render(request, 'register.html', {'form': form})
