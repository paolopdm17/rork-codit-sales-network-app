import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Clipboard,
} from "react-native";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { useState } from "react";
import { router } from "expo-router";
import { Clock, ChevronRight, UserPlus, Edit, Info, X, CheckCircle, Trash2, Shield, Crown, Users, User, Key, Copy } from "lucide-react-native";
import { CAREER_LEVELS, LEVEL_REQUIREMENTS } from "@/constants/levels";

export default function UsersScreen() {
  const { visibleUsers, pendingUsers, refreshData, deleteUser } = useData();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [selectedUserLevel, setSelectedUserLevel] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const isMaster = user?.role === "master";
  const isAdminOrMaster = isAdmin || isMaster;

  // Separate users by role
  const masterUsers = visibleUsers.filter(u => u.role === "master");
  const adminUsers = visibleUsers.filter(u => u.role === "admin");
  const commercialUsers = visibleUsers.filter(u => u.role === "commercial");

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData(user);
    setRefreshing(false);
  };

  const handleApproveUser = (userId: string) => {
    router.push({
      pathname: "/user-approval",
      params: { userId },
    });
  };

  const handleEditUser = (userId: string) => {
    router.push({
      pathname: "/edit-user",
      params: { userId },
    });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      "Elimina Utente",
      `Sei sicuro di voler eliminare l'utente "${userName}"?\n\nQuesta azione non può essere annullata e l'utente verrà rimosso definitivamente dal sistema.`,
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
              await deleteUser(userId);
              Alert.alert("Successo", "Utente eliminato con successo");
            } catch (error) {
              Alert.alert(
                "Errore",
                error instanceof Error ? error.message : "Errore durante l'eliminazione dell'utente"
              );
            }
          },
        },
      ]
    );
  };

  const handleShowCredentials = (userEmail: string, userName: string) => {
    const credentials = `Email: ${userEmail}\nPassword: password123`;
    
    Alert.alert(
      `Credenziali di Accesso - ${userName}`,
      `Queste sono le credenziali per accedere alla piattaforma:\n\n${credentials}\n\nL'utente può utilizzare queste credenziali per effettuare il login.`,
      [
        {
          text: "Copia Credenziali",
          onPress: () => {
            Clipboard.setString(credentials);
            Alert.alert("Copiato!", "Le credenziali sono state copiate negli appunti");
          },
        },
        {
          text: "Chiudi",
          style: "cancel",
        },
      ]
    );
  };

  function renderUserCard(userData: any, userType: "master" | "admin" | "commercial") {
    const getRoleIcon = () => {
      switch (userType) {
        case "master":
          return <Crown color="#F59E0B" size={20} />;
        case "admin":
          return <Shield color="#1E40AF" size={20} />;
        default:
          return <User color="#10B981" size={20} />;
      }
    };

    const getRoleColor = () => {
      switch (userType) {
        case "master":
          return { bg: "#FEF3C7", text: "#92400E" };
        case "admin":
          return { bg: "#DBEAFE", text: "#1E40AF" };
        default:
          return { bg: "#D1FAE5", text: "#065F46" };
      }
    };

    const roleColors = getRoleColor();

    const getCardStyle = () => {
      switch (userType) {
        case "master":
          return styles.masterCard;
        case "admin":
          return styles.adminCard;
        default:
          return styles.commercialCard;
      }
    };

    return (
      <View key={userData.id} style={[styles.userCard, getCardStyle()]}>
        <View style={styles.userMainInfo}>
          <View style={styles.userInfo}>
            <View style={[styles.statusIcon, { backgroundColor: roleColors.bg }]}>
              {getRoleIcon()}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
              <View style={styles.userMeta}>
                <Text style={[styles.userRole, { backgroundColor: roleColors.bg, color: roleColors.text }]}>
                  {userData.role === "admin" ? "Amministratore" : userData.role === "master" ? "Master" : "Commerciale"}
                </Text>
                {userData.role === "commercial" && (
                  <View style={styles.levelContainer}>
                    <Text style={styles.userLevel}>
                      {CAREER_LEVELS[userData.level as keyof typeof CAREER_LEVELS]}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        {isAdminOrMaster && (
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.credentialsActionButton]}
              onPress={() => handleShowCredentials(userData.email, userData.name)}
            >
              <Key color="#fff" size={16} />
              <Text style={styles.actionButtonText}>Credenziali</Text>
            </TouchableOpacity>
            {userData.role === "commercial" && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedUserLevel(userData.level);
                  setShowRequirementsModal(true);
                }}
              >
                <Info color="#fff" size={16} />
                <Text style={styles.actionButtonText}>Regole</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.editActionButton]}
              onPress={() => handleEditUser(userData.id)}
            >
              <Edit color="#fff" size={16} />
              <Text style={styles.actionButtonText}>Modifica</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={() => handleDeleteUser(userData.id, userData.name)}
            >
              <Trash2 color="#fff" size={16} />
              <Text style={styles.actionButtonText}>Elimina</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add User Buttons - Only for Admins and Masters */}
      {isAdminOrMaster && (
        <View style={styles.headerSection}>
          <View style={styles.addButtonsRow}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push("/add-user")}
            >
              <UserPlus color="#fff" size={20} />
              <Text style={styles.addButtonText}>Aggiungi Commerciale</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addAdminButton}
              onPress={() => router.push("/add-admin")}
            >
              <Shield color="#fff" size={20} />
              <Text style={styles.addAdminButtonText}>Aggiungi Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utenti in Attesa</Text>
          {pendingUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userCard, styles.pendingCard]}
              onPress={() => handleApproveUser(user.id)}
            >
              <View style={styles.userInfo}>
                <View style={styles.statusIcon}>
                  <Clock color="#F59E0B" size={20} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.pendingText}>In attesa di approvazione</Text>
                </View>
              </View>
              <ChevronRight color="#94A3B8" size={20} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Master Users */}
      {masterUsers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Crown color="#F59E0B" size={24} />
            </View>
            <Text style={[styles.sectionTitle, styles.masterSectionTitle]}>Master</Text>
            <View style={styles.userCountBadge}>
              <Text style={styles.userCountText}>{masterUsers.length}</Text>
            </View>
          </View>
          {masterUsers.map((user) => renderUserCard(user, "master"))}
        </View>
      )}

      {/* Admin Users */}
      {adminUsers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Shield color="#1E40AF" size={24} />
            </View>
            <Text style={[styles.sectionTitle, styles.adminSectionTitle]}>Amministratori</Text>
            <View style={styles.userCountBadge}>
              <Text style={styles.userCountText}>{adminUsers.length}</Text>
            </View>
          </View>
          {adminUsers.map((user) => renderUserCard(user, "admin"))}
        </View>
      )}

      {/* Commercial Users */}
      {commercialUsers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Users color="#10B981" size={24} />
            </View>
            <Text style={[styles.sectionTitle, styles.commercialSectionTitle]}>Commerciali</Text>
            <View style={styles.userCountBadge}>
              <Text style={styles.userCountText}>{commercialUsers.length}</Text>
            </View>
          </View>
          {commercialUsers.map((user) => renderUserCard(user, "commercial"))}
        </View>
      )}
      
      {/* Requirements Modal */}
      <Modal
        visible={showRequirementsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRequirementsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Requisiti per {selectedUserLevel ? getNextLevelName(selectedUserLevel) : 'Livello Successivo'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRequirementsModal(false)}
            >
              <X color="#64748B" size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {renderLevelRequirements()}
          </ScrollView>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
  
  function getNextLevelName(currentLevel: string) {
    const currentLevelIndex = LEVEL_REQUIREMENTS.findIndex(r => r.level === currentLevel);
    const nextLevelReq = LEVEL_REQUIREMENTS[currentLevelIndex + 1];
    return nextLevelReq ? CAREER_LEVELS[nextLevelReq.level] : 'Livello Massimo';
  }
  
  function renderLevelRequirements() {
    if (!selectedUserLevel) return null;
    
    const currentLevelIndex = LEVEL_REQUIREMENTS.findIndex(r => r.level === selectedUserLevel);
    const nextLevelReq = LEVEL_REQUIREMENTS[currentLevelIndex + 1];
    
    if (!nextLevelReq) {
      return (
        <View style={styles.maxLevelContainer}>
          <Text style={styles.maxLevelText}>Questo utente ha già raggiunto il livello massimo!</Text>
        </View>
      );
    }
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
      }).format(amount);
    };
    
    return (
      <View>
        {/* Revenue Requirements */}
        <View style={styles.requirementSection}>
          <Text style={styles.sectionTitle}>Requisiti di Fatturato</Text>
          
          {nextLevelReq.isOrCondition && (
            <View style={styles.orConditionNote}>
              <Text style={styles.orConditionText}>
                È sufficiente soddisfare UNO dei seguenti requisiti di fatturato:
              </Text>
            </View>
          )}
          
          {/* Personal Revenue */}
          <View style={styles.requirementItem}>
            <View style={styles.requirementHeader}>
              <View style={styles.requirementIcon}>
                <CheckCircle color="#64748B" size={20} />
              </View>
              <Text style={styles.requirementTitle}>Fatturato Personale</Text>
            </View>
            <Text style={styles.requirementTarget}>
              Obiettivo: {formatCurrency(nextLevelReq.personalRevenue)}
            </Text>
          </View>
          
          {/* Group Revenue */}
          {nextLevelReq.groupRevenue && (
            <View style={styles.requirementItem}>
              <View style={styles.requirementHeader}>
                <View style={styles.requirementIcon}>
                  <CheckCircle color="#64748B" size={20} />
                </View>
                <Text style={styles.requirementTitle}>Fatturato Gruppo</Text>
              </View>
              <Text style={styles.requirementTarget}>
                Obiettivo: {formatCurrency(nextLevelReq.groupRevenue)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Member Development Requirements */}
        {nextLevelReq.requiredMembers && (
          <View style={styles.requirementSection}>
            <Text style={styles.sectionTitle}>Sviluppo Team</Text>
            
            <View style={styles.requirementItem}>
              <View style={styles.requirementHeader}>
                <View style={styles.requirementIcon}>
                  <CheckCircle color="#64748B" size={20} />
                </View>
                <Text style={styles.requirementTitle}>Membri Sviluppati</Text>
              </View>
              <Text style={styles.requirementTarget}>
                Obiettivo: {nextLevelReq.requiredMembers.count} {CAREER_LEVELS[nextLevelReq.requiredMembers.level]} o superiore
              </Text>
            </View>
          </View>
        )}
        
        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Riepilogo</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryText}>
              Per raggiungere il livello {CAREER_LEVELS[nextLevelReq.level]}, è necessario soddisfare:
            </Text>
            {nextLevelReq.isOrCondition ? (
              <Text style={styles.summaryRequirement}>
                • UNO tra i requisiti di fatturato (personale O gruppo)
              </Text>
            ) : (
              <>
                <Text style={styles.summaryRequirement}>
                  • Fatturato personale: {formatCurrency(nextLevelReq.personalRevenue)}
                </Text>
                {nextLevelReq.groupRevenue && (
                  <Text style={styles.summaryRequirement}>
                    • Fatturato gruppo: {formatCurrency(nextLevelReq.groupRevenue)}
                  </Text>
                )}
              </>
            )}
            {nextLevelReq.requiredMembers && (
              <Text style={styles.summaryRequirement}>
                • {nextLevelReq.requiredMembers.count} membri {CAREER_LEVELS[nextLevelReq.requiredMembers.level]} o superiore
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerSection: {
    padding: 16,
    paddingBottom: 8,
  },
  addButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  addAdminButton: {
    backgroundColor: "#1E40AF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addAdminButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userCountBadge: {
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: "auto",
  },
  userCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  masterSectionTitle: {
    color: "#92400E",
  },
  adminSectionTitle: {
    color: "#1E40AF",
  },
  commercialSectionTitle: {
    color: "#065F46",
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  masterCard: {
    borderLeftColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  adminCard: {
    borderLeftColor: "#1E40AF",
    backgroundColor: "#F8FAFC",
  },
  commercialCard: {
    borderLeftColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  userMainInfo: {
    marginBottom: 12,
  },
  pendingCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  approvedIcon: {
    backgroundColor: "#D1FAE5",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  userEmail: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  userMeta: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  userRole: {
    fontSize: 12,
    color: "#1E40AF",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userLevel: {
    fontSize: 12,
    color: "#7C3AED",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 12,
    color: "#F59E0B",
    marginTop: 4,
    fontStyle: "italic",
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  actionButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 80,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  credentialsActionButton: {
    backgroundColor: "#8B5CF6",
  },
  editActionButton: {
    backgroundColor: "#3B82F6",
  },
  deleteActionButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Level container styles
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  levelInfoButton: {
    padding: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // Max level styles
  maxLevelContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  maxLevelText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
    textAlign: "center",
  },
  // Requirements styles
  requirementSection: {
    marginBottom: 24,
  },
  orConditionNote: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  orConditionText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
  },
  requirementItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requirementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementIcon: {
    marginRight: 12,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  requirementTarget: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  // Summary styles
  summarySection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
  },
  summaryRequirement: {
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 6,
    paddingLeft: 8,
  },
});