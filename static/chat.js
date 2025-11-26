// Updated Chat JavaScript with Fixed Loading and Better Text Area
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat loaded with fixed loading and better text area');
    
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const chatMessages = document.getElementById('chat-messages');
    const aiLoading = document.getElementById('ai-loading');
    
    let isSending = false;
    
    // Enable inputs
    if (messageInput) messageInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (pasteBtn) pasteBtn.disabled = false;
    
    // Auto-resize textarea with taller initial height
    if (messageInput) {
        // Set initial height to be taller
        messageInput.style.height = '60px';
        
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 150) + 'px'; // Increased max height to 150px
        });
        
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Paste button functionality
    if (pasteBtn) {
        pasteBtn.addEventListener('click', async function() {
            try {
                const text = await navigator.clipboard.readText();
                if (messageInput) {
                    messageInput.value += text;
                    messageInput.style.height = 'auto';
                    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
                    messageInput.focus();
                }
            } catch (err) {
                console.error('Failed to read clipboard contents: ', err);
                // Fallback: show prompt
                const text = prompt('Paste your text here:');
                if (text && messageInput) {
                    messageInput.value += text;
                    messageInput.style.height = 'auto';
                    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
                    messageInput.focus();
                }
            }
        });
    }
    
    // Send button functionality
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Focus input on load
    if (messageInput) {
        messageInput.focus();
    }
    
    async function sendMessage() {
        if (isSending) return;
        
        const message = messageInput?.value.trim();
        if (!message) return;
        
        isSending = true;
        disableInput();
        showAILoading();
        
        // Add user message
        addMessage('user', message);
        clearInput();
        
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/send_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            // Hide loading before adding AI response
            hideAILoading();
            
            if (data.status === 'success') {
                addMessage('assistant', data.ai_response);
            } else {
                addMessage('assistant', `Error: ${data.message || 'Failed to get response'}`);
            }
            
        } catch (error) {
            console.error('Error:', error);
            hideAILoading();
            addMessage('assistant', 'Sorry, there was an error.');
        } finally {
            enableInput();
            isSending = false;
        }
    }
    
    function addMessage(role, content) {
        if (!chatMessages) return;
        
        const emptyState = chatMessages.querySelector('.empty-chat');
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
        
        // Add timestamp and reactions only for AI messages
        if (role === 'assistant') {
            const messageFooter = document.createElement('div');
            messageFooter.className = 'message-footer';
            
            // Timestamp
            const timestamp = document.createElement('div');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = formatTimestamp(new Date());
            messageFooter.appendChild(timestamp);
            
            // Reaction buttons
            const reactionButtons = document.createElement('div');
            reactionButtons.className = 'reaction-buttons';
            
            // Like button
            const likeBtn = document.createElement('button');
            likeBtn.className = 'reaction-btn like-btn';
            likeBtn.title = 'Like';
            likeBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 9V5C14 4.46957 13.7893 3.96086 13.4142 3.58579C13.0391 3.21071 12.5304 3 12 3L7 10V21H17.28C17.7623 21.0055 18.2304 20.8364 18.5979 20.524C18.9654 20.2116 19.2077 19.7789 19.28 19.3L20.66 11.3C20.7035 11.0134 20.6842 10.7207 20.6033 10.4423C20.5225 10.1638 20.3821 9.90629 20.1919 9.68751C20.0016 9.46873 19.7661 9.29393 19.5016 9.17522C19.2371 9.0565 18.9499 8.99672 18.66 9H14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V12C3 11.4696 3.21071 10.9609 3.58579 10.5858C3.96086 10.2107 4.46957 10 5 10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            
            // Dislike button
            const dislikeBtn = document.createElement('button');
            dislikeBtn.className = 'reaction-btn dislike-btn';
            dislikeBtn.title = 'Dislike';
            dislikeBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M10 15V19C10 19.5304 10.2107 20.0391 10.5858 20.4142C10.9609 20.7893 11.4696 21 12 21L17 14V3H6.72C6.23769 2.99455 5.76962 3.16359 5.40213 3.47602C5.03465 3.78845 4.79232 4.22106 4.72 4.7L3.34 12.7C3.2965 12.9866 3.31584 13.2793 3.39667 13.5577C3.4775 13.8362 3.61794 14.0937 3.80816 14.3125C3.99839 14.5313 4.23388 14.7061 4.49839 14.8248C4.7629 14.9435 5.0501 15.0033 5.34 15H10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V12C21 12.5304 20.7893 13.0391 20.4142 13.4142C20.0391 13.7893 19.5304 14 19 14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            
            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'reaction-btn copy-btn';
            copyBtn.title = 'Copy response';
            copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
            
            // Add reaction buttons to container
            reactionButtons.appendChild(likeBtn);
            reactionButtons.appendChild(dislikeBtn);
            reactionButtons.appendChild(copyBtn);
            messageFooter.appendChild(reactionButtons);
            messageContent.appendChild(messageFooter);
            
            // Add event listeners for reaction buttons
            setupReactionButtons(likeBtn, dislikeBtn, copyBtn, content);
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Smart scroll only if near bottom
        smartScrollToBottom();
    }
    
    function setupReactionButtons(likeBtn, dislikeBtn, copyBtn, content) {
        // Like button functionality
        likeBtn.addEventListener('click', function() {
            if (likeBtn.classList.contains('active')) {
                likeBtn.classList.remove('active');
            } else {
                likeBtn.classList.add('active');
                dislikeBtn.classList.remove('active');
            }
        });
        
        // Dislike button functionality
        dislikeBtn.addEventListener('click', function() {
            if (dislikeBtn.classList.contains('active')) {
                dislikeBtn.classList.remove('active');
            } else {
                dislikeBtn.classList.add('active');
                likeBtn.classList.remove('active');
            }
        });
        
        // Copy button functionality
        copyBtn.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(content);
                copyBtn.classList.add('copied');
                copyBtn.title = 'Copied!';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.title = 'Copy response';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                copyBtn.classList.add('copied');
                copyBtn.title = 'Copied!';
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.title = 'Copy response';
                }, 2000);
            }
        });
    }
    
    function formatTimestamp(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const diffTime = today - messageDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 0) {
            // Today - show time only
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        } else if (diffDays === 1) {
            // Yesterday - show "time, date"
            return `${date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })}, ${date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            })}`;
        } else {
            // Other dates - show full date and time
            return date.toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
    }
    
    function smartScrollToBottom() {
        if (!chatMessages) return;
        
        const distanceFromBottom = chatMessages.scrollHeight - chatMessages.clientHeight - chatMessages.scrollTop;
        const isNearBottom = distanceFromBottom < 100;
        
        if (isNearBottom) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    function disableInput() {
        if (messageInput) messageInput.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        if (pasteBtn) pasteBtn.disabled = true;
        
        // Show loading state on send button
        if (sendBtn) {
            sendBtn.classList.add('loading');
        }
    }
    
    function enableInput() {
        if (messageInput) messageInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        if (pasteBtn) pasteBtn.disabled = false;
        
        // Remove loading state from send button
        if (sendBtn) {
            sendBtn.classList.remove('loading');
        }
        
        if (messageInput) messageInput.focus();
    }
    
    function showAILoading() {
        if (aiLoading) aiLoading.style.display = 'block';
        smartScrollToBottom(); // Scroll to show loading indicator
    }
    
    function hideAILoading() {
        if (aiLoading) aiLoading.style.display = 'none';
    }
    
    function clearInput() {
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = '60px'; // Reset to taller initial height
        }
    }
    
    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
});