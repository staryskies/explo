// middleware/delayResponse.js
// Middleware to add a small delay to API responses to reduce server load

/**
 * Adds a delay to API responses
 * @param {Object} options - Delay options
 * @param {number} options.minDelay - Minimum delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @returns {Function} Express middleware function
 */
function delayResponse(options = {}) {
  const minDelay = options.minDelay || 100; // 100ms minimum delay by default
  const maxDelay = options.maxDelay || 500; // 500ms maximum delay by default

  return (req, res, next) => {
    // Only delay API requests
    if (req.path.startsWith('/api/')) {
      // Calculate a random delay between min and max
      const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      
      // Add delay
      setTimeout(next, delay);
    } else {
      // No delay for non-API requests
      next();
    }
  };
}

module.exports = delayResponse;
