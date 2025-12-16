# chatBot/urls.py
from django.urls import path
from . import views  # Your main views (home, chat functions)
from .auth_views import auth_page, register_view, login_view  # New auth views
from django.contrib.auth import views as django_auth_views  # Django's built-in auth
from . import settings_views  # Import settings views

urlpatterns = [
    # Home/Chat URLs
    path('', views.home, name='home'),
    path('send_message/', views.send_message, name='send_message'),
    path('get_messages/', views.get_messages, name='get_messages'),
    
    # Authentication URLs
    path('auth/', auth_page, name='auth'),  # Shows the page with two buttons (shows auth.html)
    path('auth/register/', register_view, name='register'),  # Handles register form
    path('auth/login/', login_view, name='login'),  # Handles login form
    path('auth/logout/', django_auth_views.LogoutView.as_view(next_page='auth'), name='logout'),
    
    # Conversation History URLs
    path('api/conversations/history/', views.conversation_history, name='conversation_history'),
    path('api/conversations/<int:conversation_id>/', views.get_conversation, name='get_conversation'),
    path('api/conversations/create/', views.create_conversation, name='create_conversation'),
    path('api/conversations/<int:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),


    # Settings URLs
    path('settings/general/',settings_views.general_view,name='general_settings'),# General settings page
    path('settings/contact/',settings_views.contact_view,name='contact_settings'),# Contact form page
    path('settings/help/',settings_views.help_view,name='help_center'),# Help center page
    path('settings/account/',settings_views.account_view,name='account_settings'),# Account settings page
    path('settings/account/password-change/', django_auth_views.PasswordChangeView.as_view(template_name='settings/password_change.html',
    success_url='/settings/account/?password_changed=true'), name='password_change'),# Password change page
    # We shall also add a direct modal endpoint later if needed:
    # path('settings/modal/', settings_views.settings_modal_view, name='settings_modal'),

]