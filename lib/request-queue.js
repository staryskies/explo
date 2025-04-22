// lib/request-queue.js
// Request queue system to manage database connections and prevent overload

// Queue configuration
const config = {
  maxConcurrentRequests: 5, // Increased for Neon's connection pooler
  requestTimeout: 10000, // Increased to 10 seconds for Neon
  maxQueueSize: 100, // Increased back to 100 for higher capacity
  maxRetries: 2, // Increased to 2 retries
  retryDelay: 2000, // Increased to 2 seconds
  operationTimeout: 8000 // Increased timeout for individual operations
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
      retries: 0,
      timeout: null // Will store the timeout reference
    };

    // Check if we're already at max concurrent requests and this is a low priority request
    if (state.activeRequests >= config.maxConcurrentRequests && priority < 2) {
      // If we're already at capacity with active requests, reject immediately for low priority
      console.log(`Rejecting low priority request ${requestId} due to high server load (${state.activeRequests} active requests)`);
      return reject(new Error('Server is currently busy. Please try again later.'));
    }

    // Check if queue is full
    if (state.queue.length >= config.maxQueueSize) {
      // If queue is full, reject low priority requests
      if (priority < 2) {
        console.log(`Rejecting low priority request ${requestId} due to full queue (${state.queue.length} items)`);
        return reject(new Error('Queue is full. Please try again later.'));
      }

      // For high priority requests, remove the oldest low priority request
      const lowestPriorityIndex = state.queue.findIndex(req => req.priority < 2);
      if (lowestPriorityIndex !== -1) {
        const removedRequest = state.queue.splice(lowestPriorityIndex, 1)[0];
        // Clear the timeout for the removed request
        if (removedRequest.timeout) {
          clearTimeout(removedRequest.timeout);
        }
        removedRequest.reject(new Error('Request was dropped due to high server load.'));
        console.log(`Dropped low priority request ${removedRequest.id} to make room for high priority request ${requestId}`);
      } else {
        console.log(`Rejecting high priority request ${requestId} because queue is full with all high priority requests`);
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
    request.timeout = setTimeout(() => {
      // If request is still in queue, remove it and reject
      if (state.requestMap.has(requestId)) {
        const index = state.queue.findIndex(req => req.id === requestId);
        if (index !== -1) {
          state.queue.splice(index, 1);
          state.requestMap.delete(requestId);
          console.log(`Request ${requestId} timed out in queue after ${config.requestTimeout}ms`);
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

  // Clear the timeout for this request since we're processing it now
  if (request.timeout) {
    clearTimeout(request.timeout);
    request.timeout = null;
  }

  // Increment active requests
  state.activeRequests++;

  try {
    // Execute the operation with a timeout
    const result = await Promise.race([
      request.operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), config.operationTimeout)
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
        // Only re-queue if the request hasn't been rejected by a timeout
        if (!request.timeout) {
          // Set a new timeout for the retried request
          request.timeout = setTimeout(() => {
            // If request is still in queue, remove it and reject
            if (state.requestMap.has(request.id)) {
              const index = state.queue.findIndex(req => req.id === request.id);
              if (index !== -1) {
                state.queue.splice(index, 1);
                state.requestMap.delete(request.id);
                console.log(`Retried request ${request.id} timed out in queue after ${config.requestTimeout}ms`);
                request.reject(new Error('Request timed out in queue during retry.'));
              }
            }
          }, config.requestTimeout);

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
        }
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
