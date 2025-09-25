import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/auth-context";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Errore", "Inserisci email e password");
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login for:', email);
      await login(email, password);
      console.log('Login successful, redirecting to tabs');
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Credenziali non valide';
      Alert.alert("Errore di Login", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1e40af", "#2563eb", "#06b6d4"]}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoBackground}>
                  <Image
                    source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/j4dmqzvdor5hou36expy3' }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.welcomeTitle}>Benvenuto</Text>
                <Text style={styles.welcomeSubtitle}>Accedi al tuo account per continuare</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Mail color="#64748b" size={20} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Lock color="#64748b" size={20} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff color="#64748b" size={20} />
                    ) : (
                      <Eye color="#64748b" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#1e40af", "#06b6d4"]}
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.loadingText}>Accesso in corso...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>Accedi</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.registerSection}>
                <Text style={styles.registerText}>Non hai un account? </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.registerLink}>Registrati</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {/* Demo Accounts */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Account Demo</Text>
              <View style={styles.demoAccounts}>
                <View style={styles.demoAccount}>
                  <View style={[styles.demoIndicator, { backgroundColor: '#8b5cf6' }]} />
                  <Text style={styles.demoAccountText}>master@codit.com - Master</Text>
                </View>
                <View style={styles.demoAccount}>
                  <View style={[styles.demoIndicator, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.demoAccountText}>admin@codit.com - Amministratore</Text>
                </View>
                <View style={styles.demoAccount}>
                  <View style={[styles.demoIndicator, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.demoAccountText}>leader@codit.com - Team Leader</Text>
                </View>
                <View style={styles.demoAccount}>
                  <View style={[styles.demoIndicator, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.demoAccountText}>senior@codit.com - Commerciale Senior</Text>
                </View>
              </View>
              <Text style={styles.demoNote}>Usa qualsiasi password per accedere</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBackground: {
    width: 160,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    paddingHorizontal: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  companyName: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  formHeader: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400' as const,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    height: 56,
  },
  inputIconContainer: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500' as const,
    paddingRight: 16,
  },
  passwordToggle: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500' as const,
    marginLeft: 12,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400' as const,
  },
  registerLink: {
    fontSize: 16,
    color: '#06b6d4',
    fontWeight: '600' as const,
  },
  demoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginTop: 32,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.1)',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  demoAccounts: {
    marginBottom: 16,
  },
  demoAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  demoAccountText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500' as const,
    flex: 1,
  },
  demoNote: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});