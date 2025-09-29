import { useEffect } from 'react';
import { Platform } from 'react-native';
import { webDiagnostics } from '@/utils/web-diagnostics';
import { webRecoveryManager } from '@/utils/web-recovery-manager';

interface WebErrorMonitorProps {
  onError?: (error: Error, source: string) => void;
}

export function WebErrorMonitor({ onError }: WebErrorMonitorProps) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    console.log('🌐 WebErrorMonitor: Initializing web error monitoring...');
    
    // Start web diagnostics
    webDiagnostics.startMonitoring();

    // Global error handler for unhandled JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('🚨 WebErrorMonitor: Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString()
      });

      const error = event.error || new Error(event.message);
      onError?.(error, 'global');
      
      // Trigger recovery process for critical errors
      webRecoveryManager.handleCrash(error, 'global');
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 WebErrorMonitor: Unhandled promise rejection:', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });

      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      onError?.(error, 'promise');
      
      // Trigger recovery process for unhandled promise rejections
      webRecoveryManager.handleCrash(error, 'promise');
    };

    // Resource loading error handler
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      console.error('🚨 WebErrorMonitor: Resource loading error:', {
        tagName: target?.tagName,
        src: (target as any)?.src,
        href: (target as any)?.href,
        timestamp: new Date().toISOString()
      });

      const error = new Error(`Resource loading failed: ${target?.tagName}`);
      onError?.(error, 'resource');
    };

    // Network error monitoring
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          console.warn('🌐 WebErrorMonitor: Network error:', {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });
        }
        return response;
      } catch (error) {
        console.error('🚨 WebErrorMonitor: Fetch error:', {
          url: args[0],
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true); // Capture phase for resource errors

    // Monitor performance and memory usage
    const monitorPerformance = () => {
      if ('performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory;
        console.log('📊 WebErrorMonitor: Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
          timestamp: new Date().toISOString()
        });

        // Warn if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          console.warn('⚠️ WebErrorMonitor: High memory usage detected:', usagePercent.toFixed(1) + '%');
        }
      }
    };

    // Monitor performance every 30 seconds
    const performanceInterval = setInterval(monitorPerformance, 30000);

    // Initial performance check
    monitorPerformance();

    // Cleanup function
    return () => {
      console.log('🌐 WebErrorMonitor: Cleaning up web error monitoring...');
      
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
      
      // Restore original fetch
      window.fetch = originalFetch;
      
      clearInterval(performanceInterval);
      
      // Stop web diagnostics
      webDiagnostics.stopMonitoring();
    };
  }, [onError]);

  return null; // This component doesn't render anything
}

export default WebErrorMonitor;