// middleware/rateLimiter.js
// Simple in-memory rate limiter to prevent too many requests

// Store request counts per IP
const requestCounts = {};
// Store timestamps of last request per IP
const lastRequests = {};

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  // Remove entries older than 10 minutes
  Object.keys(lastRequests).forEach(ip => {
    if (now - lastRequests[ip] > 10 * 60 * 1000) {
      delete requestCounts[ip];
      delete lastRequests[ip];
    }
  });
}, 10 * 60 * 1000);

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum number of requests per window
 * @returns {Function} Express middleware function
 */
function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000; // 1 minute by default
  const maxRequests = options.maxRequests || 60; // 60 requests per minute by default

  return (req, res, next) => {
    // Get client IP
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Initialize request count if not exists
    if (!requestCounts[ip]) {
      requestCounts[ip] = 0;
    }
    
    // Get current time
    const now = Date.now();
    
    // Reset count if window has passed
    if (lastRequests[ip] && now - lastRequests[ip] > windowMs) {
      requestCounts[ip] = 0;
    }
    
    // Update last request time
    lastRequests[ip] = now;
    
    // Increment request count
    requestCounts[ip]++;
    
    // Check if rate limit exceeded
    if (requestCounts[ip] > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((lastRequests[ip] + windowMs - now) / 1000)
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCounts[ip]));
    res.setHeader('X-RateLimit-Reset', Math.ceil((lastRequests[ip] + windowMs) / 1000));
    
    next();
  };
}

module.exports = rateLimiter;
