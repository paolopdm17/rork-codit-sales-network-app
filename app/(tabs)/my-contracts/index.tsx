import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/auth-context";
import { useData } from "@/hooks/data-context";
import { Contract } from "@/types";
import { User, FileText, Euro, TrendingUp, Award, Briefcase } from "lucide-react-native";

export default function MyContractsScreen() {
  const { user } = useAuth();
  const { visibleContracts, visibleUsers } = useData();

  // Categorize contracts based on user's role
  const categorizedContracts = useMemo(() => {
    if (!user) return { developer: [], recruiter: [], both: [] };

    const developer: Contract[] = [];
    const recruiter: Contract[] = [];
    const both: Contract[] = [];

    visibleContracts.forEach((contract) => {
      const isDeveloper = contract.developerId === user.id;
      const isRecruiter = contract.recruiterId === user.id;

      if (isDeveloper && isRecruiter) {
        both.push(contract);
      } else if (isDeveloper) {
        developer.push(contract);
      } else if (isRecruiter) {
        recruiter.push(contract);
      }
    });

    return { developer, recruiter, both };
  }, [visibleContracts, user]);

  const getUserName = (userId: string) => {
    const foundUser = visibleUsers.find((u) => u.id === userId);
    return foundUser?.name || "Utente non trovato";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getContractStatus = (contract: Contract) => {
    const now = new Date();
    const contractDate = new Date(contract.date);
    const endDate = new Date(contractDate);
    endDate.setMonth(endDate.getMonth() + (contract.duration || 1));

    if (now < contractDate) {
      return { status: "In attesa", color: "#F59E0B" };
    } else if (now > endDate) {
      return { status: "Completato", color: "#10B981" };
    } else {
      return { status: "Attivo", color: "#3B82F6" };
    }
  };

  const renderContractCard = (contract: Contract, roleType: string) => {
    const { status, color } = getContractStatus(contract);
    const isActive = status === "Attivo";
    const isCompleted = status === "Completato";

    return (
      <TouchableOpacity
        key={contract.id}
        style={[
          styles.contractCard,
          isActive && styles.activeContract,
          isCompleted && styles.completedContract
        ]}
        onPress={() => {
          Alert.alert(
            "Dettagli Contratto",
            `Nome: ${contract.name}\nData: ${formatDate(contract.date)}\nDurata: ${contract.duration} mesi\nMargine Mensile: ${formatCurrency(contract.monthlyMargin)}\nMargine Totale: ${formatCurrency(contract.grossMargin)}\nStato: ${status}`,
            [{ text: "OK" }]
          );
        }}
      >
        <View style={styles.contractHeader}>
          <View style={styles.contractTitleRow}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <FileText size={18} color={color} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.contractName}>{contract.name}</Text>
              <Text style={styles.contractSubtitle}>
                {formatDate(contract.date)} • {contract.duration} mesi
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={styles.contractDetails}>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconContainer}>
                <Euro size={14} color="#059669" />
              </View>
              <View>
                <Text style={styles.metricValue}>
                  {formatCurrency(contract.monthlyMargin)}
                </Text>
                <Text style={styles.metricLabel}>al mese</Text>
              </View>
            </View>
            
            <View style={styles.metricItem}>
              <View style={styles.metricIconContainer}>
                <TrendingUp size={14} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.metricValue}>
                  {formatCurrency(contract.grossMargin)}
                </Text>
                <Text style={styles.metricLabel}>totale</Text>
              </View>
            </View>
          </View>

          {roleType === "both" && (
            <View style={styles.roleInfo}>
              <Award size={14} color="#DC2626" />
              <Text style={styles.roleText}>
                Sviluppatore e Reclutatore
              </Text>
            </View>
          )}

          {(contract.recruiterId && contract.recruiterId !== user?.id) || 
           (contract.developerId !== user?.id) ? (
            <View style={styles.partnersContainer}>
              {contract.recruiterId && contract.recruiterId !== user?.id && (
                <View style={styles.partnerChip}>
                  <User size={12} color="#6366F1" />
                  <Text style={styles.partnerText}>
                    R: {getUserName(contract.recruiterId)}
                  </Text>
                </View>
              )}
              
              {contract.developerId !== user?.id && (
                <View style={styles.partnerChip}>
                  <Briefcase size={12} color="#059669" />
                  <Text style={styles.partnerText}>
                    S: {getUserName(contract.developerId)}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, contracts: Contract[], roleType: string) => {
    if (contracts.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>
          {contracts.length} contratto{contracts.length !== 1 ? "i" : ""}
        </Text>
        {contracts.map((contract) => renderContractCard(contract, roleType))}
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Errore: Utente non trovato</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalContracts = 
    categorizedContracts.developer.length + 
    categorizedContracts.recruiter.length + 
    categorizedContracts.both.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>I Tuoi Contratti</Text>
              <Text style={styles.summaryText}>
                {totalContracts} contratto{totalContracts !== 1 ? "i" : ""} totale{totalContracts !== 1 ? "i" : ""}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <FileText size={32} color="#6366F1" />
            </View>
          </View>
          
          {totalContracts > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {categorizedContracts.developer.length + categorizedContracts.both.length}
                </Text>
                <Text style={styles.statLabel}>Sviluppatore</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {categorizedContracts.recruiter.length + categorizedContracts.both.length}
                </Text>
                <Text style={styles.statLabel}>Reclutatore</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {categorizedContracts.both.length}
                </Text>
                <Text style={styles.statLabel}>Entrambi</Text>
              </View>
            </View>
          )}
        </View>

        {totalContracts === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <FileText size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Nessun contratto trovato</Text>
            <Text style={styles.emptySubtitle}>
              Non hai ancora contratti assegnati come sviluppatore o reclutatore.
            </Text>
            <View style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>
                I tuoi contratti appariranno qui una volta assegnati
              </Text>
            </View>
          </View>
        ) : (
          <>
            {renderSection(
              "Sviluppatore e Reclutatore",
              categorizedContracts.both,
              "both"
            )}
            {renderSection(
              "Solo Sviluppatore",
              categorizedContracts.developer,
              "developer"
            )}
            {renderSection(
              "Solo Reclutatore",
              categorizedContracts.recruiter,
              "recruiter"
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerIcon: {
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6366F1",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
    fontWeight: "500",
  },
  contractCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activeContract: {
    borderColor: "#3B82F6",
    borderWidth: 2,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.15,
  },
  completedContract: {
    borderColor: "#10B981",
    borderWidth: 2,
    shadowColor: "#10B981",
    shadowOpacity: 0.15,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  contractTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  contractName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contractDetails: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  metricIconContainer: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  roleInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginLeft: 8,
  },
  partnersContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  partnerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  partnerText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 6,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    backgroundColor: "#F3F4F6",
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  emptyAction: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
    textAlign: "center",
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
    textAlign: "center",
    fontWeight: "600",
  },
});