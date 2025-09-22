import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router, Stack } from "expo-router";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { UserPlus, Mail, User, Shield } from "lucide-react-native";

export default function AddAdminScreen() {
  const { addUser } = useData();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert("Errore", "Tutti i campi sono obbligatori");
      return;
    }

    if (!formData.email.includes("@")) {
      Alert.alert("Errore", "Inserisci un indirizzo email valido");
      return;
    }

    setIsSubmitting(true);

    try {
      await addUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: "admin", // Always admin
        level: "managing_director", // Always managing director for admins
        adminId: user?.id,
      });

      Alert.alert(
        "Successo",
        `Amministratore "${formData.name}" aggiunto con successo!\n\nCredenziali di accesso:\nEmail: ${formData.email.trim().toLowerCase()}\nPassword: password123\n\nL'amministratore avrà accesso completo a tutte le funzionalità del sistema.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Errore",
        error instanceof Error ? error.message : "Errore durante l'aggiunta dell'amministratore"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen 
        options={{
          title: "Aggiungi Amministratore",
          headerStyle: {
            backgroundColor: "#1E40AF",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield color="#1E40AF" size={32} />
          </View>
          <Text style={styles.title}>Nuovo Amministratore</Text>
          <Text style={styles.subtitle}>
            Aggiungi un nuovo amministratore con accesso completo al sistema
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputContainer}>
              <User color="#64748B" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Es. Paolo Di Micco"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                testID="name-input"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail color="#64748B" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Es. paolo.dimicco@codit.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>
          </View>

          <View style={styles.privilegesCard}>
            <Text style={styles.privilegesTitle}>Privilegi Amministratore</Text>
            <View style={styles.privilegesList}>
              <Text style={styles.privilegeItem}>• Accesso completo a tutti i dati</Text>
              <Text style={styles.privilegeItem}>• Gestione utenti e contratti</Text>
              <Text style={styles.privilegeItem}>• Approvazione nuovi commerciali</Text>
              <Text style={styles.privilegeItem}>• Visualizzazione metriche globali</Text>
              <Text style={styles.privilegeItem}>• Livello: Managing Director</Text>
            </View>
          </View>

          <View style={styles.credentialsCard}>
            <Text style={styles.credentialsTitle}>Credenziali di Accesso</Text>
            <Text style={styles.credentialsText}>
              L'amministratore potrà accedere con:
            </Text>
            <Text style={styles.credentialsDetail}>Email: {formData.email || "[email inserita]"}</Text>
            <Text style={styles.credentialsDetail}>Password: password123</Text>
            <Text style={styles.credentialsNote}>
              Le credenziali verranno mostrate dopo la creazione
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          testID="submit-button"
        >
          <UserPlus color="#fff" size={20} />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Aggiungendo..." : "Aggiungi Amministratore"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    paddingVertical: 4,
  },
  privilegesCard: {
    backgroundColor: "#F0F9FF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  privilegesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0C4A6E",
    marginBottom: 12,
  },
  privilegesList: {
    gap: 8,
  },
  privilegeItem: {
    fontSize: 14,
    color: "#0369A1",
    lineHeight: 20,
  },
  credentialsCard: {
    backgroundColor: "#FEF3C7",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  credentialsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 12,
  },
  credentialsText: {
    fontSize: 14,
    color: "#A16207",
    marginBottom: 8,
  },
  credentialsDetail: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
    marginBottom: 4,
  },
  credentialsNote: {
    fontSize: 12,
    color: "#A16207",
    fontStyle: "italic",
    marginTop: 8,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: "#1E40AF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});