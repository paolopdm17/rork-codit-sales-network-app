import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { User, Users, UserCheck, UserX } from "lucide-react-native";

export default function UserApprovalScreen() {
  const { userId } = useLocalSearchParams();
  const { user: currentUser } = useAuth();
  const { users, visibleUsers, pendingUsers, approveUser, rejectUser } = useData();
  const [selectedLeader, setSelectedLeader] = useState("");

  const userToApprove = pendingUsers.find((u) => u.id === userId);
  // Use all users for admins and masters, visible users for commercials
  const availableUsers = (currentUser?.role === "admin" || currentUser?.role === "master") ? users : visibleUsers;
  const potentialLeaders = availableUsers.filter(
    (u) => u.role === "commercial" && u.status === "approved"
  );

  if (!userToApprove) {
    return (
      <View style={styles.container}>
        <Text>Utente non trovato</Text>
      </View>
    );
  }

  const handleApprove = async () => {
    if (!currentUser) return;

    await approveUser(
      userToApprove.id,
      currentUser.id,
      selectedLeader || undefined
    );

    Alert.alert("Successo", "Utente approvato con successo", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const handleReject = async () => {
    Alert.alert(
      "Conferma",
      "Sei sicuro di voler rifiutare questa registrazione?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rifiuta",
          style: "destructive",
          onPress: async () => {
            await rejectUser(userToApprove.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <User color="#fff" size={32} />
        </View>
        <Text style={styles.userName}>{userToApprove.name}</Text>
        <Text style={styles.userEmail}>{userToApprove.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users color="#64748B" size={20} />
          <Text style={styles.sectionTitle}>Assegna a un Team Leader</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Seleziona il commerciale leader a cui assegnare questo nuovo utente
          (opzionale)
        </Text>

        <View style={styles.selectContainer}>
          <TouchableOpacity
            style={[
              styles.selectOption,
              !selectedLeader && styles.selectOptionActive,
            ]}
            onPress={() => setSelectedLeader("")}
          >
            <Text
              style={[
                styles.selectOptionText,
                !selectedLeader && styles.selectOptionTextActive,
              ]}
            >
              Nessun leader (Team indipendente)
            </Text>
          </TouchableOpacity>

          {potentialLeaders.map((leader) => (
            <TouchableOpacity
              key={leader.id}
              style={[
                styles.selectOption,
                selectedLeader === leader.id && styles.selectOptionActive,
              ]}
              onPress={() => setSelectedLeader(leader.id)}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  selectedLeader === leader.id && styles.selectOptionTextActive,
                ]}
              >
                {leader.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={handleReject}
        >
          <UserX color="#fff" size={20} />
          <Text style={styles.buttonText}>Rifiuta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={handleApprove}
        >
          <UserCheck color="#fff" size={20} />
          <Text style={styles.buttonText}>Approva</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1E40AF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#64748B",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});