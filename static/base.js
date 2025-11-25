// Base JavaScript functionality used across the site

// Utility functions
class AppUtils {
    static showLoading(element) {
        element.style.display = 'block';
    }
    
    static hideLoading(element) {
        element.style.display = 'none';
    }
    
    static disableElements(...elements) {
        elements.forEach(element => {
            if (element) element.disabled = true;
        });
    }
    
    static enableElements(...elements) {
        elements.forEach(element => {
            if (element) element.disabled = false;
        });
    }
    
    static showNotification(message, type = 'info') {
        // Simple notification system - can be enhanced with toast library
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Auto-scroll functionality
class AutoScroll {
    static toBottom(container) {
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    static toTop(container) {
        if (container) {
            container.scrollTop = 0;
        }
    }
}

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppUtils, AutoScroll };
}