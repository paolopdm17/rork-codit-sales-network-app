import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useData } from "@/hooks/data-context";
import { useAuth } from "@/hooks/auth-context";
import { COMMISSION_RATES, CAREER_LEVELS } from "@/constants/levels";
import { 
  Users, 
  Euro, 
  Award, 
  User, 
  Target,
  ChevronRight,
  Wallet,
  TrendingUp
} from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CareerLevel, User as UserType } from "@/types";

interface UserEarnings {
  id: string;
  name: string;
  level: string;
  personalRevenue: number;
  personalCommission: number;
  groupRevenue: number;
  groupCommission: number;
  totalEarnings: number;
  teamMembersCount: number;
  directTeamMembers: string[];
  allTeamMembers: string[];
}

export default function TeamEarningsScreen() {
  const { user } = useAuth();
  const { isLoading, refreshData, visibleUsers, visibleContracts } = useData();
  const [userEarnings, setUserEarnings] = useState<UserEarnings[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();


  // Calculate user earnings when data changes
  const calculateUserEarnings = useCallback(() => {
    console.log('=== CALCULATING USER EARNINGS ===');
    console.log('Current user (master):', user?.name, user?.id);
    console.log('Visible users for earnings calculation:', visibleUsers.map(u => ({ id: u.id, name: u.name, level: u.level })));
    
    const earnings: UserEarnings[] = [];
    
    // Get all active contracts for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const activeContracts = visibleContracts.filter(c => {
      const contractDate = new Date(c.date);
      const contractEndDate = new Date(contractDate);
      
      if (c.duration && c.duration > 0) {
        contractEndDate.setMonth(contractEndDate.getMonth() + c.duration);
      } else {
        contractEndDate.setMonth(contractEndDate.getMonth() + 1);
      }
      
      const currentMonthStart = new Date(currentYear, currentMonth, 1);
      const nextMonthStart = new Date(currentYear, currentMonth + 1, 1);
      
      const contractStartsBeforeOrDuringCurrentMonth = contractDate < nextMonthStart;
      const contractEndsAfterCurrentMonthStarts = contractEndDate > currentMonthStart;
      
      return contractStartsBeforeOrDuringCurrentMonth && contractEndsAfterCurrentMonthStarts;
    });

    console.log('Active contracts for earnings calculation:', activeContracts.length);

    // Calculate earnings for each user
    visibleUsers.forEach(userItem => {
      // Include all users in the team earnings view for master dashboard
      console.log(`Processing user ${userItem.name} (${userItem.id}) for team earnings`);

      console.log(`Calculating earnings for ${userItem.name} (${userItem.id})`);

      // Get user's personal contracts
      const personalContracts = activeContracts.filter(c => 
        c.developerId === userItem.id || c.recruiterId === userItem.id
      );

      // Calculate personal revenue
      const personalRevenue = personalContracts.reduce((sum, contract) => {
        const monthlyAmount = contract.monthlyMargin || (contract.grossMargin / (contract.duration || 1));
        
        if (contract.recruiterId && contract.developerId) {
          const isUserDeveloper = contract.developerId === userItem.id;
          const isUserRecruiter = contract.recruiterId === userItem.id;
          
          if (isUserDeveloper || isUserRecruiter) {
            return sum + (monthlyAmount * 0.5);
          }
        } else {
          return sum + monthlyAmount;
        }
        return sum;
      }, 0);

      // Calculate personal commission
      const personalCommission = personalRevenue * COMMISSION_RATES[userItem.level as CareerLevel];

      // Get ALL team members (direct and indirect) recursively
      const getAllTeamMembers = (leaderId: string): UserType[] => {
        const directMembers = visibleUsers.filter(u => u.leaderId === leaderId && u.status === 'approved');
        let allMembers = [...directMembers];
        
        // Recursively get team members of team members
        directMembers.forEach(member => {
          const subMembers = getAllTeamMembers(member.id);
          allMembers = [...allMembers, ...subMembers];
        });
        
        return allMembers;
      };
      
      const allTeamMembers = getAllTeamMembers(userItem.id);
      
      // Calculate group revenue (personal + all team members)
      let groupRevenue = personalRevenue;
      let groupCommission = 0;

      // Add ALL team members' revenue and calculate commission difference
      allTeamMembers.forEach(member => {
        const memberContracts = activeContracts.filter(c => 
          c.developerId === member.id || c.recruiterId === member.id
        );

        const memberRevenue = memberContracts.reduce((sum, contract) => {
          const monthlyAmount = contract.monthlyMargin || (contract.grossMargin / (contract.duration || 1));
          
          if (contract.recruiterId && contract.developerId) {
            const isMemberDeveloper = contract.developerId === member.id;
            const isMemberRecruiter = contract.recruiterId === member.id;
            
            if (isMemberDeveloper || isMemberRecruiter) {
              return sum + (monthlyAmount * 0.5);
            }
          } else {
            return sum + monthlyAmount;
          }
          return sum;
        }, 0);

        groupRevenue += memberRevenue;

        // Calculate commission difference (leader gets difference between their rate and member's rate)
        const leaderRate = COMMISSION_RATES[userItem.level as CareerLevel];
        const memberRate = COMMISSION_RATES[member.level as CareerLevel];
        const rateDifference = Math.max(0, leaderRate - memberRate);
        groupCommission += memberRevenue * rateDifference;
      });

      const totalEarnings = personalCommission + groupCommission;

      console.log(`${userItem.name} earnings:`, {
        personalRevenue,
        personalCommission,
        groupRevenue,
        groupCommission,
        totalEarnings,
        directTeamMembersCount: visibleUsers.filter(u => u.leaderId === userItem.id && u.status === 'approved').length,
        allTeamMembersCount: allTeamMembers.length
      });

      earnings.push({
        id: userItem.id,
        name: userItem.name,
        level: userItem.level,
        personalRevenue,
        personalCommission,
        groupRevenue,
        groupCommission,
        totalEarnings,
        teamMembersCount: allTeamMembers.length,
        directTeamMembers: visibleUsers.filter(u => u.leaderId === userItem.id && u.status === 'approved').map(m => m.id),
        allTeamMembers: allTeamMembers.map(m => m.id),
      });
    });

    // Sort by total earnings (highest first)
    earnings.sort((a, b) => b.totalEarnings - a.totalEarnings);
    
    console.log('Final user earnings:', earnings);
    setUserEarnings(earnings);
  }, [visibleUsers, visibleContracts, user?.id, user?.name]);

  // Set current user in data context when user changes
  useEffect(() => {
    if (user) {
      refreshData(user);
    }
  }, [user, refreshData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('Team earnings screen focused, refreshing data for:', user.name);
        refreshData(user);
      }
    }, [user, refreshData])
  );

  // Calculate user earnings when data changes
  useEffect(() => {
    if (visibleUsers.length > 0 && visibleContracts.length > 0) {
      calculateUserEarnings();
    }
  }, [calculateUserEarnings, visibleUsers.length, visibleContracts.length]);





  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return "€0";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTeamMemberDetails = (memberIds: string[]) => {
    if (!memberIds || !Array.isArray(memberIds)) return [];
    return memberIds.map(id => {
      if (!id || typeof id !== 'string') return null;
      return visibleUsers.find(u => u.id === id);
    }).filter((member): member is NonNullable<typeof member> => Boolean(member));
  };

  // Only allow master users to access this screen
  if (user?.role !== 'master') {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>
          Accesso negato. Solo gli utenti Master possono visualizzare questa sezione.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1F2937" />
      </View>
    );
  }

  const totalTeamEarnings = userEarnings.reduce((sum, user) => sum + user.totalEarnings, 0);

  const totalGroupRevenue = userEarnings.reduce((sum, user) => sum + user.groupRevenue, 0);

  return (
    <ScrollView style={styles.container}>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.totalEarningsCard]}>
          <Wallet color="#fff" size={24} />
          <Text style={styles.summaryValue}>{formatCurrency(totalTeamEarnings)}</Text>
          <Text style={styles.summaryLabel}>Guadagni Totali Team</Text>
        </View>

        <View style={[styles.summaryCard, styles.revenueCard]}>
          <Euro color="#fff" size={24} />
          <Text style={styles.summaryValue}>{formatCurrency(totalGroupRevenue)}</Text>
          <Text style={styles.summaryLabel}>Fatturato Totale</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.usersCard]}>
          <Users color="#fff" size={20} />
          <Text style={styles.summaryValue}>{userEarnings.length}</Text>
          <Text style={styles.summaryLabel}>Utenti Attivi</Text>
        </View>

        <View style={[styles.summaryCard, styles.avgCard]}>
          <Target color="#fff" size={20} />
          <Text style={styles.summaryValue}>
            {userEarnings.length > 0 ? formatCurrency(totalTeamEarnings / userEarnings.length) : "€0"}
          </Text>
          <Text style={styles.summaryLabel}>Media Guadagni</Text>
        </View>
      </View>

      {/* User Earnings List */}
      <View style={styles.usersList}>
        <Text style={styles.sectionTitle}>Dettaglio Guadagni per Utente</Text>
        
        {userEarnings.length === 0 ? (
          <View style={styles.emptyState}>
            <Users color="#94A3B8" size={48} />
            <Text style={styles.emptyStateText}>Nessun utente con guadagni trovato</Text>
            <Text style={styles.emptyStateSubtext}>
              I guadagni verranno visualizzati quando ci saranno contratti attivi
            </Text>
          </View>
        ) : (
          userEarnings.map((userEarning, index) => {
            const isExpanded = expandedUsers.has(userEarning.id);
            const teamMembers = getTeamMemberDetails(userEarning.allTeamMembers || userEarning.directTeamMembers);
            
            return (
              <View key={userEarning.id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userHeader}
                  onPress={() => toggleUserExpansion(userEarning.id)}
                >
                  <View style={styles.userRank}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userEarning.name}</Text>
                    <View style={styles.userLevel}>
                      <Award color="#6B7280" size={14} />
                      <Text style={styles.levelText}>
                        {CAREER_LEVELS[userEarning.level as keyof typeof CAREER_LEVELS]}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.userEarnings}>
                    <Text style={styles.totalEarningsText}>
                      {formatCurrency(userEarning.totalEarnings)}
                    </Text>
                    <Text style={styles.earningsLabel}>Guadagno Totale</Text>
                  </View>
                  
                  <ChevronRight 
                    color="#94A3B8" 
                    size={20} 
                    style={[
                      styles.expandIcon,
                      isExpanded && styles.expandIconRotated
                    ]}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.userDetails}>
                    {/* Personal Earnings */}
                    <View style={styles.earningsSection}>
                      <Text style={styles.sectionLabel}>Guadagni Personali</Text>
                      <View style={styles.earningsRow}>
                        <Text style={styles.earningsRowLabel}>Fatturato Personale:</Text>
                        <Text style={styles.earningsRowValue}>
                          {formatCurrency(userEarning.personalRevenue)}
                        </Text>
                      </View>
                      <View style={styles.earningsRow}>
                        <Text style={styles.earningsRowLabel}>Commissione Personale:</Text>
                        <Text style={[styles.earningsRowValue, styles.personalCommission]}>
                          {formatCurrency(userEarning.personalCommission)}
                        </Text>
                      </View>
                      <View style={styles.earningsRow}>
                        <Text style={styles.earningsRowLabel}>
                          Percentuale: {(COMMISSION_RATES[userEarning.level as CareerLevel] * 100).toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    {/* Group Earnings */}
                    {userEarning.teamMembersCount > 0 && (
                      <View style={styles.earningsSection}>
                        <Text style={styles.sectionLabel}>Guadagni di Gruppo</Text>
                        <View style={styles.earningsRow}>
                          <Text style={styles.earningsRowLabel}>Fatturato Gruppo:</Text>
                          <Text style={styles.earningsRowValue}>
                            {formatCurrency(userEarning.groupRevenue)}
                          </Text>
                        </View>
                        <View style={styles.earningsRow}>
                          <Text style={styles.earningsRowLabel}>Commissione Team:</Text>
                          <Text style={[styles.earningsRowValue, styles.groupCommission]}>
                            {formatCurrency(userEarning.groupCommission)}
                          </Text>
                        </View>
                        <View style={styles.earningsRow}>
                          <Text style={styles.earningsRowLabel}>
                            Membri Team: {userEarning.teamMembersCount}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Team Members Details */}
                    {teamMembers.length > 0 && (
                      <View style={styles.teamMembersSection}>
                        <Text style={styles.sectionLabel}>Membri del Team (Diretti e Indiretti)</Text>
                        {teamMembers.map(member => {
                          const isDirectMember = visibleUsers.find(u => u.id === member.id)?.leaderId === userEarning.id;
                          return (
                            <View key={member.id} style={[
                              styles.teamMemberRow,
                              !isDirectMember && styles.indirectTeamMemberRow
                            ]}>
                              <User color={isDirectMember ? "#6B7280" : "#94A3B8"} size={16} />
                              <Text style={[
                                styles.teamMemberName,
                                !isDirectMember && styles.indirectTeamMemberName
                              ]}>
                                {isDirectMember ? '' : '↳ '}{member.name}
                              </Text>
                              <Text style={[
                                styles.teamMemberLevel,
                                !isDirectMember && styles.indirectTeamMemberLevel
                              ]}>
                                {CAREER_LEVELS[member.level as keyof typeof CAREER_LEVELS]}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Total Summary */}
                    <View style={[styles.earningsSection, styles.totalSection]}>
                      <View style={styles.earningsRow}>
                        <Text style={[styles.earningsRowLabel, styles.totalLabel]}>
                          Guadagno Totale Mensile:
                        </Text>
                        <Text style={[styles.earningsRowValue, styles.totalValue]}>
                          {formatCurrency(userEarning.totalEarnings)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
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
    backgroundColor: "#F8FAFC",
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },

  summaryGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalEarningsCard: {
    backgroundColor: "#059669",
  },
  revenueCard: {
    backgroundColor: "#3B82F6",
  },
  usersCard: {
    backgroundColor: "#8B5CF6",
  },
  avgCard: {
    backgroundColor: "#F59E0B",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#E0E7FF",
    marginTop: 4,
    textAlign: "center",
  },
  usersList: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  userRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  userLevel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  levelText: {
    fontSize: 14,
    color: "#6B7280",
  },
  userEarnings: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  totalEarningsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },
  earningsLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  expandIcon: {
    transform: [{ rotate: "0deg" }],
  },
  expandIconRotated: {
    transform: [{ rotate: "90deg" }],
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    padding: 20,
    paddingTop: 16,
  },
  earningsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  earningsRowLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  earningsRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  personalCommission: {
    color: "#059669",
  },
  groupCommission: {
    color: "#3B82F6",
  },
  teamMembersSection: {
    marginBottom: 20,
  },
  teamMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
  teamMemberName: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  teamMemberLevel: {
    fontSize: 12,
    color: "#6B7280",
  },
  indirectTeamMemberRow: {
    backgroundColor: "#F1F5F9",
    marginLeft: 16,
  },
  indirectTeamMemberName: {
    color: "#64748B",
    fontStyle: "italic",
  },
  indirectTeamMemberLevel: {
    color: "#94A3B8",
  },
  totalSection: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#059669",
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#059669",
  },
});