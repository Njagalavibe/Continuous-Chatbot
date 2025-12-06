// Fixed Chat JavaScript - Show Latest Messages First
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const chatMessages = document.getElementById('chat-messages');
    const aiLoading = document.getElementById('ai-loading');
    
    let isSending = false;
    let currentConversationId = null; // Track current conversation
    
    // ENABLE ALL INPUTS ON PAGE LOAD
    enableAllInputs();
    
    // === ADDED: SCROLL TO BOTTOM ON PAGE LOAD ===
    setTimeout(() => { if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight; }, 150);
    
    if (messageInput) messageInput.focus();
    
    // Event listeners
    if (messageInput) {
        messageInput.addEventListener('input', autoResizeTextarea);
        messageInput.addEventListener('keypress', handleKeyPress);
    }
    
    if (pasteBtn) pasteBtn.addEventListener('click', handlePaste);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    // ===== SIDEBAR FUNCTIONALITY =====
    class SidebarManager {
        constructor() {
            this.sidebar = document.querySelector('.sidebar-container');
            this.sidebarToggle = document.getElementById('sidebar-toggle');
            this.sidebarClose = document.getElementById('sidebar-close');
            this.sidebarOverlay = document.getElementById('sidebar-overlay');
            this.searchInput = document.getElementById('conversation-search');
            this.newChatBtn = document.getElementById('new-chat-btn');
            this.conversationGroups = document.querySelectorAll('.conversation-group');
            
            this.init();
        }

        init() {
            if (!this.sidebar) return;
            
            this.setupEventListeners();
            this.setupMobileBehavior();
            this.setupTabletBehavior();
            this.loadConversationHistory();
        }

        setupEventListeners() {
            // Search functionality
            if (this.searchInput) {
                this.searchInput.addEventListener('input', (e) => {
                    this.filterConversations(e.target.value);
                });
            }

            // New chat button
            if (this.newChatBtn) {
                this.newChatBtn.addEventListener('click', () => {
                    this.startNewChat();
                });
            }

            // Group title clicks for collapse/expand
            this.setupGroupCollapse();
        }

        setupMobileBehavior() {
            // Mobile sidebar toggle
            if (this.sidebarToggle) {
                this.sidebarToggle.addEventListener('click', () => {
                    this.openMobileSidebar();
                });
            }

            // Close sidebar buttons
            if (this.sidebarClose) {
                this.sidebarClose.addEventListener('click', () => {
                    this.closeMobileSidebar();
                });
            }

            if (this.sidebarOverlay) {
                this.sidebarOverlay.addEventListener('click', () => {
                    this.closeMobileSidebar();
                });
            }

            // Close sidebar on window resize
            window.addEventListener('resize', () => {
                this.handleResponsiveBehavior();
            });
        }

        setupTabletBehavior() {
            // Initial tablet setup
            this.handleResponsiveBehavior();
        }

        handleResponsiveBehavior() {
            const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
            const isLandscape = window.innerWidth > window.innerHeight;
            
            if (isTablet && !isLandscape) {
                // Tablet portrait: Hide sidebar
                this.closeMobileSidebar();
            }
        }

        setupGroupCollapse() {
            document.querySelectorAll('.group-title').forEach(title => {
                title.addEventListener('click', (e) => {
                    const group = e.target.closest('.conversation-group');
                    group.classList.toggle('collapsed');
                    
                    this.saveCollapsedState(group.dataset.group, group.classList.contains('collapsed'));
                });
            });
        }

        saveCollapsedState(groupName, isCollapsed) {
            const states = JSON.parse(sessionStorage.getItem('sidebarGroupStates') || '{}');
            states[groupName] = isCollapsed;
            sessionStorage.setItem('sidebarGroupStates', JSON.stringify(states));
        }

        loadCollapsedStates() {
            const states = JSON.parse(sessionStorage.getItem('sidebarGroupStates') || '{}');
            
            this.conversationGroups.forEach(group => {
                const groupName = group.dataset.group;
                if (states[groupName]) {
                    group.classList.add('collapsed');
                }
            });
        }

        async loadConversationHistory() {
            // Show loading state
            this.showLoadingState();
            
            try {
                // Simulate API call - replace with your actual endpoint
                const response = await fetch('/api/conversations/history/', {
                    headers: {
                        'X-CSRFToken': getCsrfToken()
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.renderConversationHistory(data.conversations);
                } else {
                    this.showEmptyState();
                }
            } catch (error) {
                console.error('Failed to load conversation history:', error);
                this.showEmptyState();
            }
        }

        showLoadingState() {
            const loadingEl = document.getElementById('sidebar-loading');
            const emptyEl = document.getElementById('sidebar-empty');
            const groupsContainer = document.getElementById('conversation-groups-container');
            const noResultsEl = document.getElementById('no-search-results');
            
            if (loadingEl) loadingEl.style.display = 'flex';
            if (emptyEl) emptyEl.style.display = 'none';
            if (groupsContainer) groupsContainer.style.display = 'none';
            if (noResultsEl) noResultsEl.style.display = 'none';
        }

        showEmptyState() {
            const loadingEl = document.getElementById('sidebar-loading');
            const emptyEl = document.getElementById('sidebar-empty');
            const groupsContainer = document.getElementById('conversation-groups-container');
            const noResultsEl = document.getElementById('no-search-results');
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'flex';
            if (groupsContainer) groupsContainer.style.display = 'none';
            if (noResultsEl) noResultsEl.style.display = 'none';
        }

        renderConversationHistory(conversations) {
            const loadingEl = document.getElementById('sidebar-loading');
            const emptyEl = document.getElementById('sidebar-empty');
            const groupsContainer = document.getElementById('conversation-groups-container');
            const noResultsEl = document.getElementById('no-search-results');
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'none';
            if (groupsContainer) groupsContainer.style.display = 'block';
            if (noResultsEl) noResultsEl.style.display = 'none';
            
            // Clear existing conversation lists
            document.querySelectorAll('.conversation-list').forEach(list => {
                list.innerHTML = '';
            });
            
            // Add conversations to groups (without updating counts)
            Object.keys(conversations).forEach(groupName => {
                const groupData = conversations[groupName];
                const groupEl = document.querySelector(`[data-group="${groupName}"]`);
                
                if (groupEl) {
                    const listEl = groupEl.querySelector('.conversation-list');
                    
                    groupData.forEach(conversation => {
                        const conversationCard = this.createConversationCard(conversation);
                        listEl.appendChild(conversationCard);
                    });
                }
            });
            
            // Load collapsed states after rendering
            this.loadCollapsedStates();
        }

        createConversationCard(conversation) {
            const card = document.createElement('div');
            card.className = 'conversation-card';
            card.dataset.conversationId = conversation.id;
            
            if (conversation.id === currentConversationId) {
                card.classList.add('active');
            }
            
            card.innerHTML = `
                <div class="conversation-preview">
                    <p class="preview-text">${this.escapeHtml(conversation.preview)}</p>
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${conversation.time_display}</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.loadConversation(conversation.id);
            });
            
            return card;
        }

        escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        async loadConversation(conversationId) {
            try {
                // Set as active conversation
                this.setActiveConversation(conversationId);
                currentConversationId = conversationId;
                
                // Load conversation messages
                const response = await fetch(`/api/conversations/${conversationId}/`, {
                    headers: {
                        'X-CSRFToken': getCsrfToken()
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.renderConversation(data.conversation);
                }
                
                // Close mobile sidebar
                this.closeMobileSidebar();
            } catch (error) {
                console.error('Failed to load conversation:', error);
            }
        }

        setActiveConversation(conversationId) {
            // Remove active class from all cards
            document.querySelectorAll('.conversation-card').forEach(card => {
                card.classList.remove('active');
            });
            
            // Add active class to clicked card
            const activeCard = document.querySelector(`[data-conversation-id="${conversationId}"]`);
            if (activeCard) {
                activeCard.classList.add('active');
            }
        }

        renderConversation(conversation) {
            if (!chatMessages) return;
            
            // Clear current chat
            chatMessages.innerHTML = '';
            
            // Add messages from conversation
            conversation.messages.forEach(message => {
                addMessage(message.role, message.content);
            });
            
            // Scroll to bottom
            scrollToBottom();
        }

        filterConversations(searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            const conversationCards = document.querySelectorAll('.conversation-card');
            let hasVisibleResults = false;
            
            conversationCards.forEach(card => {
                const previewText = card.querySelector('.preview-text').textContent.toLowerCase();
                const shouldShow = previewText.includes(term);
                card.style.display = shouldShow ? 'flex' : 'none';
                
                if (shouldShow) hasVisibleResults = true;
            });
            
            // Show/hide groups based on visible cards
            this.conversationGroups.forEach(group => {
                const visibleCards = group.querySelectorAll('.conversation-card[style="display: flex"]');
                group.style.display = visibleCards.length > 0 ? 'block' : 'none';
            });
            
            // Show no results message if needed
            this.showNoResultsMessage(term, hasVisibleResults);
        }

        showNoResultsMessage(searchTerm, hasVisibleResults) {
            const loadingEl = document.getElementById('sidebar-loading');
            const emptyEl = document.getElementById('sidebar-empty');
            const groupsContainer = document.getElementById('conversation-groups-container');
            const noResultsEl = document.getElementById('no-search-results');
            
            if (searchTerm && !hasVisibleResults) {
                if (loadingEl) loadingEl.style.display = 'none';
                if (emptyEl) emptyEl.style.display = 'none';
                if (groupsContainer) groupsContainer.style.display = 'none';
                if (noResultsEl) noResultsEl.style.display = 'flex';
            } else if (groupsContainer) {
                groupsContainer.style.display = 'block';
                if (noResultsEl) noResultsEl.style.display = 'none';
            }
        }

        startNewChat() {
            // Clear active conversation
            this.setActiveConversation(null);
            currentConversationId = null;
            
            // Clear current chat
            clearCurrentChat();
            
            // Clear search
            if (this.searchInput) {
                this.searchInput.value = '';
                this.filterConversations('');
            }
            
            // Close mobile sidebar
            this.closeMobileSidebar();
            
            // Focus on input
            if (messageInput) messageInput.focus();
        }

        openMobileSidebar() {
            if (this.sidebar) {
                this.sidebar.classList.add('mobile-open');
            }
            if (this.sidebarOverlay) {
                this.sidebarOverlay.classList.add('mobile-open');
            }
            document.body.style.overflow = 'hidden';
        }

        closeMobileSidebar() {
            if (this.sidebar) {
                this.sidebar.classList.remove('mobile-open');
            }
            if (this.sidebarOverlay) {
                this.sidebarOverlay.classList.remove('mobile-open');
            }
            document.body.style.overflow = '';
        }
    }

    // Initialize Sidebar Manager
    let sidebarManager;
    try {
        sidebarManager = new SidebarManager();
    } catch (error) {
        console.log('Sidebar initialization failed:', error);
    }

    // New: Function to clear current chat without affecting history
    function clearCurrentChat() {
        if (chatMessages) {
            // Clear all messages
            chatMessages.innerHTML = '';
            
            // Add empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-chat';
            emptyState.innerHTML = '<p>No messages yet. Start your conversation!</p>';
            chatMessages.appendChild(emptyState);
        }
        
        // Clear input
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }
    }
    // ===== END SIDEBAR FUNCTIONALITY =====

    function enableAllInputs() {
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.removeAttribute('disabled');
        }
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.removeAttribute('disabled');
        }
        if (pasteBtn) {
            pasteBtn.disabled = false;
            pasteBtn.removeAttribute('disabled');
        }
    }
    
    function scrollToBottom() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    function smartScrollToBottom() {
        if (!chatMessages) return;
        
        const distanceFromBottom = chatMessages.scrollHeight - chatMessages.clientHeight - chatMessages.scrollTop;
        const isNearBottom = distanceFromBottom < 100;
        
        if (isNearBottom) {
            scrollToBottom();
        }
    }
    
    function autoResizeTextarea() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    }
    
    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey && !isSending) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    async function handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            if (messageInput) {
                messageInput.value += text;
                messageInput.dispatchEvent(new Event('input'));
                messageInput.focus();
            }
        } catch (err) {
            const text = prompt('Paste your text here:');
            if (text && messageInput) {
                messageInput.value += text;
                messageInput.dispatchEvent(new Event('input'));
                messageInput.focus();
            }
        }
    }
    
    async function sendMessage() {
        if (isSending) return;
        
        const message = messageInput?.value.trim();
        if (!message) return;
        
        isSending = true;
        disableInput();
        
        // Add user message
        addMessage('user', message);
        clearInput();
        
        // Show AI loading IMMEDIATELY
        showAILoading();
        
        try {
            const requestBody = { message: message };
            
            // Include conversation ID if we're in an existing conversation
            if (currentConversationId) {
                requestBody.conversation_id = currentConversationId;
            }
            
            const response = await fetch('/send_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            // Hide loading and add AI response
            hideAILoading();
            
            if (data.status === 'success') {
                addMessage('assistant', data.ai_response);
                
                // Update current conversation ID if this is a new conversation
                if (data.conversation_id && !currentConversationId) {
                    currentConversationId = data.conversation_id;
                    
                    // Refresh sidebar to show new conversation
                    if (sidebarManager) {
                        sidebarManager.loadConversationHistory();
                    }
                }
            } else {
                addMessage('assistant', `Error: ${data.message || 'Failed to get response'}`);
            }
            
        } catch (error) {
            hideAILoading();
            addMessage('assistant', 'Sorry, there was an error. Please try again.');
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
        
        if (role === 'assistant') {
            messageContent.appendChild(createMessageFooter(content));
        }
        
        messageDiv.appendChild(messageContent);
        
        // ALWAYS ADD NEW MESSAGES TO THE BOTTOM
        chatMessages.appendChild(messageDiv);
        
        // Smart scroll for new messages only
        smartScrollToBottom();
    }
    
    function createMessageFooter(content) {
        const messageFooter = document.createElement('div');
        messageFooter.className = 'message-footer';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = formatTimestamp(new Date());
        messageFooter.appendChild(timestamp);
        
        const reactionButtons = document.createElement('div');
        reactionButtons.className = 'reaction-buttons';
        
        const likeBtn = createReactionButton('like', 'Like');
        const dislikeBtn = createReactionButton('dislike', 'Dislike');
        const copyBtn = createReactionButton('copy', 'Copy response');
        
        reactionButtons.appendChild(likeBtn);
        reactionButtons.appendChild(dislikeBtn);
        reactionButtons.appendChild(copyBtn);
        messageFooter.appendChild(reactionButtons);
        
        setupReactionButtons(likeBtn, dislikeBtn, copyBtn, content);
        
        return messageFooter;
    }
    
    function createReactionButton(type, title) {
        const button = document.createElement('button');
        button.className = `reaction-btn ${type}-btn`;
        button.title = title;
        button.type = 'button';
        
        const icons = {
            like: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 9V5C14 4.46957 13.7893 3.96086 13.4142 3.58579C13.0391 3.21071 12.5304 3 12 3L7 10V21H17.28C17.7623 21.0055 18.2304 20.8364 18.5979 20.524C18.9654 20.2116 19.2077 19.7789 19.28 19.3L20.66 11.3C20.7035 11.0134 20.6842 10.7207 20.6033 10.4423C20.5225 10.1638 20.3821 9.90629 20.1919 9.68751C20.0016 9.46873 19.7661 9.29393 19.5016 9.17522C19.2371 9.0565 18.9499 8.99672 18.66 9H14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V12C3 11.4696 3.21071 10.9609 3.58579 10.5858C3.96086 10.2107 4.46957 10 5 10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            dislike: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M10 15V19C10 19.5304 10.2107 20.0391 10.5858 20.4142C10.9609 20.7893 11.4696 21 12 21L17 14V3H6.72C6.23769 2.99455 5.76962 3.16359 5.40213 3.47602C5.03465 3.78845 4.79232 4.22106 4.72 4.7L3.34 12.7C3.2965 12.9866 3.31584 13.2793 3.39667 13.5577C3.4775 13.8362 3.61794 14.0937 3.80816 14.3125C3.99839 14.5313 4.23388 14.7061 4.49839 14.8248C4.7629 14.9435 5.0501 15.0033 5.34 15H10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V12C21 12.5304 20.7893 13.0391 20.4142 13.4142C20.0391 13.7893 19.5304 14 19 14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2"/>
            </svg>`
        };
        
        button.innerHTML = icons[type];
        return button;
    }
    
    function setupReactionButtons(likeBtn, dislikeBtn, copyBtn, content) {
        likeBtn.addEventListener('click', function() {
            if (likeBtn.classList.contains('active')) {
                likeBtn.classList.remove('active');
            } else {
                likeBtn.classList.add('active');
                dislikeBtn.classList.remove('active');
            }
        });
        
        dislikeBtn.addEventListener('click', function() {
            if (dislikeBtn.classList.contains('active')) {
                dislikeBtn.classList.remove('active');
            } else {
                dislikeBtn.classList.add('active');
                likeBtn.classList.remove('active');
            }
        });
        
        copyBtn.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(content);
                copyBtn.classList.add('copied');
                copyBtn.title = 'Copied!';
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.title = 'Copy response';
                }, 2000);
            } catch (err) {
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
        
        const diffDays = (today - messageDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        } else if (diffDays === 1) {
            return `Yesterday, ${date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })}`;
        } else {
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
    
    function disableInput() {
        if (messageInput) messageInput.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        if (pasteBtn) pasteBtn.disabled = true;
    }
    
    function enableInput() {
        if (messageInput) messageInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        if (pasteBtn) pasteBtn.disabled = false;
        
        if (messageInput) messageInput.focus();
    }
    
    function showAILoading() {
        if (aiLoading) {
            aiLoading.style.display = 'block';
            smartScrollToBottom();
        }
    }
    
    function hideAILoading() {
        if (aiLoading) aiLoading.style.display = 'none';
    }
    
    function clearInput() {
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }
    }
    
    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
});