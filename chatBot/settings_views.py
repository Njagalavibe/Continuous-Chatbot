# chatBot/settings_views.py
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings as django_settings
from .models import UserSettings, ContactMessage

@login_required
def general_view(request):
    """
    Handles General Settings page (theme, language)
    """
    # Get or create user settings (signals should handle creation. Note:safety first)
    user_settings, created = UserSettings.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        # Update settings from form data
        user_settings.theme = request.POST.get('theme', 'light')
        user_settings.language = request.POST.get('language', 'en')
        user_settings.save()
        
        messages.success(request, 'General settings saved successfully!')
        return redirect('chatBot:general_settings')
    
    # Pass the choices to template for rendering dropdowns
    return render(request, 'settings/general.html', {
        'user_settings': user_settings,
        'theme_choices': UserSettings.THEME_CHOICES,
        'language_choices': UserSettings.LANGUAGE_CHOICES,
    })

@login_required
def contact_view(request):
    """
    Handles Contact page - saves message to DB and sends email
    """

    """
    Handles Contact page - saves message to DB only (no email sent).
    Admin can view messages in Django admin.
    """
    if request.method == 'POST':
        # Get data from the form
        name = request.POST.get('name', '').strip()
        email = request.POST.get('email', '').strip()
        message_text = request.POST.get('message', '').strip()
        
        # Basic validation - ensure all required fields are filled
        if not name:
            messages.error(request, 'Please enter your name.')
        elif not email:
            messages.error(request, 'Please enter your email address.')
        elif not message_text:
            messages.error(request, 'Please enter your message.')
        else:
            # All validation passed - Save to database
            ContactMessage.objects.create(
                user=request.user,  # Automatically links to the logged-in user
                name=name,
                email=email,
                message=message_text,
                status='new'  # Default status for new messages
            )
            
            messages.success(request, 'Thank you! Your message has been received and saved. The admin will review it shortly.')
            return redirect('chatBot:contact_settings')  # Clear the form on success
    
    # If GET request or failed validation, show the form again
    return render(request, 'settings/contact.html')


@login_required
def help_view(request):
    """
    Static Help/FAQ page - can expand with dynamic content later
    """
    faq_items = [
        {
            'question': 'How do I change the app theme?',
            'answer': 'Go to General Settings and select your preferred theme from the dropdown.',
            'category': 'General'
        },
        {
            'question': 'Can I use the app in different languages?',
            'answer': 'Yes! Currently supported languages: English, Spanish, French, German. Select in General Settings.',
            'category': 'General'
        },
        {
            'question': 'How do I contact support?',
            'answer': 'Use the Contact form in Settings. We typically respond within 24 hours.',
            'category': 'Contact'
        },
        {
            'question': 'Is my chat history saved?',
            'answer': 'Yes, your chat history is saved and can be accessed from the main History page.',
            'category': 'Chat'
        },
        {
            'question': 'Can I delete my account?',
            'answer': 'Account management is available in your Profile settings (accessible from the main dropdown).',
            'category': 'Account'
        },
    ]
    
    return render(request, 'settings/help.html', {
        'faq_items': faq_items,
        'categories': set(item['category'] for item in faq_items)
    })