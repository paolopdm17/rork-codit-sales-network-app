import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RecoveryState {
  crashCount: number;
  lastCrash: number;
  recoveryAttempts: number;
}

export class WebRecoveryManager {
  private static instance: WebRecoveryManager;
  private readonly CRASH_THRESHOLD = 3; // Max crashes before drastic measures
  private readonly RECOVERY_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'web_recovery_state';

  static getInstance(): WebRecoveryManager {
    if (!WebRecoveryManager.instance) {
      WebRecoveryManager.instance = new WebRecoveryManager();
    }
    return WebRecoveryManager.instance;
  }

  async handleCrash(error: Error, source: string): Promise<void> {
    if (Platform.OS !== 'web') return;

    console.error('🚨 WebRecoveryManager: Handling crash from', source, ':', error.message);

    try {
      const recoveryState = await this.getRecoveryState();
      const now = Date.now();

      // Reset crash count if enough time has passed
      if (now - recoveryState.lastCrash > this.RECOVERY_WINDOW) {
        recoveryState.crashCount = 0;
        recoveryState.recoveryAttempts = 0;
      }

      recoveryState.crashCount++;
      recoveryState.lastCrash = now;

      await this.saveRecoveryState(recoveryState);

      console.log('📊 WebRecoveryManager: Crash statistics:', {
        crashCount: recoveryState.crashCount,
        recoveryAttempts: recoveryState.recoveryAttempts,
        threshold: this.CRASH_THRESHOLD
      });

      // Determine recovery strategy based on crash frequency
      if (recoveryState.crashCount >= this.CRASH_THRESHOLD) {
        await this.performDrasticRecovery(recoveryState);
      } else {
        await this.performGentleRecovery(recoveryState);
      }
    } catch (recoveryError) {
      console.error('❌ WebRecoveryManager: Error during crash recovery:', recoveryError);
      // Last resort: reload the page
      this.reloadPage('Recovery system failed');
    }
  }

  private async performGentleRecovery(state: RecoveryState): Promise<void> {
    console.log('🔧 WebRecoveryManager: Performing gentle recovery...');

    try {
      // Clear potentially corrupted data
      await this.clearCorruptedData();

      // Clear browser caches if possible
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('✅ WebRecoveryManager: Browser caches cleared');
        } catch (cacheError) {
          console.warn('⚠️ WebRecoveryManager: Failed to clear caches:', cacheError);
        }
      }

      state.recoveryAttempts++;
      await this.saveRecoveryState(state);

      console.log('✅ WebRecoveryManager: Gentle recovery completed');
    } catch (error) {
      console.error('❌ WebRecoveryManager: Gentle recovery failed:', error);
      throw error;
    }
  }

  private async performDrasticRecovery(state: RecoveryState): Promise<void> {
    console.log('🚨 WebRecoveryManager: Performing drastic recovery due to repeated crashes...');

    try {
      // Clear all application data
      await this.clearAllApplicationData();

      // Clear all browser storage
      await this.clearAllBrowserStorage();

      // Reset recovery state
      await AsyncStorage.removeItem(this.STORAGE_KEY);

      console.log('✅ WebRecoveryManager: Drastic recovery completed');

      // Show user notification before reload
      this.showRecoveryNotification('L\'app è stata ripristinata a causa di errori ripetuti. La pagina verrà ricaricata.');

      // Reload after a short delay
      setTimeout(() => {
        this.reloadPage('Drastic recovery completed');
      }, 3000);
    } catch (error) {
      console.error('❌ WebRecoveryManager: Drastic recovery failed:', error);
      this.reloadPage('Drastic recovery failed');
    }
  }

  private async clearCorruptedData(): Promise<void> {
    console.log('🧹 WebRecoveryManager: Clearing potentially corrupted data...');

    const keysToRemove = [
      'user',
      'users',
      'contracts',
      'pendingUsers',
      'clients',
      'consultants',
      'deals'
    ];

    try {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ WebRecoveryManager: Corrupted data cleared');
    } catch (error) {
      console.error('❌ WebRecoveryManager: Failed to clear corrupted data:', error);
      throw error;
    }
  }

  private async clearAllApplicationData(): Promise<void> {
    console.log('🧹 WebRecoveryManager: Clearing all application data...');

    try {
      await AsyncStorage.clear();
      console.log('✅ WebRecoveryManager: All AsyncStorage data cleared');
    } catch (error) {
      console.error('❌ WebRecoveryManager: Failed to clear AsyncStorage:', error);
    }
  }

  private async clearAllBrowserStorage(): Promise<void> {
    console.log('🧹 WebRecoveryManager: Clearing all browser storage...');

    try {
      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
        console.log('✅ WebRecoveryManager: localStorage cleared');
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
        console.log('✅ WebRecoveryManager: sessionStorage cleared');
      }

      // Clear IndexedDB databases
      if ('indexedDB' in window) {
        try {
          // This is a simplified approach - in production you might want to be more specific
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve();
            })
          );
          console.log('✅ WebRecoveryManager: IndexedDB databases cleared');
        } catch (idbError) {
          console.warn('⚠️ WebRecoveryManager: Failed to clear IndexedDB:', idbError);
        }
      }
    } catch (error) {
      console.error('❌ WebRecoveryManager: Failed to clear browser storage:', error);
    }
  }

  private showRecoveryNotification(message: string): void {
    if (typeof window === 'undefined') return;

    // Create a simple notification overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 18px;
      text-align: center;
      padding: 20px;
    `;

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      background: white;
      color: black;
      padding: 30px;
      border-radius: 10px;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    messageDiv.textContent = message;

    overlay.appendChild(messageDiv);
    document.body.appendChild(overlay);

    // Remove after 2.5 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 2500);
  }

  private reloadPage(reason: string): void {
    console.log('🔄 WebRecoveryManager: Reloading page -', reason);
    
    if (typeof window !== 'undefined') {
      // Force a hard reload to clear any cached resources
      window.location.reload();
    }
  }

  private async getRecoveryState(): Promise<RecoveryState> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('⚠️ WebRecoveryManager: Failed to load recovery state:', error);
    }

    return {
      crashCount: 0,
      lastCrash: 0,
      recoveryAttempts: 0
    };
  }

  private async saveRecoveryState(state: RecoveryState): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('❌ WebRecoveryManager: Failed to save recovery state:', error);
    }
  }

  // Method to check if the app is in a recovery state
  async isInRecoveryMode(): Promise<boolean> {
    const state = await this.getRecoveryState();
    const now = Date.now();
    
    return state.crashCount > 0 && (now - state.lastCrash) < this.RECOVERY_WINDOW;
  }

  // Method to reset recovery state (call when app is stable)
  async resetRecoveryState(): Promise<void> {
    console.log('✅ WebRecoveryManager: Resetting recovery state - app is stable');
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}

export const webRecoveryManager = WebRecoveryManager.getInstance();
export default webRecoveryManager;