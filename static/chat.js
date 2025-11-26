// Fixed Chat JavaScript - Preserves server CSS structure
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat loaded - preserving server CSS structure');
    
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const loading = document.getElementById('loading');
    
    // Enable inputs and hide loading
    if (messageInput) messageInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (loading) loading.style.display = 'none';
    
    // Send message function
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Add user message with proper CSS structure
        addMessage('user', message);
        messageInput.value = '';
        
        // Show loading
        if (loading) loading.style.display = 'block';
        if (sendBtn) sendBtn.disabled = true;
        if (messageInput) messageInput.disabled = true;
        
        try {
            const response = await fetch('/send_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            addMessage('assistant', data.ai_response);
            
        } catch (error) {
            addMessage('assistant', 'Error: Could not send message');
        } finally {
            if (loading) loading.style.display = 'none';
            if (sendBtn) sendBtn.disabled = false;
            if (messageInput) messageInput.disabled = false;
            if (messageInput) messageInput.focus();
        }
    }
    
    function addMessage(role, content) {
        const emptyState = document.querySelector('.empty-chat');
        if (emptyState) emptyState.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const strong = document.createElement('strong');
        strong.textContent = role === 'user' ? 'You: ' : 'AI: ';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = content;
        
        messageContent.appendChild(strong);
        messageContent.appendChild(messageText);
        messageDiv.appendChild(messageContent);
        
        if (chatMessages) {
            chatMessages.appendChild(messageDiv);
            // Smart scroll only if near bottom
            smartScrollToBottom();
        }
    }
    
    function smartScrollToBottom() {
        if (!chatMessages) return;
        const distanceFromBottom = chatMessages.scrollHeight - chatMessages.clientHeight - chatMessages.scrollTop;
        if (distanceFromBottom < 100) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
    
    // Event listeners
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
        messageInput.focus();
    }
});