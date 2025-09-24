/**
 * Notification system for the tower defense game
 */
// Log that notification.js is loaded
console.log('Notification system loaded');

// Create a global notification system
const notificationSystem = {
  // Container for notifications
  container: null,
  
  // Initialize the notification system
  init: function() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.style.position = 'fixed';
      this.container.style.top = '20px';
      this.container.style.right = '20px';
      this.container.style.zIndex = '9999';
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';
      this.container.style.alignItems = 'flex-end';
      this.container.style.gap = '10px';
      this.container.style.maxWidth = '300px';
      document.body.appendChild(this.container);
    }
  },
  
  // Show a notification
  show: function(message, type = 'info', duration = 3000) {
    // Initialize if not already
    this.init();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.backgroundColor = this.getBackgroundColor(type);
    notification.style.color = this.getTextColor(type);
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.marginBottom = '10px';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    notification.style.maxWidth = '100%';
    notification.style.wordWrap = 'break-word';
    notification.style.fontWeight = 'bold';
    notification.style.fontSize = '14px';
    notification.style.fontFamily = 'Roboto, sans-serif';
    notification.style.border = `1px solid ${this.getBorderColor(type)}`;
    
    // Add icon based on type
    const icon = this.getIcon(type);
    notification.innerHTML = `${icon} ${message}`;
    
    // Add to container
    this.container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(50px)';
      
      // Remove from DOM after animation
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
    
    return notification;
  },
  
  // Show success notification
  success: function(message, duration = 3000) {
    return this.show(message, 'success', duration);
  },
  
  // Show error notification
  error: function(message, duration = 3000) {
    return this.show(message, 'error', duration);
  },
  
  // Show info notification
  info: function(message, duration = 3000) {
    return this.show(message, 'info', duration);
  },
  
  // Show warning notification
  warning: function(message, duration = 3000) {
    return this.show(message, 'warning', duration);
  },
  
  // Show roll notification (special styling for gacha rolls)
  roll: function(message, rarity = 'common', duration = 3000) {
    // Initialize if not already
    this.init();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-roll notification-${rarity}`;
    notification.style.backgroundColor = this.getRarityColor(rarity);
    notification.style.color = '#FFFFFF';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    notification.style.marginBottom = '10px';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    notification.style.maxWidth = '100%';
    notification.style.wordWrap = 'break-word';
    notification.style.fontWeight = 'bold';
    notification.style.fontSize = '16px';
    notification.style.fontFamily = 'Roboto, sans-serif';
    notification.style.border = `2px solid ${this.getRarityBorderColor(rarity)}`;
    notification.style.textAlign = 'center';
    
    // Add sparkle effect for rare+ rolls
    if (rarity !== 'common') {
      notification.style.animation = 'sparkle 1.5s infinite';
      
      // Add keyframes for sparkle animation if not already added
      if (!document.getElementById('notification-keyframes')) {
        const style = document.createElement('style');
        style.id = 'notification-keyframes';
        style.textContent = `
          @keyframes sparkle {
            0% { box-shadow: 0 0 5px ${this.getRarityColor(rarity)}; }
            50% { box-shadow: 0 0 20px ${this.getRarityColor(rarity)}; }
            100% { box-shadow: 0 0 5px ${this.getRarityColor(rarity)}; }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Add icon based on rarity
    const icon = this.getRarityIcon(rarity);
    notification.innerHTML = `${icon} ${message}`;
    
    // Add to container
    this.container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      
      // Remove from DOM after animation
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
    
    return notification;
  },
  
  // Get background color based on type
  getBackgroundColor: function(type) {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#2196F3';
    }
  },
  
  // Get text color based on type
  getTextColor: function(type) {
    return '#FFFFFF';
  },
  
  // Get border color based on type
  getBorderColor: function(type) {
    switch (type) {
      case 'success': return '#388E3C';
      case 'error': return '#D32F2F';
      case 'warning': return '#F57C00';
      case 'info': return '#1976D2';
      default: return '#1976D2';
    }
  },
  
  // Get icon based on type
  getIcon: function(type) {
    switch (type) {
      case 'success': return '<span style="margin-right: 8px;">✓</span>';
      case 'error': return '<span style="margin-right: 8px;">✗</span>';
      case 'warning': return '<span style="margin-right: 8px;">⚠</span>';
      case 'info': return '<span style="margin-right: 8px;">ℹ</span>';
      default: return '<span style="margin-right: 8px;">ℹ</span>';
    }
  },
  
  // Get color based on rarity
  getRarityColor: function(rarity) {
    switch (rarity) {
      case 'common': return '#78909C';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FFC107';
      case 'mythic': return '#FF5722';
      case 'divine': return '#E91E63';
      default: return '#78909C';
    }
  },
  
  // Get border color based on rarity
  getRarityBorderColor: function(rarity) {
    switch (rarity) {
      case 'common': return '#546E7A';
      case 'rare': return '#1976D2';
      case 'epic': return '#7B1FA2';
      case 'legendary': return '#FFA000';
      case 'mythic': return '#E64A19';
      case 'divine': return '#C2185B';
      default: return '#546E7A';
    }
  },
  
  // Get icon based on rarity
  getRarityIcon: function(rarity) {
    switch (rarity) {
      case 'common': return '<span style="margin-right: 8px;">🔹</span>';
      case 'rare': return '<span style="margin-right: 8px;">🔷</span>';
      case 'epic': return '<span style="margin-right: 8px;">💠</span>';
      case 'legendary': return '<span style="margin-right: 8px;">⭐</span>';
      case 'mythic': return '<span style="margin-right: 8px;">🌟</span>';
      case 'divine': return '<span style="margin-right: 8px;">✨</span>';
      default: return '<span style="margin-right: 8px;">🔹</span>';
    }
  }
};

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  notificationSystem.init();
});

// Make notification system globally available
window.notificationSystem = notificationSystem;
