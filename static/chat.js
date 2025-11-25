// Chat-specific JavaScript functionality

class ChatApp {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.chatMessages = document.getElementById('chat-messages');
        this.loading = document.getElementById('loading');
        
        this.init();
    }
    
    init() {
        // Enable input fields
        this.enableInput();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial scroll to bottom
        this.scrollToBottom();
        
        // Focus on input
        this.focusInput();
    }
    
    enableInput() {
        if (this.messageInput) this.messageInput.disabled = false;
        if (this.sendBtn) this.sendBtn.disabled = false;
    }
    
    setupEventListeners() {
        // Send button click
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Enter key in input
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
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
    
    sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message) return;
        
        // Disable input and show loading
        this.disableInput();
        this.showLoading();
        
        // Add user message immediately
        this.addMessage('user', message);
        this.clearInput();
        
        // Simulate AI response (will be replaced with real API call)
        this.simulateAIResponse(message);
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
    
    simulateAIResponse(userMessage) {
        // Simulate API delay
        setTimeout(() => {
            const responses = [
                `I understand you're saying: "${userMessage}". This is a simulated response until we connect to the DeepSeek API.`,
                `You asked about: "${userMessage}". In the next version, this will be a real AI response from DeepSeek!`,
                `Interesting point about "${userMessage}". The actual API integration will happen in the next development phase.`,
                `Regarding "${userMessage}" - this is currently a simulation. Real AI responses coming soon!`
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addMessage('assistant', randomResponse);
            
            // Re-enable input
            this.enableInput();
            this.hideLoading();
            this.focusInput();
        }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ChatApp();
});