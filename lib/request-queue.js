// lib/request-queue.js
// Request queue system to manage database connections and prevent overload

// Queue configuration
const config = {
  maxConcurrentRequests: 5,
  requestTimeout: 3000, // 3 seconds
  maxQueueSize: 100,
  maxRetries: 2,
  retryDelay: 500 // 500ms
};

// Queue state
const state = {
  activeRequests: 0,
  queue: [],
  requestMap: new Map() // Map to track requests by ID
};

// Generate a unique request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Add a request to the queue
function enqueueRequest(operation, priority = 1) {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    
    // Create request object
    const request = {
      id: requestId,
      operation,
      priority,
      resolve,
      reject,
      timestamp: Date.now(),
      retries: 0
    };
    
    // Check if queue is full
    if (state.queue.length >= config.maxQueueSize) {
      // If queue is full, reject low priority requests
      if (priority < 2) {
        return reject(new Error('Queue is full. Please try again later.'));
      }
      
      // For high priority requests, remove the oldest low priority request
      const lowestPriorityIndex = state.queue.findIndex(req => req.priority < 2);
      if (lowestPriorityIndex !== -1) {
        const removedRequest = state.queue.splice(lowestPriorityIndex, 1)[0];
        removedRequest.reject(new Error('Request was dropped due to high server load.'));
        console.log(`Dropped low priority request ${removedRequest.id} to make room for high priority request ${requestId}`);
      } else {
        return reject(new Error('Server is too busy. Please try again later.'));
      }
    }
    
    // Add to queue
    state.queue.push(request);
    state.requestMap.set(requestId, request);
    
    // Sort queue by priority (higher first) and then by timestamp (older first)
    state.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
    
    // Process queue
    processQueue();
    
    // Set timeout for this request
    setTimeout(() => {
      // If request is still in queue, remove it and reject
      if (state.requestMap.has(requestId)) {
        const index = state.queue.findIndex(req => req.id === requestId);
        if (index !== -1) {
          state.queue.splice(index, 1);
          state.requestMap.delete(requestId);
          reject(new Error('Request timed out in queue.'));
        }
      }
    }, config.requestTimeout);
  });
}

// Process the queue
async function processQueue() {
  // If we're already at max concurrent requests, do nothing
  if (state.activeRequests >= config.maxConcurrentRequests) {
    return;
  }
  
  // If queue is empty, do nothing
  if (state.queue.length === 0) {
    return;
  }
  
  // Get the next request
  const request = state.queue.shift();
  state.requestMap.delete(request.id);
  
  // Increment active requests
  state.activeRequests++;
  
  try {
    // Execute the operation
    const result = await Promise.race([
      request.operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), config.requestTimeout)
      )
    ]);
    
    // Resolve the request
    request.resolve(result);
  } catch (error) {
    console.error(`Error processing request ${request.id}:`, error.message);
    
    // Check if we should retry
    if (request.retries < config.maxRetries) {
      request.retries++;
      
      // Re-queue with a delay
      setTimeout(() => {
        state.queue.push(request);
        state.requestMap.set(request.id, request);
        
        // Re-sort queue
        state.queue.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return a.timestamp - b.timestamp;
        });
        
        console.log(`Retrying request ${request.id} (attempt ${request.retries}/${config.maxRetries})`);
      }, config.retryDelay * request.retries);
    } else {
      // Max retries reached, reject
      request.reject(error);
    }
  } finally {
    // Decrement active requests
    state.activeRequests--;
    
    // Process next request
    processQueue();
  }
}

// Get queue stats
function getQueueStats() {
  return {
    activeRequests: state.activeRequests,
    queueLength: state.queue.length,
    maxConcurrentRequests: config.maxConcurrentRequests,
    maxQueueSize: config.maxQueueSize
  };
}

// Update queue configuration
function updateQueueConfig(newConfig) {
  Object.assign(config, newConfig);
}

module.exports = {
  enqueueRequest,
  getQueueStats,
  updateQueueConfig
};
