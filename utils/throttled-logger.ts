// Throttled logging utility to prevent console spam that can cause performance issues
class ThrottledLogger {
  private logCounts: Map<string, { count: number; lastLog: number }> = new Map();
  private readonly throttleMs = 1000; // 1 second throttle
  private readonly maxLogsPerInterval = 5;

  private getLogKey(level: string, message: string): string {
    // Create a key based on log level and first 50 chars of message
    return `${level}:${message.substring(0, 50)}`;
  }

  private shouldLog(key: string): boolean {
    const now = Date.now();
    const existing = this.logCounts.get(key);

    if (!existing) {
      this.logCounts.set(key, { count: 1, lastLog: now });
      return true;
    }

    // Reset count if enough time has passed
    if (now - existing.lastLog > this.throttleMs) {
      this.logCounts.set(key, { count: 1, lastLog: now });
      return true;
    }

    // Check if we've exceeded the limit
    if (existing.count >= this.maxLogsPerInterval) {
      return false;
    }

    // Increment count and allow log
    existing.count++;
    return true;
  }

  log(message: string, ...args: any[]) {
    const key = this.getLogKey('log', message);
    if (this.shouldLog(key)) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    const key = this.getLogKey('warn', message);
    if (this.shouldLog(key)) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    const key = this.getLogKey('error', message);
    if (this.shouldLog(key)) {
      console.error(message, ...args);
    }
  }

  // Always log critical errors
  critical(message: string, ...args: any[]) {
    console.error('🚨 CRITICAL:', message, ...args);
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.logCounts.entries()) {
      if (now - data.lastLog > this.throttleMs * 10) { // Clean up after 10 intervals
        this.logCounts.delete(key);
      }
    }
  }
}

export const throttledLogger = new ThrottledLogger();

// Clean up every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    throttledLogger.cleanup();
  }, 30000);
}

export default throttledLogger;