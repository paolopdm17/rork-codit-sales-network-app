import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { CAREER_LEVELS, COMMISSION_RATES } from "@/constants/levels";
import { Users, UserCheck, ChevronRight, Star } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { TeamMember, CareerLevel } from "@/types";

export default function MyTeamScreen() {
  const { user } = useAuth();
  const { metrics, isLoading, refreshData, setCurrentUser, users } = useData();
  const [refreshing, setRefreshing] = useState(false);

  // Set current user in data context when user changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user, setCurrentUser]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('My Team focused, refreshing data for:', user.name);
        refreshData(user);
      }
    }, [user, refreshData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData(user);
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!metrics || !metrics.teamMembers || metrics.teamMembers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <UserCheck color="#94A3B8" size={64} />
        <Text style={styles.emptyTitle}>Nessun membro nel team</Text>
        <Text style={styles.emptyText}>
          Quando avrai dei membri nel tuo team, li vedrai qui
        </Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return "€0";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get all users to determine direct vs indirect relationships
  // (users already available from useData hook above)
  
  // Separate direct and indirect team members
  const directMembers = metrics.teamMembers.filter(member => {
    const memberUser = users.find(u => u.id === member.id);
    return memberUser?.leaderId === user?.id;
  });
  
  const indirectMembers = metrics.teamMembers.filter(member => {
    const memberUser = users.find(u => u.id === member.id);
    return memberUser?.leaderId !== user?.id;
  });

  const renderTeamMember = (member: TeamMember, isDirect: boolean) => {
    if (!member?.name || !member?.level) return null;
    
    const memberRate = COMMISSION_RATES[member.level as CareerLevel] || 0;
    const leaderRate = user ? COMMISSION_RATES[metrics.currentLevel as CareerLevel] || 0 : 0;
    const rateDifference = leaderRate - memberRate;
    const teamCommissionFromMember = (member.personalRevenue || 0) * Math.max(0, rateDifference);
    
    return (
      <View key={member.id} style={[styles.teamMember, isDirect ? styles.directMember : styles.indirectMember]}>
        <View style={styles.memberHeader}>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              {isDirect ? (
                <Star color="#F59E0B" size={16} fill="#F59E0B" />
              ) : (
                <ChevronRight color="#94A3B8" size={16} />
              )}
              <Text style={[styles.memberName, isDirect ? styles.directMemberName : styles.indirectMemberName]}>
                {member.name}
              </Text>
              {isDirect && <Text style={styles.directBadge}>DIRETTO</Text>}
            </View>
            <Text style={styles.memberLevel}>
              {CAREER_LEVELS[member.level as CareerLevel] || 'N/A'} ({(memberRate * 100).toFixed(0)}%)
            </Text>
          </View>
          <View style={styles.memberMetrics}>
            <Text style={styles.memberRevenue}>
              {formatCurrency(member.personalRevenue || 0)}
            </Text>
            <Text style={styles.memberCommission}>
              Sua provv: {formatCurrency(member.commission || 0)}
            </Text>
            <Text style={styles.teamCommissionFromMember}>
              Tua provv: {formatCurrency(teamCommissionFromMember)}
            </Text>
            {isDirect && (
              <Text style={styles.rateDifference}>
                Diff: {(rateDifference * 100).toFixed(1)}%
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };



  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Users color="#1E40AF" size={24} />
          <Text style={styles.statValue}>{metrics.teamMembers.length}</Text>
          <Text style={styles.statLabel}>Membri Team</Text>
        </View>
        <View style={styles.statCard}>
          <UserCheck color="#10B981" size={24} />
          <Text style={styles.statValue}>
            {formatCurrency(metrics.teamCommission)}
          </Text>
          <Text style={styles.statLabel}>Provvigioni Team</Text>
        </View>
      </View>

      {/* Direct Team Members */}
      {directMembers.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Star color="#F59E0B" size={20} fill="#F59E0B" />
            <Text style={styles.cardTitle}>Collaboratori Diretti</Text>
            <View style={styles.memberCount}>
              <Text style={styles.memberCountText}>{directMembers.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Commerciali che riportano direttamente a te
          </Text>
          {directMembers.map((member) => member ? renderTeamMember(member, true) : null)}
        </View>
      )}

      {/* Indirect Team Members */}
      {indirectMembers.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Users color="#6B7280" size={20} />
            <Text style={[styles.cardTitle, styles.indirectTitle]}>Collaboratori Indiretti</Text>
            <View style={[styles.memberCount, styles.indirectCount]}>
              <Text style={[styles.memberCountText, styles.indirectCountText]}>{indirectMembers.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Commerciali nel tuo team attraverso altri leader
          </Text>
          {indirectMembers.map((member) => member ? renderTeamMember(member, false) : null)}
        </View>
      )}

      {/* Team Performance Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <UserCheck color="#10B981" size={20} />
          <Text style={styles.cardTitle}>Riepilogo Performance Team</Text>
        </View>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fatturato Team Totale</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(metrics.teamRevenue)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Provvigioni Team Totali</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(metrics.teamCommission)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Media Fatturato per Membro</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(metrics.teamRevenue / metrics.teamMembers.length)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Media Provvigioni per Membro</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(metrics.teamCommission / metrics.teamMembers.length)}
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
  headerStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#1E40AF",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
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
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 8,
    flex: 1,
  },
  indirectTitle: {
    color: "#6B7280",
  },
  memberCount: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  memberCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  indirectCount: {
    backgroundColor: "#6B7280",
  },
  indirectCountText: {
    color: "#fff",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
    fontStyle: "italic",
  },
  teamMember: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  directMember: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  indirectMember: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 4,
    borderLeftColor: "#E2E8F0",
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
    flex: 1,
  },
  directMemberName: {
    color: "#92400E",
  },
  indirectMemberName: {
    color: "#475569",
  },
  directBadge: {
    backgroundColor: "#F59E0B",
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textAlign: "center",
    marginLeft: 8,
  },
  memberLevel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    marginLeft: 24,
  },
  memberMetrics: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  memberRevenue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  memberCommission: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
    fontWeight: "500",
  },
  teamCommissionFromMember: {
    fontSize: 13,
    color: "#3B82F6",
    marginTop: 2,
    fontWeight: "600",
  },
  rateDifference: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderTopWidth: 4,
    borderTopColor: "#10B981",
  },
  summaryGrid: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
});