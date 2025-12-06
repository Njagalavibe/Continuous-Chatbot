from django.contrib import admin
from .models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'message_count', 'created_at', 'updated_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'updated_at', 'user']
    search_fields = ['title', 'user__username', 'messages__content']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['is_active', 'title']
    list_per_page = 25
    
    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'content_preview', 'timestamp']
    list_filter = ['role', 'timestamp', 'conversation__user']
    search_fields = ['content', 'conversation__title', 'conversation__user__username']
    readonly_fields = ['timestamp']
    list_per_page = 50
    
    def content_preview(self, obj):
        return obj.content[:75] + '...' if len(obj.content) > 75 else obj.content
    content_preview.short_description = 'Content'