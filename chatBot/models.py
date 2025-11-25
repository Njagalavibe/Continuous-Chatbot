from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

#conversation model to track chat history
class Conversation(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Conversation"
    

#message model to store individual messages
class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('assistant', 'Assistant')])
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
    

# Auto-create conversation when user is created
@receiver(post_save, sender=User)
def create_user_conversation(sender, instance, created, **kwargs):
    if created:
        Conversation.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_conversation(sender, instance, **kwargs):
    instance.conversation.save()


