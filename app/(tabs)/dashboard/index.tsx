import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { CAREER_LEVELS, LEVEL_COLORS, COMMISSION_RATES, LEVEL_REQUIREMENTS } from "@/constants/levels";
import { TrendingUp, Users, Euro, Award, Wallet, UserCheck, RefreshCw, Info, X, Target, CheckCircle, XCircle } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function DashboardScreen() {
  const { user } = useAuth();
  const { metrics, isLoading, refreshData, resetData, setCurrentUser, visibleUsers, visibleContracts } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  
  // Check if user is master
  const isMaster = user?.role === 'master';
  
  // Set current user in data context when user changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user, setCurrentUser]);
  
  // Debug logging for Antonio Baudo
  useEffect(() => {
    if (user && user.id === '4') {
      console.log('=== ANTONIO DASHBOARD DEBUG ===');
      console.log('User:', user);
      console.log('Metrics:', metrics);
      console.log('Is Loading:', isLoading);
    }
  }, [user, metrics, isLoading]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('Dashboard focused, refreshing data for:', user.name);
        refreshData(user);
      }
    }, [user, refreshData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData(user);
    setRefreshing(false);
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset Dati",
      "Vuoi resettare tutti i dati e ricaricare i dati di esempio?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setRefreshing(true);
            await resetData();
            setRefreshing(false);
          },
        },
      ]
    );
  };



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun dato disponibile</Text>
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
  
  // Master Dashboard - simplified view with only total revenue and network distribution
  if (isMaster) {
    // Calculate total revenue from all users
    const totalRevenue = visibleUsers.reduce((sum, user) => {
      const userMetrics = metrics?.teamMembers?.find(m => m.id === user.id);
      return sum + (userMetrics?.personalRevenue || 0);
    }, 0) + (metrics?.personalRevenue || 0);
    
    // Calculate total margin from all contracts
    const totalContractMargin = visibleContracts.reduce((sum: number, contract) => {
      return sum + contract.grossMargin;
    }, 0);
    
    const networkDistribution = totalRevenue * 0.7; // 70% distributed to network
    const companyRetention = totalRevenue * 0.3; // 30% retained by company
    const difference = companyRetention; // Same as company retention
    
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Master Header Card */}
        <View style={[styles.headerCard, styles.masterHeaderCard]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Dashboard Master</Text>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={[styles.levelBadge, styles.masterBadge]}>
                <View
                  style={[
                    styles.levelIndicator,
                    { backgroundColor: '#FFD700' },
                  ]}
                />
                <Text style={styles.levelText}>Master Dashboard</Text>
              </View>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetData}
              >
                <RefreshCw color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Master Metrics Grid */}
        <View style={styles.masterMetricsGrid}>
          {/* Total Contract Margin Card */}
          <View style={[styles.metricCard, styles.masterTotalMarginCard]}>
            <View style={styles.masterMetricHeader}>
              <View style={styles.masterIconContainer}>
                <TrendingUp color="#fff" size={20} />
              </View>
              <View style={styles.masterMetricContent}>
                <Text style={styles.masterMetricLabel}>Margine Totale Contratti</Text>
                <Text style={[styles.metricValue, styles.masterMetricValue]}>
                  {formatCurrency(totalContractMargin)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Total Revenue Card */}
          <View style={[styles.metricCard, styles.masterTotalRevenueCard]}>
            <View style={styles.masterMetricHeader}>
              <View style={styles.masterIconContainer}>
                <Euro color="#fff" size={20} />
              </View>
              <View style={styles.masterMetricContent}>
                <Text style={styles.masterMetricLabel}>Fatturato Totale</Text>
                <Text style={[styles.metricValue, styles.masterMetricValue]}>
                  {formatCurrency(totalRevenue)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Revenue Distribution Cards */}
        <View style={styles.masterDistributionContainer}>
          {/* Network Distribution Card */}
          <View style={[styles.card, styles.masterDistributionCard]}>
            <View style={styles.cardHeader}>
              <TrendingUp color="#10B981" size={24} />
              <Text style={[styles.cardTitle, styles.masterCardTitle]}>Distribuzione Rete (70%)</Text>
            </View>
            <Text style={[styles.commissionAmount, styles.masterDistributionAmount]}>
              {formatCurrency(networkDistribution)}
            </Text>
            <View style={styles.masterDistributionDetails}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Fatturato Totale:</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(totalRevenue)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Percentuale Rete:</Text>
                <Text style={styles.breakdownValue}>70%</Text>
              </View>
              <View style={[styles.breakdownRow, styles.masterFinalRow]}>
                <Text style={[styles.breakdownLabel, styles.masterFinalLabel]}>Importo Distribuito:</Text>
                <Text style={[styles.breakdownValue, styles.masterFinalValue]}>
                  {formatCurrency(networkDistribution)}
                </Text>
              </View>
            </View>
          </View>

          {/* Company Retention Card */}
          <View style={[styles.card, styles.masterRetentionCard]}>
            <View style={styles.cardHeader}>
              <Wallet color="#F59E0B" size={24} />
              <Text style={[styles.cardTitle, styles.masterCardTitle]}>Trattenuto Azienda (30%)</Text>
            </View>
            <Text style={[styles.commissionAmount, styles.masterRetentionAmount]}>
              {formatCurrency(companyRetention)}
            </Text>
            <View style={styles.masterDistributionDetails}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Fatturato Totale:</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(totalRevenue)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Percentuale Azienda:</Text>
                <Text style={styles.breakdownValue}>30%</Text>
              </View>
              <View style={[styles.breakdownRow, styles.masterFinalRow]}>
                <Text style={[styles.breakdownLabel, styles.masterFinalLabel]}>Importo Trattenuto:</Text>
                <Text style={[styles.breakdownValue, styles.masterRetentionFinalValue]}>
                  {formatCurrency(companyRetention)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Difference Visualization Card */}
        <View style={[styles.card, styles.masterDifferenceCard]}>
          <View style={styles.cardHeader}>
            <Target color="#8B5CF6" size={24} />
            <Text style={[styles.cardTitle, styles.masterCardTitle]}>Differenza Fatturato vs Distribuzione</Text>
          </View>
          
          {/* Visual Bar Chart */}
          <View style={styles.differenceVisualization}>
            <View style={styles.visualBar}>
              <View style={[styles.visualSegment, styles.networkSegment]}>
                <Text style={styles.segmentLabel}>Rete 70%</Text>
              </View>
              <View style={[styles.visualSegment, styles.companySegment]}>
                <Text style={styles.segmentLabel}>Azienda 30%</Text>
              </View>
            </View>
            
            <View style={styles.differenceStats}>
              <View style={styles.differenceStatItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statLabel}>Distribuito alla Rete</Text>
                <Text style={styles.statValue}>{formatCurrency(networkDistribution)}</Text>
              </View>
              
              <View style={styles.differenceStatItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.statLabel}>Trattenuto dall'Azienda</Text>
                <Text style={styles.statValue}>{formatCurrency(companyRetention)}</Text>
              </View>
              
              <View style={[styles.differenceStatItem, styles.totalStatItem]}>
                <View style={[styles.statIndicator, { backgroundColor: '#8B5CF6' }]} />
                <Text style={[styles.statLabel, styles.totalStatLabel]}>Differenza (Margine Azienda)</Text>
                <Text style={[styles.statValue, styles.totalStatValue]}>{formatCurrency(difference)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Master Summary Stats */}
        <View style={styles.masterStatsGrid}>
          <View style={[styles.masterStatCard, styles.masterStatCard1]}>
            <Users color="#3B82F6" size={20} />
            <Text style={styles.masterStatValue}>{visibleUsers.length}</Text>
            <Text style={styles.masterStatLabel}>Utenti Totali</Text>
          </View>
          <View style={[styles.masterStatCard, styles.masterStatCard2]}>
            <Target color="#8B5CF6" size={20} />
            <Text style={styles.masterStatValue}>70%</Text>
            <Text style={styles.masterStatLabel}>% Rete</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Benvenuto,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.levelBadge}>
              <View
                style={[
                  styles.levelIndicator,
                  { backgroundColor: LEVEL_COLORS[metrics.currentLevel] },
                ]}
              />
              <Text style={styles.levelText}>
                {CAREER_LEVELS[metrics.currentLevel]}
              </Text>
            </View>
          </View>
          {(user?.role === 'admin' || user?.role === 'master') && (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetData}
              >
                <RefreshCw color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Progress Card */}
      {metrics.nextLevel && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Award color="#1E40AF" size={20} />
            <Text style={styles.cardTitle}>Progresso Livello</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowRequirementsModal(true)}
            >
              <Info color="#3B82F6" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.progressText}>
            Prossimo: {CAREER_LEVELS[metrics.nextLevel]}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${metrics.progressToNextLevel * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(metrics.progressToNextLevel * 100)}% completato
          </Text>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowRequirementsModal(true)}
          >
            <Text style={styles.detailsButtonText}>Vedi Dettagli Requisiti</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, styles.metricCardPrimary]}>
          <Euro color="#fff" size={24} />
          <Text style={styles.metricValue}>
            {formatCurrency(metrics.personalRevenue)}
          </Text>
          <Text style={styles.metricLabel}>Fatturato Personale</Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardSecondary]}>
          <Users color="#fff" size={24} />
          <Text style={styles.metricValue}>
            {formatCurrency(metrics.groupRevenue)}
          </Text>
          <Text style={styles.metricLabel}>Fatturato Gruppo</Text>
        </View>
      </View>

      {/* Personal Commission Card */}
      <View style={[styles.card, styles.personalCommissionCard]}>
        <View style={styles.cardHeader}>
          <Wallet color="#10B981" size={20} />
          <Text style={styles.cardTitle}>Provvigioni Personali</Text>
        </View>
        <Text style={styles.commissionAmount}>
          {formatCurrency(metrics.personalCommission)}
        </Text>
        <View style={styles.commissionDetails}>
          <Text style={styles.commissionDetailText}>
            Fatturato: {formatCurrency(metrics.personalRevenue)}
          </Text>
          <Text style={styles.commissionDetailText}>
            Percentuale: {(COMMISSION_RATES[metrics.currentLevel] * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Team Commission Card */}
      <View style={[styles.card, styles.teamCommissionCard]}>
        <View style={styles.cardHeader}>
          <UserCheck color="#3B82F6" size={20} />
          <Text style={styles.cardTitle}>Provvigioni Team</Text>
        </View>
        <Text style={styles.commissionAmount}>
          {formatCurrency(metrics.teamCommission)}
        </Text>
        <View style={styles.commissionDetails}>
          <Text style={styles.commissionDetailText}>
            Fatturato Team: {formatCurrency(metrics.teamRevenue)}
          </Text>
          <Text style={styles.commissionDetailText}>
            Differenza percentuali applicate
          </Text>
        </View>
      </View>

      {/* Total Commission Summary */}
      <View style={[styles.card, styles.totalCommissionCard]}>
        <View style={styles.cardHeader}>
          <TrendingUp color="#F59E0B" size={20} />
          <Text style={styles.cardTitle}>Totale Provvigioni Mese</Text>
        </View>
        <Text style={[styles.commissionAmount, styles.totalAmount]}>
          {formatCurrency(metrics.totalCommission)}
        </Text>
        <View style={styles.summaryBreakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Personali:</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(metrics.personalCommission)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Team:</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(metrics.teamCommission)}
            </Text>
          </View>
        </View>
      </View>


      
      {/* Requirements Modal */}
      <Modal
        visible={showRequirementsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRequirementsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Requisiti per {CAREER_LEVELS[metrics.nextLevel || 'junior']}</Text>
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
  );
  
  function renderLevelRequirements() {
    if (!metrics?.nextLevel) return null;
    
    const nextLevelReq = LEVEL_REQUIREMENTS.find(r => r.level === metrics.nextLevel!);
    if (!nextLevelReq || !metrics) return null;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
      }).format(amount);
    };
    
    // Check current status for each requirement
    const personalRevenueStatus = metrics.personalRevenue >= nextLevelReq.personalRevenue;
    const groupRevenueStatus = !nextLevelReq.groupRevenue || metrics.groupRevenue >= nextLevelReq.groupRevenue;
    
    // Check member development requirements
    let memberDevelopmentStatus = true;
    let developedMembersCount = 0;
    let directTeamMembers: any[] = [];
    
    if (nextLevelReq.requiredMembers) {
      const requiredLevel = nextLevelReq.requiredMembers.level;
      const requiredCount = nextLevelReq.requiredMembers.count;
      
      const levelHierarchy = ['junior', 'senior', 'team_leader', 'partner', 'executive_director', 'managing_director'];
      const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
      
      // Get direct team members
      directTeamMembers = metrics.teamMembers.filter(member => {
        const memberUser = visibleUsers.find(u => u.id === member.id);
        return memberUser?.leaderId === user?.id;
      });
      
      developedMembersCount = directTeamMembers.filter(member => {
        const memberLevelIndex = levelHierarchy.indexOf(member.level);
        return memberLevelIndex >= requiredLevelIndex;
      }).length;
      
      memberDevelopmentStatus = developedMembersCount >= requiredCount;
    }
    
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
                {personalRevenueStatus ? (
                  <CheckCircle color="#10B981" size={20} />
                ) : (
                  <XCircle color="#EF4444" size={20} />
                )}
              </View>
              <Text style={styles.requirementTitle}>Fatturato Personale</Text>
            </View>
            <Text style={styles.requirementTarget}>
              Obiettivo: {formatCurrency(nextLevelReq.personalRevenue)}
            </Text>
            <Text style={[styles.requirementCurrent, personalRevenueStatus ? styles.requirementMet : styles.requirementNotMet]}>
              Attuale: {formatCurrency(metrics.personalRevenue)}
            </Text>
            {!personalRevenueStatus && (
              <Text style={styles.requirementShortfall}>
                Mancano: {formatCurrency(nextLevelReq.personalRevenue - metrics.personalRevenue)}
              </Text>
            )}
          </View>
          
          {/* Group Revenue */}
          {nextLevelReq.groupRevenue && (
            <View style={styles.requirementItem}>
              <View style={styles.requirementHeader}>
                <View style={styles.requirementIcon}>
                  {groupRevenueStatus ? (
                    <CheckCircle color="#10B981" size={20} />
                  ) : (
                    <XCircle color="#EF4444" size={20} />
                  )}
                </View>
                <Text style={styles.requirementTitle}>Fatturato Gruppo</Text>
              </View>
              <Text style={styles.requirementTarget}>
                Obiettivo: {formatCurrency(nextLevelReq.groupRevenue)}
              </Text>
              <Text style={[styles.requirementCurrent, groupRevenueStatus ? styles.requirementMet : styles.requirementNotMet]}>
                Attuale: {formatCurrency(metrics.groupRevenue)}
              </Text>
              {!groupRevenueStatus && (
                <Text style={styles.requirementShortfall}>
                  Mancano: {formatCurrency(nextLevelReq.groupRevenue - metrics.groupRevenue)}
                </Text>
              )}
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
                  {memberDevelopmentStatus ? (
                    <CheckCircle color="#10B981" size={20} />
                  ) : (
                    <XCircle color="#EF4444" size={20} />
                  )}
                </View>
                <Text style={styles.requirementTitle}>Membri Sviluppati</Text>
              </View>
              <Text style={styles.requirementTarget}>
                Obiettivo: {nextLevelReq.requiredMembers.count} {CAREER_LEVELS[nextLevelReq.requiredMembers.level]} o superiore
              </Text>
              <Text style={[styles.requirementCurrent, memberDevelopmentStatus ? styles.requirementMet : styles.requirementNotMet]}>
                Attuale: {developedMembersCount} membri qualificati
              </Text>
              {!memberDevelopmentStatus && (
                <Text style={styles.requirementShortfall}>
                  Mancano: {nextLevelReq.requiredMembers.count - developedMembersCount} membri
                </Text>
              )}
            </View>
            
            {/* Team Members List */}
            {directTeamMembers.length > 0 && (
              <View style={styles.teamMembersList}>
                <Text style={styles.teamMembersTitle}>Il Tuo Team Diretto:</Text>
                {directTeamMembers.map((member) => {
                  const levelHierarchy = ['junior', 'senior', 'team_leader', 'partner', 'executive_director', 'managing_director'];
                  const requiredLevelIndex = levelHierarchy.indexOf(nextLevelReq.requiredMembers!.level);
                  const memberLevelIndex = levelHierarchy.indexOf(member.level);
                  const qualifies = memberLevelIndex >= requiredLevelIndex;
                  
                  return (
                    <View key={member.id} style={styles.teamMemberItem}>
                      <View style={styles.memberIcon}>
                        {qualifies ? (
                          <CheckCircle color="#10B981" size={16} />
                        ) : (
                          <XCircle color="#EF4444" size={16} />
                        )}
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={[styles.memberLevel, qualifies ? styles.qualifiedMember : styles.notQualifiedMember]}>
                          {CAREER_LEVELS[member.level as keyof typeof CAREER_LEVELS]} {qualifies ? '✓' : '✗'}
                        </Text>
                      </View>
                      <Text style={styles.memberRevenue}>
                        {formatCurrency(member.personalRevenue)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
        
        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Riepilogo</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryText}>
              Per raggiungere il livello {CAREER_LEVELS[metrics.nextLevel!]}, devi soddisfare:
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
  },
  headerCard: {
    backgroundColor: "#1E40AF",
    padding: 24,
    paddingTop: 32,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 16,
  },
  resetButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 20,
  },
  fixButton: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  welcomeText: {
    fontSize: 16,
    color: "#E0E7FF",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  levelIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  levelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 24,
  },
  metricCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  metricCardPrimary: {
    backgroundColor: "#3B82F6",
  },
  metricCardSecondary: {
    backgroundColor: "#8B5CF6",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: "#E0E7FF",
    marginTop: 4,
  },
  personalCommissionCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  teamCommissionCard: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  totalCommissionCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  commissionAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10B981",
  },
  totalAmount: {
    fontSize: 32,
    color: "#F59E0B",
  },
  commissionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  commissionDetailText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  summaryBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  teamMember: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  memberLevel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  memberMetrics: {
    alignItems: "flex-end",
  },
  memberRevenue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  memberCommission: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
  },
  teamCommissionFromMember: {
    fontSize: 12,
    color: "#3B82F6",
    marginTop: 2,
    fontWeight: "600",
  },
  rateDifference: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
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
  // Progress card additional styles
  infoButton: {
    marginLeft: "auto",
    padding: 4,
  },
  detailsButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Requirements styles
  requirementSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
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
  requirementCurrent: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  requirementMet: {
    color: "#10B981",
  },
  requirementNotMet: {
    color: "#EF4444",
  },
  requirementShortfall: {
    fontSize: 12,
    color: "#EF4444",
    fontStyle: "italic",
  },
  // Team members list styles
  teamMembersList: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 8,
  },
  teamMembersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  teamMemberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  memberIcon: {
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  qualifiedMember: {
    color: "#10B981",
  },
  notQualifiedMember: {
    color: "#EF4444",
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
  // Master Dashboard Styles
  masterHeaderCard: {
    backgroundColor: "#1E40AF",
    borderBottomWidth: 4,
    borderBottomColor: "#FFD700",
  },
  masterBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
  },
  masterMetricsGrid: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 16,
  },
  masterTotalMarginCard: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  masterTotalRevenueCard: {
    backgroundColor: "#059669",
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  masterMetricHeader: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  masterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  masterMetricContent: {
    flex: 1,
  },
  masterMetricLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginBottom: 4,
  },
  masterMetricValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
  },
  masterDistributionContainer: {
    marginTop: 24,
  },
  masterDistributionCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  masterRetentionCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 2,
    borderColor: "#F59E0B",
    marginTop: 16,
  },
  masterDifferenceCard: {
    backgroundColor: "#F8FAFF",
    borderWidth: 2,
    borderColor: "#8B5CF6",
    marginTop: 16,
  },
  masterCardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  masterDistributionAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#059669",
  },
  masterRetentionAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#D97706",
  },
  masterDistributionDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#D1FAE5",
  },
  masterFinalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#10B981",
  },
  masterFinalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  masterFinalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#059669",
  },
  masterRetentionFinalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#D97706",
  },
  masterStatsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  masterStatCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  masterStatCard1: {
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  masterStatCard2: {
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  masterStatValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 8,
  },
  masterStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  // Difference Visualization Styles
  differenceVisualization: {
    marginTop: 16,
  },
  visualBar: {
    flexDirection: "row",
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  visualSegment: {
    justifyContent: "center",
    alignItems: "center",
  },
  networkSegment: {
    flex: 0.7,
    backgroundColor: "#10B981",
  },
  companySegment: {
    flex: 0.3,
    backgroundColor: "#F59E0B",
  },
  segmentLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  differenceStats: {
    gap: 16,
  },
  differenceStatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  totalStatItem: {
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  totalStatLabel: {
    fontWeight: "700",
    color: "#1F2937",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  totalStatValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#8B5CF6",
  },
});