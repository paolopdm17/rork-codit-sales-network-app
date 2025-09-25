import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { DataProvider, useData } from "@/hooks/data-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const rootLayoutStyles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
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

  useEffect(() => {
    console.log('UserSyncWrapper: Syncing user with data context:', user?.name || 'No user');
    console.log('UserSyncWrapper: Auth loading:', authLoading);
    
    // Wait for auth to finish loading before initializing
    if (!authLoading) {
      const timeoutId = setTimeout(() => {
        setCurrentUser(user);
        setIsInitialized(true);
        console.log('UserSyncWrapper: Initialization complete');
      }, 100); // Small delay to ensure everything is ready
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, setCurrentUser, authLoading]);

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

  useEffect(() => {
    async function prepare() {
      try {
        console.log('RootLayout: Starting app initialization');
        
        // Keep splash screen visible while we prepare
        await SplashScreen.preventAutoHideAsync();
        
        // Small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('RootLayout: App initialization complete');
        setIsAppReady(true);
      } catch (e) {
        console.error('RootLayout: Error during initialization:', e);
        setIsAppReady(true); // Still show the app even if there's an error
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

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

  return (
    <ErrorBoundary onReset={handleErrorReset}>
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