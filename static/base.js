// Base JavaScript functionality used across the site

// Utility functions
class AppUtils {
    static showLoading(element) {
        if (element) element.style.display = 'block';
    }
    
    static hideLoading(element) {
        if (element) element.style.display = 'none';
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

// REMOVED: AutoScroll class - This was causing forced scrolling issues

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppUtils };
}