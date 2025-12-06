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

# Keep your existing signals but update them for the new model structure
@receiver(post_save, sender=User)
def create_user_conversation(sender, instance, created, **kwargs):
    if created:
        # Create one initial conversation for the user (maintains backward compatibility)
        Conversation.objects.create(user=instance)

# Note: Removed the save_user_conversation signal as it's not needed with ForeignKey
# If you had specific logic in save_user_conversation, let me know and I'll adapt it