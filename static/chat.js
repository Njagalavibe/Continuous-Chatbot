// Chat-specific JavaScript functionality with real API integration

class ChatApp {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.chatMessages = document.getElementById('chat-messages');
        this.loading = document.getElementById('loading');
        
        this.isSending = false;
        this.csrfToken = this.getCsrfToken();
        
        this.init();
    }
    
    init() {
        this.enableInput();
        this.setupEventListeners();
        this.scrollToBottom();
        this.focusInput();
        this.startAutoRefresh();
    }
    
    getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }
    
    enableInput() {
        if (this.messageInput) this.messageInput.disabled = false;
        if (this.sendBtn) this.sendBtn.disabled = false;
    }
    
    setupEventListeners() {
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isSending) {
                    this.sendMessage();
                }
            });
        }
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    focusInput() {
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }
    
    addMessage(role, content) {
        if (!this.chatMessages) return;
        
        const emptyState = this.chatMessages.querySelector('.empty-chat');
        if (emptyState) {
            emptyState.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
        messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'AI'}:</strong><br>${this.escapeHtml(content)}`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async sendMessage() {
        if (this.isSending) return;
        
        const message = this.messageInput?.value.trim();
        if (!message) return;
        
        this.isSending = true;
        this.disableInput();
        this.showLoading();
        
        // Add user message immediately for better UX
        this.addMessage('user', message);
        this.clearInput();
        
        try {
            const response = await this.sendToAPI(message);
            
            if (response.status === 'success') {
                this.addMessage('assistant', response.ai_response);
            } else {
                this.addMessage('assistant', `Error: ${response.message || 'Failed to get response'}`);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('assistant', 'Sorry, there was an error connecting to the AI service.');
        } finally {
            this.enableInput();
            this.hideLoading();
            this.focusInput();
            this.isSending = false;
        }
    }
    
    async sendToAPI(message) {
        const response = await fetch('/send_message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken
            },
            body: JSON.stringify({ message: message })
        });
        
        return await response.json();
    }
    
    disableInput() {
        if (this.messageInput) this.messageInput.disabled = true;
        if (this.sendBtn) this.sendBtn.disabled = true;
    }
    
    enableInput() {
        if (this.messageInput) this.messageInput.disabled = false;
        if (this.sendBtn) this.sendBtn.disabled = false;
    }
    
    showLoading() {
        if (this.loading) this.loading.style.display = 'block';
    }
    
    hideLoading() {
        if (this.loading) this.loading.style.display = 'none';
    }
    
    clearInput() {
        if (this.messageInput) this.messageInput.value = '';
    }
    
    async refreshMessages() {
        try {
            const response = await fetch('/get_messages/');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.renderAllMessages(data.messages);
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
        }
    }
    
    renderAllMessages(messages) {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-chat';
            emptyDiv.innerHTML = '<p>No messages yet. Start your conversation!</p>';
            this.chatMessages.appendChild(emptyDiv);
            return;
        }
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`;
            messageDiv.innerHTML = `<strong>${msg.role === 'user' ? 'You' : 'AI'}:</strong><br>${this.escapeHtml(msg.content)}`;
            this.chatMessages.appendChild(messageDiv);
        });
        
        this.scrollToBottom();
    }
    
    startAutoRefresh() {
        // Refresh messages every 3 seconds for cross-device sync
        setInterval(() => {
            this.refreshMessages();
        }, 3000);
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ChatApp();
});