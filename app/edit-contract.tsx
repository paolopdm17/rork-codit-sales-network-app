import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Euro, Users, Clock, FileText } from "lucide-react-native";

export default function EditContractScreen() {
  const { contractId } = useLocalSearchParams();
  const { user } = useAuth();
  const { visibleUsers, visibleContracts, updateContract, refreshData } = useData();
  
  const contract = visibleContracts.find(c => c.id === contractId);
  
  const [contractName, setContractName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [grossMargin, setGrossMargin] = useState("");
  const [duration, setDuration] = useState("");
  const [developerId, setDeveloperId] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contract) {
      setContractName(contract.name || "");
      setDate(new Date(contract.date));
      setGrossMargin(contract.grossMargin.toString());
      setDuration((contract.duration || 1).toString());
      setDeveloperId(contract.developerId);
      setRecruiterId(contract.recruiterId || "");
    }
  }, [contract]);

  if (!contract) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Contratto non trovato</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Torna indietro</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const availableUsers = visibleUsers.filter(
    (u) => u.status === "approved"
  );

  const handleSubmit = async () => {
    if (!contractName || !grossMargin || !duration || !developerId) {
      Alert.alert("Errore", "Compila tutti i campi obbligatori");
      return;
    }

    const margin = parseFloat(grossMargin);
    const months = parseInt(duration);
    
    if (isNaN(margin) || margin <= 0) {
      Alert.alert("Errore", "Inserisci un margine lordo valido");
      return;
    }
    
    if (isNaN(months) || months <= 0) {
      Alert.alert("Errore", "Inserisci una durata valida in mesi");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const monthlyMargin = margin / months;
      
      await updateContract(contract.id, {
        ...contract,
        name: contractName,
        date,
        grossMargin: margin,
        monthlyMargin,
        duration: months,
        developerId,
        recruiterId: recruiterId || undefined,
      });

      await refreshData(user);

      Alert.alert("Successo", "Contratto modificato con successo", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating contract:', error);
      Alert.alert("Errore", "Si è verificato un errore durante la modifica del contratto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <FileText color="#64748B" size={20} />
            <Text style={styles.label}>Nome Contratto *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Es: Contratto Sviluppo App Mobile"
            placeholderTextColor="#94A3B8"
            value={contractName}
            onChangeText={setContractName}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Calendar color="#64748B" size={20} />
            <Text style={styles.label}>Data Contratto</Text>
          </View>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{date.toLocaleDateString("it-IT")}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Euro color="#64748B" size={20} />
            <Text style={styles.label}>Margine Lordo Totale (€) *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Es: 25000"
            placeholderTextColor="#94A3B8"
            value={grossMargin}
            onChangeText={setGrossMargin}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Clock color="#64748B" size={20} />
            <Text style={styles.label}>Durata Contratto (mesi) *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Es: 12"
            placeholderTextColor="#94A3B8"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
          {duration && grossMargin && (
            <View style={styles.calculationInfo}>
              <Text style={styles.calculationText}>
                Margine mensile: €{(parseFloat(grossMargin) / parseInt(duration) || 0).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Users color="#64748B" size={20} />
            <Text style={styles.label}>Sviluppatore *</Text>
          </View>
          <View style={styles.selectContainer}>
            {availableUsers.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[
                  styles.selectOption,
                  developerId === u.id && styles.selectOptionActive,
                ]}
                onPress={() => setDeveloperId(u.id)}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    developerId === u.id && styles.selectOptionTextActive,
                  ]}
                >
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Users color="#64748B" size={20} />
            <Text style={styles.label}>Reclutatore (Opzionale)</Text>
          </View>
          <View style={styles.selectContainer}>
            <TouchableOpacity
              style={[
                styles.selectOption,
                !recruiterId && styles.selectOptionActive,
              ]}
              onPress={() => setRecruiterId("")}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  !recruiterId && styles.selectOptionTextActive,
                ]}
              >
                Nessuno
              </Text>
            </TouchableOpacity>
            {availableUsers
              .filter((u) => u.id !== developerId)
              .map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.selectOption,
                    recruiterId === u.id && styles.selectOptionActive,
                  ]}
                  onPress={() => setRecruiterId(u.id)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      recruiterId === u.id && styles.selectOptionTextActive,
                    ]}
                  >
                    {u.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Salva Modifiche</Text>
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
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginBottom: 20,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#1E40AF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  dateInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#1E293B",
  },
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectOption: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectOptionActive: {
    backgroundColor: "#1E40AF",
    borderColor: "#1E40AF",
  },
  selectOptionText: {
    fontSize: 14,
    color: "#64748B",
  },
  selectOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: "#1E40AF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  calculationInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
  },
  calculationText: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});