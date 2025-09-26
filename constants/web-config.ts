import { Platform } from 'react-native';

// Web-specific configuration for better performance and compatibility
export const WEB_CONFIG = {
  // Reduce animation durations on web for better performance
  ANIMATION_DURATION: Platform.OS === 'web' ? 150 : 300,
  
  // Faster loading timeouts on web
  LOADING_TIMEOUT: Platform.OS === 'web' ? 10 : 100,
  
  // Reduced debounce times for better responsiveness
  SEARCH_DEBOUNCE: Platform.OS === 'web' ? 150 : 300,
  
  // Web-specific styles
  STYLES: {
    // Cursor styles for interactive elements
    CURSOR_POINTER: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
    USER_SELECT_NONE: Platform.OS === 'web' ? { userSelect: 'none' } : {},
    
    // Container styles for web
    FULL_HEIGHT: Platform.OS === 'web' ? { height: '100vh' } : {},
    FULL_WIDTH: Platform.OS === 'web' ? { width: '100vw' } : {},
    
    // Overflow handling
    OVERFLOW_HIDDEN: Platform.OS === 'web' ? { overflow: 'hidden' } : {},
  },
  
  // Feature flags for web compatibility
  FEATURES: {
    // Disable certain features on web that don't work well
    HAPTICS: Platform.OS !== 'web',
    SPLASH_SCREEN: Platform.OS !== 'web',
    NATIVE_ALERTS: Platform.OS !== 'web',
    
    // Enable web-specific optimizations
    FAST_REFRESH: Platform.OS === 'web',
    REDUCED_LOGGING: Platform.OS === 'web',
  },
  
  // Performance settings
  PERFORMANCE: {
    // Reduce re-renders on web
    USE_MEMO_AGGRESSIVELY: Platform.OS === 'web',
    
    // Batch updates for better performance
    BATCH_UPDATES: Platform.OS === 'web',
    
    // Reduce effect dependencies
    MINIMAL_EFFECTS: Platform.OS === 'web',
  },
};

// Helper functions for web compatibility
export const webHelpers = {
  // Safe console logging that can be disabled on web
  log: (...args: any[]) => {
    if (!WEB_CONFIG.FEATURES.REDUCED_LOGGING || __DEV__) {
      console.log(...args);
    }
  },
  
  // Safe error logging
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  // Safe warning logging
  warn: (...args: any[]) => {
    if (!WEB_CONFIG.FEATURES.REDUCED_LOGGING || __DEV__) {
      console.warn(...args);
    }
  },
  
  // Platform-specific timeout with better web performance
  timeout: (callback: () => void, delay?: number) => {
    const actualDelay = delay || WEB_CONFIG.LOADING_TIMEOUT;
    if (Platform.OS === 'web') {
      // Use requestAnimationFrame for better web performance when possible
      if (actualDelay <= 16) {
        return requestAnimationFrame(callback) as any;
      }
    }
    return setTimeout(callback, actualDelay);
  },
  
  // Platform-specific animation duration
  getAnimationDuration: (defaultDuration: number = 300) => {
    return Platform.OS === 'web' ? Math.min(defaultDuration, WEB_CONFIG.ANIMATION_DURATION) : defaultDuration;
  },
};

export default WEB_CONFIG;