// Rate limiting for authentication endpoints
// Prevents brute force attacks

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis for production)
const store: RateLimitStore = {};

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // Max attempts per window

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = `auth:${identifier}`;
  
  // Clean expired entries
  if (store[key] && store[key].resetTime < now) {
    delete store[key];
  }
  
  // Initialize if not exists
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }
  
  // Increment counter
  store[key].count++;
  
  const allowed = store[key].count <= MAX_ATTEMPTS;
  const remaining = Math.max(0, MAX_ATTEMPTS - store[key].count);
  
  return {
    allowed,
    remaining,
    resetTime: store[key].resetTime,
  };
}

export function resetRateLimit(identifier: string): void {
  const key = `auth:${identifier}`;
  delete store[key];
}