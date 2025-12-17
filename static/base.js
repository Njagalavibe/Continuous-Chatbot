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

document.addEventListener('DOMContentLoaded', function() {
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    let hoverTimer;
    let isMouseInDropdown = false;
    const delayTime = 300; // ms delay before closing
    
    if (profileBtn && profileDropdown) {
        // Show dropdown on hover over button
        profileBtn.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimer);
            profileDropdown.style.display = 'block';
        });
        
        // Hide dropdown with delay when leaving button
        profileBtn.addEventListener('mouseleave', function() {
            hoverTimer = setTimeout(function() {
                if (!isMouseInDropdown) {
                    profileDropdown.style.display = 'none';
                }
            }, delayTime);
        });
        
        // Keep dropdown open when mouse enters it
        profileDropdown.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimer);
            isMouseInDropdown = true;
            profileDropdown.style.display = 'block';
        });
        
        // Hide dropdown when leaving it
        profileDropdown.addEventListener('mouseleave', function() {
            isMouseInDropdown = false;
            hoverTimer = setTimeout(function() {
                profileDropdown.style.display = 'none';
            }, delayTime);
        });
        
        // Also keep click functionality for mobile/touch
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = profileDropdown.style.display === 'block';
            profileDropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.style.display = 'none';
            }
        });
    }
});

// Export for use in other files (if using modules)
//if (typeof module !== 'undefined' && module.exports) {
//    module.exports = { AppUtils };
//}