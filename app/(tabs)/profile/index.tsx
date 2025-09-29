import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "@/hooks/auth-context";
import { useData } from "@/hooks/data-context";
import { router } from "expo-router";
import { 
  Mail, 
  Shield, 
  Award, 
  LogOut, 
  RefreshCw, 
  Database,
  Crown,
  Star,
  TrendingUp,
  Users,
  Activity,
  Trash2
} from "lucide-react-native";
import { DataCleanupService } from '@/hooks/data-cleanup';
import { CAREER_LEVELS, LEVEL_COLORS, COMMISSION_RATES } from "@/constants/levels";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { refreshData, contracts, users } = useData();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Calculate user stats
  const userContracts = contracts?.filter(c => c.developerId === user?.id || c.recruiterId === user?.id) || [];
  const totalRevenue = userContracts.reduce((sum, c) => sum + c.monthlyMargin, 0);
  const teamSize = users?.filter(u => u.leaderId === user?.id || u.adminId === user?.id).length || 0;
  
  const getRoleIcon = () => {
    if (user?.role === 'master') return Crown;
    if (user?.role === 'admin') return Shield;
    return Star;
  };
  
  const getRoleDisplayName = () => {
    if (user?.role === 'master') return 'Master';
    if (user?.role === 'admin') return 'Amministratore';
    return 'Commerciale';
  };
  
  const getGradientColors = () => {
    const baseColor = LEVEL_COLORS[user?.level || 'junior'];
    if (user?.role === 'master') return ['#EC4899', '#BE185D'];
    if (user?.role === 'admin') return ['#3B82F6', '#1E40AF'];
    return [baseColor, baseColor + '80'];
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Sei sicuro di voler uscire?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Esci",
        style: "destructive",
        onPress: async () => {
          try {
            console.log('Starting logout process...');
            
            // Clear user data first
            await logout();
            console.log('Logout completed successfully');
            
            // Use a more reliable navigation approach
            // First navigate to root, then to login
            setTimeout(() => {
              try {
                router.replace("/");
                console.log('Navigation to root completed');
              } catch (navError) {
                console.error('Navigation error:', navError);
                // Fallback: try direct navigation to login
                router.replace("/(auth)/login");
              }
            }, 100);
            
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert("Errore", "Si è verificato un errore durante il logout");
          }
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset Dati",
      "Questo cancellerà tutti i dati salvati e caricherà i dati di esempio. Sei sicuro?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all stored data
              await AsyncStorage.removeItem('contracts');
              await AsyncStorage.removeItem('users');
              await AsyncStorage.removeItem('pendingUsers');
              
              // Refresh to load mock data
              await refreshData(user);
              
              Alert.alert("Successo", "I dati sono stati resettati con successo");
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert("Errore", "Si è verificato un errore durante il reset");
            }
          },
        },
      ]
    );
  };

  const handleRefreshData = async () => {
    try {
      await refreshData(user);
      Alert.alert("Successo", "Dati aggiornati con successo");
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert("Errore", "Si è verificato un errore durante l'aggiornamento");
    }
  };

  const handleCleanupProductionData = () => {
    Alert.alert(
      "Pulizia Dati Produzione",
      "Questa operazione eliminerà TUTTI i dati test dal database, mantenendo solo l'account amministrazione@codit.it.\n\nQuesta azione NON può essere annullata.\n\nSei sicuro di voler procedere?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina Tutto",
          style: "destructive",
          onPress: async () => {
            try {
              console.log('🧹 Iniziando pulizia dati produzione...');
              await DataCleanupService.cleanupTestData();
              
              // Refresh data after cleanup
              await refreshData(user);
              
              Alert.alert(
                "Pulizia Completata", 
                "Tutti i dati test sono stati eliminati con successo. Solo l'account master amministrazione@codit.it è stato preservato."
              );
            } catch (error) {
              console.error('Errore durante la pulizia:', error);
              Alert.alert(
                "Errore", 
                "Si è verificato un errore durante la pulizia dei dati. Controlla i log per maggiori dettagli."
              );
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  const RoleIcon = getRoleIcon();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={getGradientColors() as [string, string]}
        style={styles.profileHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <RoleIcon color="#fff" size={48} />
            </View>
            <View style={styles.statusIndicator} />
          </View>
          
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          
          <View style={styles.badgeContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{CAREER_LEVELS[user.level]}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{getRoleDisplayName()}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <TrendingUp color="#3B82F6" size={24} />
            </View>
            <Text style={styles.statValue}>€{totalRevenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Fatturato Mensile</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <Activity color="#10B981" size={24} />
            </View>
            <Text style={styles.statValue}>{userContracts.length}</Text>
            <Text style={styles.statLabel}>Contratti</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Award color="#F59E0B" size={24} />
            </View>
            <Text style={styles.statValue}>{Math.round((COMMISSION_RATES[user.level] || 0) * 100)}%</Text>
            <Text style={styles.statLabel}>Commissione</Text>
          </View>
          
          {(user.role === 'admin' || user.role === 'master' || user.level === 'team_leader' || user.level === 'partner') && (
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                <Users color="#8B5CF6" size={24} />
              </View>
              <Text style={styles.statValue}>{teamSize}</Text>
              <Text style={styles.statLabel}>Team</Text>
            </View>
          )}
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Informazioni Account</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Mail color="#3B82F6" size={20} />
              </View>
              <Text style={styles.infoTitle}>Email</Text>
            </View>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Shield color="#10B981" size={20} />
              </View>
              <Text style={styles.infoTitle}>Ruolo</Text>
            </View>
            <Text style={styles.infoValue}>{getRoleDisplayName()}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Award color="#F59E0B" size={20} />
              </View>
              <Text style={styles.infoTitle}>Stato</Text>
            </View>
            <Text style={[styles.infoValue, styles.statusActive]}>Attivo</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Star color="#8B5CF6" size={20} />
              </View>
              <Text style={styles.infoTitle}>Livello</Text>
            </View>
            <Text style={styles.infoValue}>{CAREER_LEVELS[user.level]}</Text>
          </View>
        </View>
      </View>

      {/* Admin/Master Tools */}
      {(user.role === "admin" || user.role === "master") && (
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Strumenti {user.role === 'master' ? 'Master' : 'Admin'}</Text>
          
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolCard} onPress={handleRefreshData}>
              <View style={[styles.toolIcon, { backgroundColor: '#EFF6FF' }]}>
                <RefreshCw color="#3B82F6" size={24} />
              </View>
              <Text style={styles.toolTitle}>Aggiorna Dati</Text>
              <Text style={styles.toolDescription}>Sincronizza i dati pi&ugrave; recenti</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard} onPress={handleResetData}>
              <View style={[styles.toolIcon, { backgroundColor: '#FEF3C7' }]}>
                <Database color="#F59E0B" size={24} />
              </View>
              <Text style={styles.toolTitle}>Reset Dati</Text>
              <Text style={styles.toolDescription}>Carica dati di esempio</Text>
            </TouchableOpacity>
          </View>
          
          {user.role === 'master' && (
            <>
              <TouchableOpacity 
                style={[styles.toolCard, styles.fullWidthTool]} 
                onPress={handleCleanupProductionData}
              >
                <View style={[styles.toolIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Trash2 color="#EF4444" size={24} />
                </View>
                <Text style={styles.toolTitle}>Pulizia Dati Produzione</Text>
                <Text style={styles.toolDescription}>Elimina tutti i dati test per iniziare in produzione</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toolCard, styles.fullWidthTool]} 
                onPress={() => router.push('/data-cleanup')}
              >
                <View style={[styles.toolIcon, { backgroundColor: '#F0F9FF' }]}>
                  <Database color="#0369A1" size={24} />
                </View>
                <Text style={styles.toolTitle}>Stato Database</Text>
                <Text style={styles.toolDescription}>Visualizza stato dettagliato del database</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Azioni Rapide</Text>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/contracts')}>
          <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
            <TrendingUp color="#10B981" size={20} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Visualizza Contratti</Text>
            <Text style={styles.actionDescription}>Gestisci i tuoi contratti attivi</Text>
          </View>
        </TouchableOpacity>
        
        {(user.role === 'admin' || user.role === 'master') && (
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/users')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Users color="#8B5CF6" size={20} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestisci Utenti</Text>
              <Text style={styles.actionDescription}>Amministra il team</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Esci dall&apos;Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 20,
    textAlign: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  levelBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  levelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    padding: 20,
    marginTop: -20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
  },
  statusActive: {
    color: "#10B981",
  },
  toolsSection: {
    padding: 20,
  },
  toolsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  toolCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: "center",
  },
  toolDescription: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  actionsSection: {
    padding: 20,
  },
  actionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: "#64748B",
  },
  logoutSection: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  fullWidthTool: {
    marginTop: 12,
  },
});