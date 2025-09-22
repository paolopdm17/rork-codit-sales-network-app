import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { ChevronDown } from "lucide-react-native";
import { CAREER_LEVELS } from "@/constants/levels";
import { CareerLevel } from "@/types";

export default function EditUserScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { users, visibleUsers, updateUser } = useData();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showLeaderPicker, setShowLeaderPicker] = useState(false);
  const [showAdminPicker, setShowAdminPicker] = useState(false);

  const userToEdit = users.find((u) => u.id === userId);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "commercial" as "admin" | "commercial" | "master",
    level: "junior" as CareerLevel,
    teamLeader: "",
    adminRef: "",
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        level: userToEdit.level,
        teamLeader: userToEdit.leaderId || "",
        adminRef: userToEdit.adminId || "",
      });
    }
  }, [userToEdit]);

  // Use all users for admins and masters, visible users for commercials
  const availableUsers = (currentUser?.role === "admin" || currentUser?.role === "master") ? users : visibleUsers;
  const admins = availableUsers.filter((u) => (u.role === "admin" || u.role === "master") && u.status === "approved");
  const leaders = availableUsers.filter(
    (u) => 
      u.role === "commercial" && 
      u.status === "approved" &&
      ["senior", "team_leader", "partner", "executive_director", "managing_director"].includes(u.level) &&
      u.id !== userId
  );

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert("Errore", "Nome ed email sono obbligatori");
      return;
    }

    // Admin di riferimento is only required if no team leader is selected
    if (formData.role === "commercial" && !formData.teamLeader && !formData.adminRef) {
      Alert.alert("Errore", "Seleziona un Admin di riferimento o un Team Leader");
      return;
    }

    // Master users don't need admin reference
    if (formData.role === "master" && formData.adminRef) {
      setFormData({ ...formData, adminRef: "", teamLeader: "" });
    }

    setLoading(true);
    try {
      await updateUser(userId!, {
        ...userToEdit!,
        ...formData,
        leaderId: formData.teamLeader || undefined,
        adminId: formData.adminRef || undefined,
        teamLeader: formData.teamLeader || undefined,
        adminRef: formData.adminRef || undefined,
      });
      Alert.alert("Successo", "Utente modificato con successo", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Errore", "Impossibile modificare l'utente");
    } finally {
      setLoading(false);
    }
  };

  if (!userToEdit) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Utente non trovato</Text>
      </View>
    );
  }

  if (currentUser?.role !== "admin" && currentUser?.role !== "master") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Non hai i permessi per modificare gli utenti</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informazioni Personali</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nome completo"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="email@esempio.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ruolo e Livello</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ruolo</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowRolePicker(!showRolePicker)}
            >
              <Text style={styles.pickerText}>
                {formData.role === "admin" ? "Amministratore" : formData.role === "master" ? "Master" : "Commerciale"}
              </Text>
              <ChevronDown size={20} color="#64748B" />
            </TouchableOpacity>
            {showRolePicker && (
              <View style={styles.pickerOptions}>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, role: "commercial" });
                    setShowRolePicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Commerciale</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, role: "admin" });
                    setShowRolePicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Amministratore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, role: "master" });
                    setShowRolePicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>Master</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {(formData.role === "commercial" || formData.role === "master") && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Livello</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowLevelPicker(!showLevelPicker)}
              >
                <Text style={styles.pickerText}>{CAREER_LEVELS[formData.level]}</Text>
                <ChevronDown size={20} color="#64748B" />
              </TouchableOpacity>
              {showLevelPicker && (
                <View style={styles.pickerOptions}>
                  {Object.entries(CAREER_LEVELS).map(([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.pickerOption}
                      onPress={() => {
                        setFormData({ ...formData, level: key as CareerLevel });
                        setShowLevelPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {(formData.role === "commercial" || formData.role === "master") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assegnazioni</Text>
            
            {formData.role === "commercial" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admin di Riferimento {!formData.teamLeader ? '*' : ''}</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowAdminPicker(!showAdminPicker)}
                >
                  <Text style={styles.pickerText}>
                    {formData.adminRef
                      ? admins.find((a) => a.id === formData.adminRef)?.name || "Seleziona"
                      : "Seleziona Admin"}
                  </Text>
                  <ChevronDown size={20} color="#64748B" />
                </TouchableOpacity>
                {showAdminPicker && (
                  <View style={styles.pickerOptions}>
                    {admins.map((admin) => (
                      <TouchableOpacity
                        key={admin.id}
                        style={styles.pickerOption}
                        onPress={() => {
                          setFormData({ ...formData, adminRef: admin.id });
                          setShowAdminPicker(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>{admin.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team Leader (Opzionale)</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowLeaderPicker(!showLeaderPicker)}
              >
                <Text style={styles.pickerText}>
                  {formData.teamLeader
                    ? leaders.find((l) => l.id === formData.teamLeader)?.name || "Nessuno"
                    : "Nessuno"}
                </Text>
                <ChevronDown size={20} color="#64748B" />
              </TouchableOpacity>
              {showLeaderPicker && (
                <View style={styles.pickerOptions}>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, teamLeader: "" });
                      setShowLeaderPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>Nessuno</Text>
                  </TouchableOpacity>
                  {leaders.map((leader) => (
                    <TouchableOpacity
                      key={leader.id}
                      style={styles.pickerOption}
                      onPress={() => {
                        setFormData({ ...formData, teamLeader: leader.id });
                        setShowLeaderPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>
                        {leader.name} ({CAREER_LEVELS[leader.level]})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salva Modifiche</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  picker: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 16,
    color: "#1E293B",
  },
  pickerOptions: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#1E293B",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 32,
  },
});