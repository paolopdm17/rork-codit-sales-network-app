import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { useState } from "react";
import { router } from "expo-router";
import { Plus, FileText, Calendar, Euro, Clock, Edit2, Trash2, TrendingUp, DollarSign, Target } from "lucide-react-native";

export default function ContractsScreen() {
  const { visibleContracts, visibleUsers, refreshData, deleteContract } = useData();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "admin";
  const isMaster = user?.role === "master";
  const isAdminOrMaster = isAdmin || isMaster;

  console.log('🔒 ContractsScreen access check:', {
    userName: user?.name,
    userRole: user?.role,
    isMaster,
    isAdminOrMaster,
    shouldHaveAccess: isMaster
  });

  // Protezione aggiuntiva: solo i master possono accedere a questa pagina
  // Su web, mostriamo un messaggio più user-friendly invece di bloccare completamente
  if (!user || user.role !== 'master') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#EF4444', textAlign: 'center', marginHorizontal: 20 }}>
          ⚠️ Accesso Limitato
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginHorizontal: 20, marginTop: 8 }}>
          Solo i Master possono accedere alla gestione contratti.
        </Text>
        <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginHorizontal: 20, marginTop: 16 }}>
          Ruolo attuale: {user?.role || 'Non definito'}
        </Text>
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData(user);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("it-IT");
  };

  const getUserName = (userId: string) => {
    const user = visibleUsers.find((u) => u.id === userId);
    return user?.name || "Utente sconosciuto";
  };

  const handleDeleteContract = (contractId: string, contractName: string) => {
    Alert.alert(
      "Elimina Contratto",
      `Sei sicuro di voler eliminare il contratto "${contractName}"?\n\nQuesta azione non può essere annullata.`,
      [
        {
          text: "Annulla",
          style: "cancel",
        },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContract(contractId);
              Alert.alert("Successo", "Contratto eliminato con successo");
            } catch (error) {
              Alert.alert(
                "Errore",
                error instanceof Error ? error.message : "Errore durante l'eliminazione del contratto"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          {/* Margine Totale - Prima riga */}
          <View style={styles.topStatsRow}>
            <View style={[styles.statCard, styles.totalMarginCard, styles.fullWidthCard]}>
              <View style={styles.statIconContainer}>
                <DollarSign color="#fff" size={24} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {formatCurrency(
                    visibleContracts.reduce((sum, c) => sum + c.grossMargin, 0)
                  )}
                </Text>
                <Text style={styles.statLabel}>Margine Totale</Text>
              </View>
            </View>
          </View>
          
          {/* Contratti Attivi e Margine Mensile - Seconda riga */}
          <View style={styles.bottomStatsRow}>
            <View style={[styles.statCard, styles.activeContractsCard]}>
              <View style={styles.statIconContainer}>
                <Target color="#fff" size={24} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{visibleContracts.length}</Text>
                <Text style={styles.statLabel}>Contratti Attivi</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.monthlyMarginCard]}>
              <View style={styles.statIconContainer}>
                <TrendingUp color="#fff" size={24} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {formatCurrency(
                    visibleContracts.reduce((sum, c) => sum + (c.monthlyMargin || c.grossMargin), 0)
                  )}
                </Text>
                <Text style={styles.statLabel}>Margine Mensile</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contractsList}>
          {visibleContracts.map((contract) => (
            <View key={contract.id} style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <FileText color="#1E40AF" size={20} />
                <View style={styles.contractTitleContainer}>
                  <Text style={styles.contractName}>{contract.name || `Contratto #${contract.id}`}</Text>
                  <Text style={styles.contractId}>#{contract.id}</Text>
                </View>
                <View style={styles.contractActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push(`/edit-contract?contractId=${contract.id}`)}
                  >
                    <Edit2 color="#64748B" size={18} />
                  </TouchableOpacity>
                  {isAdminOrMaster && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteContract(contract.id, contract.name || `Contratto #${contract.id}`)}
                    >
                      <Trash2 color="#EF4444" size={18} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={styles.contractDetails}>
                <View style={styles.detailRow}>
                  <Calendar color="#64748B" size={16} />
                  <Text style={styles.detailText}>
                    {formatDate(contract.date)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Clock color="#64748B" size={16} />
                  <Text style={styles.detailText}>
                    {contract.duration || 1} {contract.duration === 1 ? 'mese' : 'mesi'}
                  </Text>
                </View>
              </View>

              <View style={styles.marginInfo}>
                <View style={styles.marginRow}>
                  <Text style={styles.marginLabel}>Margine Totale:</Text>
                  <Text style={styles.marginValue}>
                    {formatCurrency(contract.grossMargin)}
                  </Text>
                </View>
                <View style={styles.marginRow}>
                  <Text style={styles.marginLabel}>Margine Mensile:</Text>
                  <Text style={styles.marginValueHighlight}>
                    {formatCurrency(contract.monthlyMargin || (contract.grossMargin / (contract.duration || 1)))}
                  </Text>
                </View>
              </View>

              <View style={styles.contractPeople}>
                <Text style={styles.personLabel}>Sviluppatore:</Text>
                <Text style={styles.personName}>
                  {getUserName(contract.developerId)}
                </Text>
              </View>

              {contract.recruiterId && (
                <View style={styles.contractPeople}>
                  <Text style={styles.personLabel}>Reclutatore:</Text>
                  <Text style={styles.personName}>
                    {getUserName(contract.recruiterId)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/contract-form")}
      >
        <Plus color="#fff" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  topStatsRow: {
    marginBottom: 12,
  },
  bottomStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  fullWidthCard: {
    width: "100%",
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
    justifyContent: "space-between",
  },
  activeContractsCard: {
    backgroundColor: "#3B82F6",
  },
  monthlyMarginCard: {
    backgroundColor: "#10B981",
  },
  totalMarginCard: {
    backgroundColor: "#8B5CF6",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  contractsList: {
    padding: 16,
  },
  contractCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contractHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contractTitleContainer: {
    marginLeft: 8,
    flex: 1,
  },
  contractActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  contractName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  contractId: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  contractDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#64748B",
  },
  contractPeople: {
    flexDirection: "row",
    marginTop: 8,
  },
  personLabel: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 8,
  },
  personName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  marginInfo: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  marginRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  marginLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  marginValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1E293B",
  },
  marginValueHighlight: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E40AF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});