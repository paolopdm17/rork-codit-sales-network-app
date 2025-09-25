import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router, Stack } from "expo-router";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { CareerLevel } from "@/types";
import { CAREER_LEVELS } from "@/constants/levels";
import { ChevronDown, UserPlus, X } from "lucide-react-native";

interface NewUser {
  name: string;
  email: string;
  level: CareerLevel;
  adminId?: string;
  leaderId?: string;
}

export default function AddUserScreen() {
  const { users, visibleUsers, addUser, refreshData, setCurrentUser } = useData();
  const { user } = useAuth();
  const [formData, setFormData] = useState<NewUser>({
    name: "",
    email: "",
    level: "junior",
  });

  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [showAdminPicker, setShowAdminPicker] = useState(false);
  const [showLeaderPicker, setShowLeaderPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use all users for admins and masters, visible users for commercials
  const availableUsers = (user?.role === "admin" || user?.role === "master") ? users : visibleUsers;
  const admins = availableUsers.filter(u => (u.role === "admin" || u.role === "master") && u.status === "approved");
  // For leaders, show all commercials regardless of level
  const leaders = users.filter(u => u.role === "commercial" && u.status === "approved");

  const selectedAdmin = formData.adminId ? admins.find(a => a.id === formData.adminId) : null;
  const selectedLeader = formData.leaderId ? leaders.find(l => l.id === formData.leaderId) : null;

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert("Errore", "Nome e email sono obbligatori");
      return;
    }

    if (!formData.email.includes("@")) {
      Alert.alert("Errore", "Inserisci un'email valida");
      return;
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    if (existingUser) {
      Alert.alert("Errore", "Un utente con questa email esiste già");
      return;
    }

    // Admin di riferimento is only required if no leader is selected
    if (!formData.leaderId && !formData.adminId) {
      Alert.alert("Errore", "Seleziona un Admin di riferimento o un Commerciale leader");
      return;
    }

    setIsSubmitting(true);

    try {
      // All users created through this form are commercial users
      const finalFormData = { ...formData, role: "commercial" as const };
      
      console.log('Adding user with data:', finalFormData);
      console.log('Current user before addition:', user ? { id: user.id, name: user.name, role: user.role } : 'No user');
      
      // Set current user in data context to ensure proper filtering
      if (user) {
        setCurrentUser(user);
      }
      
      const createdUser = await addUser(finalFormData);
      
      console.log('User added successfully:', createdUser);
      console.log('Refreshing data to ensure all dashboards are updated...');
      
      // Force refresh data to ensure all dashboards are updated
      await refreshData(user);
      
      console.log('Data refreshed after user addition');
      
      Alert.alert(
        "Successo", 
        `Commerciale ${createdUser.name} aggiunto con successo`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error adding user:", error);
      Alert.alert("Errore", "Errore durante l'aggiunta del commerciale");
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
          title: "Aggiungi Commerciale",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X color="#64748B" size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Inserisci il nome completo"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text.toLowerCase() }))}
            placeholder="email@codit.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>



        {/* Level Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Livello di Carriera</Text>
          <TouchableOpacity 
            style={styles.picker}
            onPress={() => setShowLevelPicker(!showLevelPicker)}
          >
            <Text style={styles.pickerText}>{CAREER_LEVELS[formData.level]}</Text>
            <ChevronDown color="#64748B" size={20} />
          </TouchableOpacity>
          
          {showLevelPicker && (
            <View style={styles.pickerOptions}>
              {Object.entries(CAREER_LEVELS).map(([key, value]) => (
                <TouchableOpacity 
                  key={key}
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, level: key as CareerLevel }));
                    setShowLevelPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Admin Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Admin di Riferimento {!formData.leaderId ? '*' : ''}</Text>
          <TouchableOpacity 
            style={styles.picker}
            onPress={() => setShowAdminPicker(!showAdminPicker)}
          >
            <Text style={[styles.pickerText, !selectedAdmin && styles.placeholderText]}>
              {selectedAdmin ? selectedAdmin.name : "Seleziona un admin"}
            </Text>
            <ChevronDown color="#64748B" size={20} />
          </TouchableOpacity>
          
          {showAdminPicker && (
            <View style={styles.pickerOptions}>
              {admins.map((admin) => (
                <TouchableOpacity 
                  key={admin.id}
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, adminId: admin.id }));
                    setShowAdminPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{admin.name}</Text>
                  <Text style={styles.pickerOptionSubtext}>{admin.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Leader Picker (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Commerciale Leader (Opzionale)</Text>
          <TouchableOpacity 
            style={styles.picker}
            onPress={() => setShowLeaderPicker(!showLeaderPicker)}
          >
            <Text style={[styles.pickerText, !selectedLeader && styles.placeholderText]}>
              {selectedLeader ? selectedLeader.name : "Nessun leader (team indipendente)"}
            </Text>
            <ChevronDown color="#64748B" size={20} />
          </TouchableOpacity>
          
          {showLeaderPicker && (
            <View style={styles.pickerOptions}>
              <TouchableOpacity 
                style={styles.pickerOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, leaderId: undefined }));
                  setShowLeaderPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>Nessun leader</Text>
                <Text style={styles.pickerOptionSubtext}>Team indipendente</Text>
              </TouchableOpacity>
              {leaders.map((leader) => (
                <TouchableOpacity 
                  key={leader.id}
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, leaderId: leader.id }));
                    setShowLeaderPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{leader.name}</Text>
                  <Text style={styles.pickerOptionSubtext}>
                    {CAREER_LEVELS[leader.level]} • {leader.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <UserPlus color="#fff" size={20} />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Aggiungendo..." : "Aggiungi Commerciale"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1E293B",
  },
  picker: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 16,
    color: "#1E293B",
  },
  placeholderText: {
    color: "#94A3B8",
  },
  pickerOptions: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  pickerOptionSubtext: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});