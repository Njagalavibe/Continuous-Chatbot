from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# Enhanced conversation model to support multiple conversations per user
class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')  # Changed to ForeignKey
    title = models.CharField(max_length=255, default="New Conversation")  # Added title field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # Added for soft delete

    class Meta:
        ordering = ['-updated_at']  # Most recent first

    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    @property
    def message_count(self):
        return self.messages.count()
    
    @property
    def preview_text(self):
        """Get preview text from first user message"""
        first_user_message = self.messages.filter(role='user').first()
        if first_user_message:
            content = first_user_message.content
            return content[:100] + '...' if len(content) > 100 else content
        return "Empty conversation"

# Enhanced message model
class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('assistant', 'Assistant')])
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
    
    def save(self, *args, **kwargs):
        # Auto-generate conversation title from first user message
        if self.role == 'user' and self.conversation.title == "New Conversation":
            if len(self.content) > 50:
                self.conversation.title = f"{self.content[:50]}..."
            else:
                self.conversation.title = self.content
            self.conversation.save()
        
        super().save(*args, **kwargs)

# Keep  existing signals but update them for the new model structure
@receiver(post_save, sender=User)
def create_user_conversation(sender, instance, created, **kwargs):
    if created:
        # Create one initial conversation for the user (maintains backward compatibility)
        Conversation.objects.create(user=instance)

class UserSettings(models.Model):
    """Stores user-specific application preferences."""
    
    # Theme choices
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto (System)'), ]
    
    # Language choices
    LANGUAGE_CHOICES = [
        ('en', 'English'),]
    
    # One user has one settings profile
    user = models.OneToOneField(User, on_delete=models.CASCADE,
        related_name='settings')
    
    # Theme preference
    theme = models.CharField(max_length=10,choices=THEME_CHOICES,
        default='light')
    
    # Language preference
    language = models.CharField(max_length=10,choices=LANGUAGE_CHOICES,
        default='en')
    
    # Additional preferences (optional - add as needed)
    notifications_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Settings for {self.user.username}"
    
    class Meta:
        verbose_name = "User Settings"
        verbose_name_plural = "User Settings"


class ContactMessage(models.Model):
    """Stores messages sent via the contact form."""
    
    # Sender information
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    
    # Status tracking
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('archived', 'Archived'),]
    
    status = models.CharField( max_length=10,choices=STATUS_CHOICES,
        default='new')
    
    # Optional: Link to user if they're logged in
    user = models.ForeignKey(User,on_delete=models.SET_NULL,null=True, 
        blank=True,related_name='contact_messages')
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.name} ({self.submitted_at.strftime('%Y-%m-%d')})"
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"


# Signal to automatically create UserSettings when a new user is created
@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """Create a UserSettings instance for every new User."""
    if created:
        UserSettings.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_settings(sender, instance, **kwargs):
    """Save UserSettings when User is saved (safety mechanism)."""
    try:
        instance.settings.save()
    except UserSettings.DoesNotExist:
        UserSettings.objects.create(user=instance)
