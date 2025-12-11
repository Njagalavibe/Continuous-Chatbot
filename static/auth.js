//    AUTHENTICATION PAGE JAVASCRIPT 
// Purpose: Handle authentication page interactions (register/login toggle)


// 1. MAIN MODULE PATTERN - Keeps global scope clean

(function() {
    'use strict'; // Prevents common JavaScript errors
    
    // 2. CONFIGURATION CONSTANTS
   
    const CONFIG = {
        animationSpeed: 300, // milliseconds for animations
        storageKey: 'auth_form_data', // localStorage key
        urlHashes: {
            register: '#register',
            login: '#login'
        }
    };
    
    // 3. STATE MANAGEMENT:
    const STATE = {
        currentView: 'choice', // 'choice', 'register', or 'login'
        isLoading: false,
        formData: {}
    };
    
    /**  4. DOM ELEMENT REFERENCES:
    Note: We'll store all DOM elements here for easy access. */
    let DOM = {};
    
    // 5. CORE FUNCTIONS   
    /**
      Initialize the authentication page
      This runs when DOM is fully loaded
     */
    function init() {
        console.log('Auth page initializing...');
        
        // Step 1: Get all DOM elements
        cacheDOMElements();
        
        // Step 2: Check if this is actually an auth page
        if (!isAuthPage()) {
            console.log('Not an auth page, skipping initialization');
            return;
        }
        
        // Step 3: Bind event listeners
        bindEvents();
        
        // Step 4: Check URL hash to show correct form
        checkUrlHash();
        
        // Step 5: Check for form errors from Django
        checkForFormErrors();
        
        console.log('Auth page initialized successfully');
    }
    
    /**
      Cache all DOM elements we need
      This prevents searching the DOM multiple times
     */
    function cacheDOMElements() {
        // Main containers
        DOM.authChoiceSection = document.querySelector('.auth-choice-section');
        DOM.authFormsContainer = document.querySelector('.auth-forms-container');
        
        // Forms
        DOM.registerFormCard = document.getElementById('register-form-card');
        DOM.loginFormCard = document.getElementById('login-form-card');
        DOM.registerForm = document.getElementById('register-form');
        DOM.loginForm = document.getElementById('login-form');
        
        // Buttons
        DOM.showRegisterBtn = document.getElementById('show-register-btn');
        DOM.showLoginBtn = document.getElementById('show-login-btn');
        DOM.backToChoiceBtn = document.getElementById('back-to-choice-btn');
        
        // Message close buttons
        DOM.messageCloseBtns = document.querySelectorAll('.auth-message-close');
        
        // Form submit buttons
        DOM.registerSubmitBtn = DOM.registerForm?.querySelector('.auth-form-submit');
        DOM.loginSubmitBtn = DOM.loginForm?.querySelector('.auth-form-submit');
    }
    
    /**
      Check if current page is an authentication page
      @returns {boolean} True if auth page, false otherwise.
     */
    function isAuthPage() {
        // Check if we have the auth page container
        return document.querySelector('.auth-page') !== null;
    }
    
    //Bind all event listeners
    function bindEvents() {
        // Choice buttons
        if (DOM.showRegisterBtn) {
            DOM.showRegisterBtn.addEventListener('click', showRegisterForm);
        }
        
        if (DOM.showLoginBtn) {
            DOM.showLoginBtn.addEventListener('click', showLoginForm);
        }
        
        // Back button
        if (DOM.backToChoiceBtn) {
            DOM.backToChoiceBtn.addEventListener('click', showChoiceSection);
        }
        
        // Form submissions
        if (DOM.registerForm) {
            DOM.registerForm.addEventListener('submit', handleRegisterSubmit);
        }
        
        if (DOM.loginForm) {
            DOM.loginForm.addEventListener('submit', handleLoginSubmit);
        }
        
        // Message close buttons
        DOM.messageCloseBtns.forEach(button => {
            button.addEventListener('click', closeMessage);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Browser back/forward buttons
        window.addEventListener('popstate', handleBrowserHistory);
    }
    
    /**
     Show the register form, hide choice section
     */
    function showRegisterForm() {
        console.log('Showing register form');
        
        // Update state
        STATE.currentView = 'register';
        
        // Hide choice section
        DOM.authChoiceSection.hidden = true;
        
        // Show forms container
        DOM.authFormsContainer.hidden = false;
        
        // Show register form, hide login form
        DOM.registerFormCard.hidden = false;
        DOM.loginFormCard.hidden = true;
        
        // Update URL
        updateUrlHash(CONFIG.urlHashes.register);
        
        // Focus on first input (accessibility)
        setTimeout(() => {
            const firstInput = DOM.registerForm.querySelector('input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, CONFIG.animationSpeed);
    }
    
    /**
     Show the login form, hide choice section
     */
    function showLoginForm() {
        console.log('Showing login form');
        
        // Update state
        STATE.currentView = 'login';
        
        // Hide choice section
        DOM.authChoiceSection.hidden = true;
        
        // Show forms container
        DOM.authFormsContainer.hidden = false;
        
        // Show login form, hide register form
        DOM.loginFormCard.hidden = false;
        DOM.registerFormCard.hidden = true;
        
        // Update URL
        updateUrlHash(CONFIG.urlHashes.login);
        
        // Focus on first input (accessibility)
        setTimeout(() => {
            const firstInput = DOM.loginForm.querySelector('input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, CONFIG.animationSpeed);
    }
    
    /**
     Show the choice section, hide forms
     */
    function showChoiceSection() {
        console.log('Showing choice section');
        
        // Update state
        STATE.currentView = 'choice';
        
        // Show choice section
        DOM.authChoiceSection.hidden = false;
        
        // Hide forms container
        DOM.authFormsContainer.hidden = true;
        
        // Clear URL hash
        updateUrlHash('');
        
        // Optional: Clear form data if you want
        // clearFormData();
    }
    
    /**
    Update URL hash without page reload
     @param {string} hash - The hash to set (e.g., '#register')
     */
    function updateUrlHash(hash) {
        // Use history API for clean URLs
        if (history.pushState) {
            const newUrl = hash ? `${window.location.pathname}${hash}` : window.location.pathname;
            history.pushState(null, null, newUrl);
        } else {
            // Fallback for older browsers
            window.location.hash = hash;
        }
    }
    
    /**
    Handle browser back/forward button clicks
     */
    function handleBrowserHistory() {
        const hash = window.location.hash;
        
        console.log('Browser history changed:', hash);
        
        if (hash === CONFIG.urlHashes.register) {
            showRegisterForm();
        } else if (hash === CONFIG.urlHashes.login) {
            showLoginForm();
        } else {
            showChoiceSection();
        }
    }
    
    /**
      Check URL hash on page load
     */
    function checkUrlHash() {
        const hash = window.location.hash;
        
        if (hash === CONFIG.urlHashes.register) {
            showRegisterForm();
        } else if (hash === CONFIG.urlHashes.login) {
            showLoginForm();
        }
        // If no hash or different hash, choice section remains visible
    }
    
    /**
     Handle register form submission
     @param {Event} event - The form submit event
     */
    function handleRegisterSubmit(event) {
        console.log('Register form submitting...');
        
        // Add client-side validation
        if (!validateRegisterForm()) {
            event.preventDefault();
            return;
        }
        
        // Show loading state
        setLoadingState(DOM.registerSubmitBtn, 'Creating Account...');
        
        // Form will submit to Django server
        // Django handles validation and redirects
    }
    
    /**
    Handle login form submission
    @param {Event} event - The form submit event
     */
    function handleLoginSubmit(event) {
        console.log('Login form submitting...');
        
        // Add client-side validation
        if (!validateLoginForm()) {
            event.preventDefault();
            return;
        }
        
        // Show loading state
        setLoadingState(DOM.loginSubmitBtn, 'Signing In...');
        
        // Form will submit to Django server
    }
    
    /**
    Simple client-side validation for register form
    @returns {boolean} True if valid, false otherwise
     */
    function validateRegisterForm() {
        if (!DOM.registerForm) return true;
        
        const password1 = document.getElementById('id_password1')?.value;
        const password2 = document.getElementById('id_password2')?.value;
        
        // Check if passwords match
        if (password1 && password2 && password1 !== password2) {
            alert('Passwords do not match. Please try again.');
            return false;
        }
        
        // Check password length
        if (password1 && password1.length < 8) {
            alert('Password must be at least 8 characters long.');
            return false;
        }
        
        return true;
    }
    
    /**
    Simple client-side validation for login form
    @returns {boolean} True if valid, false otherwise
     */
    function validateLoginForm() {
        // Add any login-specific validation here
        // For now, just return true
        return true;
    }
    
    /**
    Set loading state on a button
    @param {HTMLElement} button - The button element
    @param {string} loadingText - Text to show while loading
     */
    function setLoadingState(button, loadingText) {
        if (!button) return;
        
        // Store original text
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        
        // Update button
        button.disabled = true;
        button.textContent = loadingText;
        button.classList.add('form-submitting');
        
        STATE.isLoading = true;
    }
    
    /**
    Remove loading state from a button
    @param {HTMLElement} button - The button element
     */
    function removeLoadingState(button) {
        if (!button || !button.dataset.originalText) return;
        
        button.disabled = false;
        button.textContent = button.dataset.originalText;
        button.classList.remove('form-submitting');
        
        STATE.isLoading = false;
    }
    
    /**
    Close message/alert when X is clicked
    @param {Event} event - The click event
     */
    function closeMessage(event) {
        const messageElement = event.target.closest('.auth-message');
        if (messageElement) {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                messageElement.remove();
            }, 300);
        }
    }
    
    /**
    Handle keyboard shortcuts
    @param {Event} event - The keydown event
     */
    function handleKeyboardShortcuts(event) {
        // Don't trigger if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Escape key - go back to choice section
        if (event.key === 'Escape' && STATE.currentView !== 'choice') {
            showChoiceSection();
        }
        
        // Ctrl+Enter - submit current form
        if (event.ctrlKey && event.key === 'Enter') {
            if (STATE.currentView === 'register' && DOM.registerForm) {
                DOM.registerForm.requestSubmit();
            } else if (STATE.currentView === 'login' && DOM.loginForm) {
                DOM.loginForm.requestSubmit();
            }
        }
    }
    
    /**
    Check if Django returned form errors
    If errors exist, ensure correct form is shown
     */
    function checkForFormErrors() {
        // Check for error messages
        const errorMessages = document.querySelectorAll('.auth-form-error, .auth-message--error');
        
        if (errorMessages.length === 0) return;
        
        console.log('⚠️ Form errors detected');
        
        // Check which form has errors
        const registerHasErrors = document.querySelectorAll('#register-form .auth-form-error, #register-form .auth-message--error').length > 0;
        const loginHasErrors = document.querySelectorAll('#login-form .auth-form-error, #login-form .auth-message--error').length > 0;
        
        // Show appropriate form based on errors
        if (registerHasErrors && STATE.currentView !== 'register') {
            setTimeout(showRegisterForm, 100);
        } else if (loginHasErrors && STATE.currentView !== 'login') {
            setTimeout(showLoginForm, 100);
        }
    }
    
    /**
    Clear form data (optional)
     */
    function clearFormData() {
        if (confirm('Clear all form data?')) {
            if (DOM.registerForm) DOM.registerForm.reset();
            if (DOM.loginForm) DOM.loginForm.reset();
        }
    }
    
    // 6. PUBLIC API (Optional)
    // Expose functions if needed by other scripts
    window.AuthPage = {
        showRegisterForm,
        showLoginForm,
        showChoiceSection,
        getState: () => ({ ...STATE })
    };
    
    
    /** 7. INITIALIZATION
     Wait for DOM to be fully loaded */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }
    
})();