import { Platform } from 'react-native';
import { throttledLogger } from '@/utils/throttled-logger';

interface DiagnosticInfo {
  platform: string;
  userAgent: string;
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
  performance?: {
    navigation: number;
    domContentLoaded: number;
  };
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
  };
  network: {
    online: boolean;
    connection?: any;
  };
}

export class WebDiagnostics {
  private static instance: WebDiagnostics;
  private diagnosticInterval?: ReturnType<typeof setInterval>;

  static getInstance(): WebDiagnostics {
    if (!WebDiagnostics.instance) {
      WebDiagnostics.instance = new WebDiagnostics();
    }
    return WebDiagnostics.instance;
  }

  startMonitoring() {
    if (Platform.OS !== 'web') return;

    console.log('🔍 WebDiagnostics: Starting web diagnostics monitoring...');

    // Initial diagnostic
    this.runDiagnostic();

    // Run diagnostics every 60 seconds
    this.diagnosticInterval = setInterval(() => {
      this.runDiagnostic();
    }, 60000);

    // Monitor for critical events
    this.setupEventListeners();
  }

  stopMonitoring() {
    if (this.diagnosticInterval) {
      clearInterval(this.diagnosticInterval);
      this.diagnosticInterval = undefined;
    }
  }

  private setupEventListeners() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 WebDiagnostics: Network connection restored');
    });

    window.addEventListener('offline', () => {
      console.warn('📡 WebDiagnostics: Network connection lost');
    });

    // Monitor visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        throttledLogger.log('👁️ WebDiagnostics: Tab became hidden');
      } else {
        throttledLogger.log('👁️ WebDiagnostics: Tab became visible');
        // Run diagnostic when tab becomes visible again
        setTimeout(() => this.runDiagnostic(), 1000);
      }
    });

    // Monitor page unload
    window.addEventListener('beforeunload', () => {
      console.log('🚪 WebDiagnostics: Page is unloading');
    });
  }

  private runDiagnostic(): DiagnosticInfo | null {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    try {
      const diagnostic: DiagnosticInfo = {
        platform: Platform.OS,
        userAgent: navigator.userAgent,
        storage: this.checkStorageSupport(),
        network: this.checkNetworkStatus(),
      };

      // Memory information (Chrome only)
      if ('memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory;
        diagnostic.memory = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        };

        // Warn about high memory usage
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 85) {
          console.warn(`⚠️ WebDiagnostics: Critical memory usage: ${usagePercent.toFixed(1)}%`);
        } else if (usagePercent > 70) {
          throttledLogger.warn(`⚠️ WebDiagnostics: High memory usage: ${usagePercent.toFixed(1)}%`);
        }
      }

      // Performance timing
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        diagnostic.performance = {
          navigation: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        };
      }

      // Log diagnostic summary (throttled)
      throttledLogger.log('📊 WebDiagnostics:', {
        memory: diagnostic.memory ? `${diagnostic.memory.used}MB/${diagnostic.memory.limit}MB` : 'N/A',
        online: diagnostic.network.online,
        storage: Object.entries(diagnostic.storage).filter(([, supported]) => supported).map(([name]) => name).join(', '),
      });

      return diagnostic;
    } catch (error) {
      console.error('❌ WebDiagnostics: Error running diagnostic:', error);
      return null;
    }
  }

  private checkStorageSupport() {
    const storage = {
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
    };

    try {
      storage.localStorage = typeof localStorage !== 'undefined' && localStorage !== null;
      if (storage.localStorage) {
        // Test localStorage
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      }
    } catch (e) {
      storage.localStorage = false;
      console.warn('⚠️ WebDiagnostics: localStorage not available:', e);
    }

    try {
      storage.sessionStorage = typeof sessionStorage !== 'undefined' && sessionStorage !== null;
      if (storage.sessionStorage) {
        // Test sessionStorage
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
      }
    } catch (e) {
      storage.sessionStorage = false;
      console.warn('⚠️ WebDiagnostics: sessionStorage not available:', e);
    }

    try {
      storage.indexedDB = typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch (e) {
      storage.indexedDB = false;
      console.warn('⚠️ WebDiagnostics: IndexedDB not available:', e);
    }

    return storage;
  }

  private checkNetworkStatus() {
    const network = {
      online: navigator.onLine,
    };

    // Network connection info (modern browsers)
    if ('connection' in navigator) {
      (network as any).connection = {
        effectiveType: (navigator as any).connection?.effectiveType,
        downlink: (navigator as any).connection?.downlink,
        rtt: (navigator as any).connection?.rtt,
      };
    }

    return network;
  }

  // Method to check if the app is in a problematic state
  checkAppHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];

    if (Platform.OS !== 'web') {
      return { healthy: true, issues: [] };
    }

    // Check memory usage
    if ('memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 90) {
        issues.push('Critical memory usage');
      }
    }

    // Check network status
    if (!navigator.onLine) {
      issues.push('No network connection');
    }

    // Check storage availability
    const storage = this.checkStorageSupport();
    if (!storage.localStorage) {
      issues.push('localStorage not available');
    }

    // Check for document visibility (tab might be hidden for too long)
    if (document.hidden) {
      issues.push('Tab is hidden');
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}

export const webDiagnostics = WebDiagnostics.getInstance();
export default webDiagnostics;