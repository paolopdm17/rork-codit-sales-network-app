import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { DataProvider, useData } from "@/hooks/data-context";
import WebErrorMonitor from "@/components/WebErrorMonitor";

// Only prevent auto hide on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

const rootLayoutStyles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
    // Web-specific fixes
    ...(Platform.OS === 'web' && {
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }),
  },
});

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 ERROR BOUNDARY CAUGHT ERROR:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Log additional context for debugging
    console.error('Platform:', Platform.OS);
    console.error('User Agent:', Platform.OS === 'web' ? navigator.userAgent : 'N/A');
    console.error('Timestamp:', new Date().toISOString());
    
    // Check for common error patterns that cause web crashes
    const errorMessage = error.message.toLowerCase();
    const isJSONError = errorMessage.includes('json') || 
                       errorMessage.includes('parse') || 
                       errorMessage.includes('unexpected') ||
                       errorMessage.includes('syntaxerror') ||
                       errorMessage.includes('unexpected token');
    
    const isWebSpecificError = errorMessage.includes('indexeddb') ||
                              errorMessage.includes('localstorage') ||
                              errorMessage.includes('websocket') ||
                              errorMessage.includes('fetch') ||
                              errorMessage.includes('network');
    
    const isReactError = errorMessage.includes('react') ||
                        errorMessage.includes('hook') ||
                        errorMessage.includes('render') ||
                        errorMessage.includes('component');
    
    console.error('Error classification:', {
      isJSONError,
      isWebSpecificError,
      isReactError,
      platform: Platform.OS
    });
    
    // Auto-clear corrupted data for JSON errors
    if (isJSONError) {
      console.error('🚨 JSON Parse Error detected - clearing corrupted data');
      setTimeout(async () => {
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.default.multiRemove(['user', 'users', 'contracts', 'pendingUsers', 'clients', 'consultants', 'deals']);
          console.log('✅ All corrupted data cleared from Error Boundary');
        } catch (clearError) {
          console.error('❌ Error clearing data from Error Boundary:', clearError);
        }
      }, 100);
    }
    
    // For web-specific errors, try to recover gracefully
    if (Platform.OS === 'web' && isWebSpecificError) {
      console.error('🌐 Web-specific error detected - attempting recovery');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log('Attempting to reload page for recovery...');
          window.location.reload();
        }
      }, 2000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <View style={errorStyles.content}>
            <Text style={errorStyles.title}>Errore dell&apos;App</Text>
            <Text style={errorStyles.message}>
              Si &egrave; verificato un errore imprevisto. Questo potrebbe essere dovuto a dati corrotti.
            </Text>
            <Text style={errorStyles.errorDetails}>
              {this.state.error?.message || 'Errore sconosciuto'}
            </Text>
            <TouchableOpacity 
              style={errorStyles.button}
              onPress={() => {
                this.setState({ hasError: false, error: undefined });
                this.props.onReset?.();
              }}
            >
              <Text style={errorStyles.buttonText}>Riprova</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[errorStyles.button, errorStyles.clearButton]}
              onPress={() => {
                // Clear all data and restart
                import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
                  AsyncStorage.multiRemove(['user', 'users', 'contracts', 'pendingUsers']).then(() => {
                    this.setState({ hasError: false, error: undefined });
                    this.props.onReset?.();
                  });
                });
              }}
            >
              <Text style={errorStyles.buttonText}>Ripristina Dati</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 150,
  },
  clearButton: {
    backgroundColor: '#ff9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const initStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

// Component to sync auth user with data context and handle initialization
function UserSyncWrapper({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { setCurrentUser } = useData();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeUser = async () => {
      try {
        console.log('UserSyncWrapper: Starting initialization...');
        console.log('UserSyncWrapper: User:', user?.name || 'No user');
        console.log('UserSyncWrapper: Auth loading:', authLoading);
        console.log('UserSyncWrapper: Platform:', Platform.OS);
        
        // Wait for auth to finish loading before initializing
        if (!authLoading && isMounted) {
          // Add extra safety delay on web to prevent race conditions
          const delay = Platform.OS === 'web' ? 200 : 100;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (isMounted) {
            console.log('UserSyncWrapper: Setting current user...');
            setCurrentUser(user);
            setIsInitialized(true);
            setError(null);
            console.log('UserSyncWrapper: Initialization complete successfully');
          }
        }
      } catch (initError) {
        console.error('UserSyncWrapper: Error during initialization:', initError);
        if (isMounted) {
          setError(initError instanceof Error ? initError.message : 'Initialization failed');
          setIsInitialized(true); // Still show the app even if there's an error
        }
      }
    };
    
    initializeUser();
    
    return () => {
      isMounted = false;
    };
  }, [user, setCurrentUser, authLoading]);
  
  // Show error state if initialization failed
  if (error) {
    console.error('UserSyncWrapper: Showing error state:', error);
  }

  // Show loading screen while initializing
  if (!isInitialized || authLoading) {
    return (
      <View style={initStyles.container}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={initStyles.text}>Caricamento...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Indietro" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="contract-form" 
        options={{ 
          title: "Nuovo Contratto",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="user-approval" 
        options={{ 
          title: "Approva Utente",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="edit-user" 
        options={{ 
          title: "Modifica Utente",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="add-user" 
        options={{ 
          title: "Aggiungi Commerciale",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="edit-contract" 
        options={{ 
          title: "Modifica Contratto",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="add-admin" 
        options={{ 
          title: "Aggiungi Admin",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="add-client" 
        options={{ 
          title: "Aggiungi Cliente",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="edit-client" 
        options={{ 
          title: "Modifica Cliente",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="add-consultant" 
        options={{ 
          title: "Aggiungi Consulente",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="edit-consultant" 
        options={{ 
          title: "Modifica Consulente",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="add-deal" 
        options={{ 
          title: "Aggiungi Affare",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="edit-deal" 
        options={{ 
          title: "Modifica Affare",
          presentation: "modal" 
        }} 
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function prepare() {
      try {
        console.log('🚀 RootLayout: Starting app initialization');
        console.log('Platform:', Platform.OS);
        console.log('User Agent:', Platform.OS === 'web' ? navigator.userAgent : 'N/A');
        
        // Add web-specific initialization checks
        if (Platform.OS === 'web') {
          console.log('Web platform detected - performing web-specific checks...');
          
          // Check if required web APIs are available
          if (typeof window === 'undefined') {
            throw new Error('Window object not available');
          }
          
          if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available - some features may not work');
          }
          
          // Check for AsyncStorage compatibility
          try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            await AsyncStorage.default.getItem('test-key');
            console.log('✅ AsyncStorage is working on web');
          } catch (storageError) {
            console.warn('⚠️ AsyncStorage test failed:', storageError);
          }
        }
        
        // Shorter delay on web for better performance
        const delay = Platform.OS === 'web' ? 50 : 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (isMounted) {
          console.log('✅ RootLayout: App initialization complete');
          setIsAppReady(true);
          setInitError(null);
        }
      } catch (e) {
        console.error('❌ RootLayout: Error during initialization:', e);
        if (isMounted) {
          setInitError(e instanceof Error ? e.message : 'Unknown initialization error');
          setIsAppReady(true); // Still show the app even if there's an error
        }
      } finally {
        // Only handle splash screen on native platforms
        if (Platform.OS !== 'web' && isMounted) {
          try {
            await SplashScreen.hideAsync();
            console.log('✅ Splash screen hidden');
          } catch (splashError) {
            console.warn('⚠️ Error hiding splash screen:', splashError);
          }
        }
      }
    }

    prepare();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Show initialization error if it occurred
  if (initError) {
    console.warn('RootLayout: Initialization error occurred but continuing:', initError);
  }

  const handleErrorReset = () => {
    console.log('Error boundary reset triggered');
    setIsAppReady(false);
    setTimeout(() => setIsAppReady(true), 100);
  };

  if (!isAppReady) {
    return (
      <View style={initStyles.container}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={initStyles.text}>Inizializzazione...</Text>
      </View>
    );
  }

  const handleWebError = (error: Error, source: string) => {
    console.error(`🌐 Web error from ${source}:`, error);
    
    // If it's a critical error, trigger error boundary
    if (source === 'global' || source === 'promise') {
      // Force error boundary to catch this
      setTimeout(() => {
        throw error;
      }, 0);
    }
  };

  return (
    <ErrorBoundary onReset={handleErrorReset}>
      <WebErrorMonitor onError={handleWebError} />
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={rootLayoutStyles.gestureHandler}>
          <AuthProvider>
            <DataProvider>
              <UserSyncWrapper>
                <RootLayoutNav />
              </UserSyncWrapper>
            </DataProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}