// lib/cache.js
// Simple in-memory cache with TTL

class Cache {
  constructor(defaultTtl = 60000) { // Default TTL: 60 seconds
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
  }

  // Set a value in the cache with optional TTL
  set(key, value, ttl = this.defaultTtl) {
    const expiry = Date.now() + ttl;
    
    // If there's an existing timeout, clear it
    const existing = this.cache.get(key);
    if (existing && existing.timeout) {
      clearTimeout(existing.timeout);
    }
    
    // Set timeout to automatically remove the item when it expires
    const timeout = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    // Store the value, expiry time, and timeout reference
    this.cache.set(key, { value, expiry, timeout });
    
    return value;
  }

  // Get a value from the cache
  get(key) {
    const item = this.cache.get(key);
    
    // If item doesn't exist or has expired, return null
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Clean up expired item
        this.delete(key);
      }
      return null;
    }
    
    return item.value;
  }

  // Delete a value from the cache
  delete(key) {
    const item = this.cache.get(key);
    if (item && item.timeout) {
      clearTimeout(item.timeout);
    }
    return this.cache.delete(key);
  }

  // Check if a key exists and is not expired
  has(key) {
    const item = this.cache.get(key);
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Clean up expired item
        this.delete(key);
      }
      return false;
    }
    return true;
  }

  // Clear the entire cache
  clear() {
    // Clear all timeouts
    for (const item of this.cache.values()) {
      if (item.timeout) {
        clearTimeout(item.timeout);
      }
    }
    this.cache.clear();
  }

  // Get cache stats
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton instance
const cache = new Cache();

module.exports = cache;
