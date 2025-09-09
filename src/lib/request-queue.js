// Shared request queue system to manage API request timing globally
// This ensures we don't overwhelm the API even when multiple parts of the app make requests simultaneously

class RequestQueue {
  constructor(maxConcurrent = 2, minInterval = 400) {
    this.maxConcurrent = maxConcurrent // Maximum concurrent requests
    this.minInterval = minInterval // Minimum time between requests (ms)
    this.queue = []
    this.activeRequests = 0
    this.lastRequestTime = 0
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    const waitTime = Math.max(0, this.minInterval - timeSinceLastRequest)

    if (waitTime > 0) {
      setTimeout(() => this.process(), waitTime)
      return
    }

    const { requestFn, resolve, reject } = this.queue.shift()
    this.activeRequests++
    this.lastRequestTime = Date.now()

    try {
      const result = await requestFn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.activeRequests--
      // Process next request after a small delay
      setTimeout(() => this.process(), 50)
    }
  }

  // Get current queue status for debugging
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      timeSinceLastRequest: Date.now() - this.lastRequestTime
    }
  }
}

// Global request queues for different services
export const scryfallQueue = new RequestQueue(3, 250) // Max 3 concurrent, 250ms between requests
export const pricingQueue = new RequestQueue(2, 300)  // Max 2 concurrent, 300ms between requests for pricing

// Helper function to queue a request
export const queueRequest = async (requestFn, queueType = 'general') => {
  const queue = queueType === 'pricing' ? pricingQueue : scryfallQueue
  return await queue.add(requestFn)
}

// Export the RequestQueue class for custom usage
export { RequestQueue }
