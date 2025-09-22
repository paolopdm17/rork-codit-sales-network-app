import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { DataProvider, useData } from "@/hooks/data-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
    console.error('Error Boundary - Component stack:', errorInfo.componentStack);
    console.error('Error Boundary - Error details:', error);
    
    // Check if it's a JSON parse error
    if (error.message.includes('JSON') || 
        error.message.includes('parse') || 
        error.message.includes('Unexpected') ||
        error.message.includes('SyntaxError') ||
        error.message.includes('Unexpected token') ||
        error.message.includes('Unexpected character')) {
      console.error('🚨 JSON Parse Error detected in Error Boundary:', error.message);
      
      // Auto-clear corrupted data
      setTimeout(async () => {
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.default.multiRemove(['user', 'users', 'contracts', 'pendingUsers']);
          console.log('✅ Corrupted data cleared from Error Boundary');
        } catch (clearError) {
          console.error('❌ Error clearing data from Error Boundary:', clearError);
        }
      }, 100);
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

function RootLayoutNav() {
  const { user } = useAuth();
  const { setCurrentUser, clearCorruptedData } = useData();

  useEffect(() => {
    setCurrentUser(user);
  }, [user, setCurrentUser]);

  // Add global error handler for JSON parse errors
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    const handleJSONError = (message: string) => {
      if (message.includes('JSON Parse error') || 
          message.includes('Unexpected character') ||
          message.includes('JSON.parse') ||
          message.includes('SyntaxError') ||
          message.includes('Unexpected token') ||
          message.includes('Unexpected end of JSON input')) {
        
        console.log('🚨 JSON Parse Error Detected:', message);
        
        // Auto-clear corrupted data without showing alert to avoid spam
        setTimeout(async () => {
          try {
            console.log('Auto-clearing corrupted data due to JSON parse error...');
            await clearCorruptedData();
            console.log('✅ Corrupted data cleared automatically');
          } catch (error) {
            console.log('❌ Error auto-clearing corrupted data:', error);
          }
        }, 100);
        
        return true; // Indicate that we handled this error
      }
      return false;
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (!handleJSONError(message)) {
        originalConsoleError(...args);
      }
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      if (!handleJSONError(message)) {
        originalConsoleWarn(...args);
      }
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [clearCorruptedData]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Indietro" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleErrorReset = () => {
    console.log('Error boundary reset triggered');
    // Force a re-render by updating the key
  };

  return (
    <ErrorBoundary onReset={handleErrorReset}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <AuthProvider>
            <DataProvider>
              <RootLayoutNav />
            </DataProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}