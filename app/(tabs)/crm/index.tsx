import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { Plus, Users, UserCheck, Search, X, Building2, Mail, Phone, Award, DollarSign, Star, Briefcase, Calendar, TrendingUp } from 'lucide-react-native';
import { useData } from '@/hooks/data-context';
import { useAuth } from '@/hooks/auth-context';
import { Client, Consultant, Deal } from '@/types';

export default function CRMScreen() {
  const { visibleClients, visibleConsultants, visibleDeals, deleteClient, deleteConsultant, deleteDeal, refreshData, users } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'consultants' | 'deals'>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Force refresh CRM data when component mounts to ensure consultants are loaded
  useEffect(() => {
    console.log('CRM Screen mounted, forcing data refresh for consultants...');
    if (user) {
      refreshData(user);
    }
  }, [user]);

  // Filter clients, consultants, and deals based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return visibleClients;
    const query = searchQuery.toLowerCase();
    return visibleClients.filter(client => 
      client.name.toLowerCase().includes(query) ||
      (client.company && client.company.toLowerCase().includes(query)) ||
      (client.position && client.position.toLowerCase().includes(query)) ||
      client.email.toLowerCase().includes(query) ||
      (client.phone && client.phone.toLowerCase().includes(query)) ||
      (client.notes && client.notes.toLowerCase().includes(query))
    );
  }, [visibleClients, searchQuery]);

  const filteredConsultants = useMemo(() => {
    if (!searchQuery.trim()) return visibleConsultants;
    const query = searchQuery.toLowerCase();
    return visibleConsultants.filter(consultant => 
      consultant.name.toLowerCase().includes(query) ||
      consultant.experience.toLowerCase().includes(query) ||
      consultant.email.toLowerCase().includes(query) ||
      (consultant.phone && consultant.phone.toLowerCase().includes(query)) ||
      consultant.skills.some(skill => skill.toLowerCase().includes(query)) ||
      (consultant.notes && consultant.notes.toLowerCase().includes(query))
    );
  }, [visibleConsultants, searchQuery]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return visibleDeals.filter(deal => deal.status !== 'closed_won' && deal.status !== 'closed_lost');
    const query = searchQuery.toLowerCase();
    return visibleDeals.filter(deal => 
      (deal.status !== 'closed_won' && deal.status !== 'closed_lost') &&
      (deal.title.toLowerCase().includes(query) ||
      deal.clientName.toLowerCase().includes(query) ||
      (deal.consultantName && deal.consultantName.toLowerCase().includes(query)) ||
      (deal.notes && deal.notes.toLowerCase().includes(query)))
    );
  }, [visibleDeals, searchQuery]);

  const handleAddClient = () => {
    router.push('/add-client');
  };

  const handleAddConsultant = () => {
    router.push('/add-consultant');
  };

  const handleAddDeal = () => {
    router.push('/add-deal');
  };

  const handleDeleteClient = (clientId: string) => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questo cliente?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteClient(clientId)
        }
      ]
    );
  };

  const handleDeleteConsultant = (consultantId: string) => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questo consulente?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteConsultant(consultantId)
        }
      ]
    );
  };

  const handleDeleteDeal = (dealId: string) => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questo affare?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteDeal(dealId)
        }
      ]
    );
  };

  const getSalespersonName = (userId: string): string => {
    const salesperson = users.find(u => u.id === userId);
    return salesperson ? salesperson.name : 'Sconosciuto';
  };

  const renderClientCard = (client: Client) => (
    <View key={client.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.clientAvatar}>
          <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle}>{client.name}</Text>
          {(client.company || client.position) && (
            <Text style={styles.cardSubtitle}>
              {client.company || ''}{client.company && client.position ? ' • ' : ''}{client.position || ''}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(client.status)}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.contactRow}>
          <Mail color="#64748B" size={14} />
          <Text style={styles.contactText}>{client.email}</Text>
        </View>
        {client.phone && (
          <View style={styles.contactRow}>
            <Phone color="#64748B" size={14} />
            <Text style={styles.contactText}>{client.phone}</Text>
          </View>
        )}
        <View style={styles.contactRow}>
          <Star color="#F59E0B" size={14} />
          <Text style={styles.contactText}>{getSalespersonName(client.createdBy)}</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/edit-client?id=${client.id}`)}
        >
          <Text style={styles.editButtonText}>Modifica</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteClient(client.id)}
        >
          <Text style={styles.deleteButtonText}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConsultantCard = (consultant: Consultant) => (
    <View key={consultant.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.consultantAvatar}>
          <Text style={styles.avatarText}>{consultant.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle}>{consultant.name}</Text>
          <Text style={styles.cardSubtitle}>{consultant.experience}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getAvailabilityColor(consultant.availability) }]}>
          <Text style={styles.statusText}>{getAvailabilityLabel(consultant.availability)}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.contactRow}>
          <Mail color="#64748B" size={14} />
          <Text style={styles.contactText}>{consultant.email}</Text>
        </View>
        {consultant.phone && (
          <View style={styles.contactRow}>
            <Phone color="#64748B" size={14} />
            <Text style={styles.contactText}>{consultant.phone}</Text>
          </View>
        )}
        {consultant.dailyRate && (
          <View style={styles.contactRow}>
            <DollarSign color="#10B981" size={14} />
            <Text style={styles.contactText}>€{consultant.dailyRate}/giorno</Text>
          </View>
        )}
        <View style={styles.skillsRow}>
          {consultant.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {consultant.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{consultant.skills.length - 3}</Text>
          )}
        </View>
        <View style={styles.contactRow}>
          <Star color="#F59E0B" size={14} />
          <Text style={styles.contactText}>{getSalespersonName(consultant.createdBy)}</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/edit-consultant?id=${consultant.id}`)}
        >
          <Text style={styles.editButtonText}>Modifica</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteConsultant(consultant.id)}
        >
          <Text style={styles.deleteButtonText}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDealCard = (deal: Deal) => (
    <View key={deal.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dealAvatar}>
          <Briefcase color="#fff" size={20} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle}>{deal.title}</Text>
          <Text style={styles.cardSubtitle}>{deal.clientName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getDealStatusColor(deal.status) }]}>
          <Text style={styles.statusText}>{getDealStatusLabel(deal.status)}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.contactRow}>
          <DollarSign color="#10B981" size={14} />
          <Text style={styles.contactText}>€{deal.value.toLocaleString()}/giorno</Text>
        </View>
        <View style={styles.contactRow}>
          <Star color="#F59E0B" size={14} />
          <Text style={styles.contactText}>{getSalespersonName(deal.createdBy)}</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/edit-deal?id=${deal.id}`)}
        >
          <Text style={styles.editButtonText}>Modifica</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteDeal(deal.id)}
        >
          <Text style={styles.deleteButtonText}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'prospect': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: Client['status']) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'inactive': return 'Inattivo';
      case 'prospect': return 'Prospect';
      default: return status;
    }
  };

  const getAvailabilityColor = (availability: Consultant['availability']) => {
    switch (availability) {
      case 'available': return '#10B981';
      case 'busy': return '#F59E0B';
      case 'unavailable': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAvailabilityLabel = (availability: Consultant['availability']) => {
    switch (availability) {
      case 'available': return 'Disponibile';
      case 'busy': return 'Occupato';
      case 'unavailable': return 'Non disponibile';
      default: return availability;
    }
  };

  const getDealStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'cv_sent': return '#3B82F6';
      case 'initial_interview': return '#8B5CF6';
      case 'final_interview': return '#F59E0B';
      case 'feedback_pending': return '#06B6D4';
      case 'closed_won': return '#10B981';
      case 'closed_lost': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDealStatusLabel = (status: Deal['status']) => {
    switch (status) {
      case 'cv_sent': return 'CV Inviato';
      case 'initial_interview': return 'Interview iniziale';
      case 'final_interview': return 'Interview Finale';
      case 'feedback_pending': return 'Feedback da ricevere';
      case 'closed_won': return 'Chiuso Vinto';
      case 'closed_lost': return 'Chiuso Perso';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'CRM',
        }}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            setShowSearch(!showSearch);
            if (showSearch) {
              setSearchQuery('');
            }
          }}
        >
          {showSearch ? (
            <X color="#1E40AF" size={24} />
          ) : (
            <Search color="#1E40AF" size={24} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={activeTab === 'clients' ? handleAddClient : activeTab === 'consultants' ? handleAddConsultant : handleAddDeal}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search color="#9CA3AF" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Cerca ${activeTab === 'clients' ? 'clienti' : activeTab === 'consultants' ? 'consulenti' : 'affari'}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="#9CA3AF" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clients' && styles.activeTab]}
          onPress={() => setActiveTab('clients')}
        >
          <Users color={activeTab === 'clients' ? '#1E40AF' : '#6B7280'} size={18} />
          <Text style={[styles.tabText, activeTab === 'clients' && styles.activeTabText]}>
            Clienti ({searchQuery ? filteredClients.length : visibleClients.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'consultants' && styles.activeTab]}
          onPress={() => setActiveTab('consultants')}
        >
          <UserCheck color={activeTab === 'consultants' ? '#1E40AF' : '#6B7280'} size={18} />
          <Text style={[styles.tabText, activeTab === 'consultants' && styles.activeTabText]}>
            Consulenti ({searchQuery ? filteredConsultants.length : visibleConsultants.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deals' && styles.activeTab]}
          onPress={() => setActiveTab('deals')}
        >
          <Briefcase color={activeTab === 'deals' ? '#1E40AF' : '#6B7280'} size={18} />
          <Text style={[styles.tabText, activeTab === 'deals' && styles.activeTabText]}>
            Affari Aperti ({searchQuery ? filteredDeals.length : visibleDeals.filter(d => d.status !== 'closed_won' && d.status !== 'closed_lost').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'clients' ? (
          <View style={styles.section}>
            {filteredClients.length === 0 ? (
              <View style={styles.emptyState}>
                <Users color="#9CA3AF" size={48} />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Nessun risultato' : 'Nessun cliente'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Nessun cliente corrisponde alla ricerca' 
                    : 'Aggiungi il tuo primo cliente per iniziare a gestire i contatti'
                  }
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddClient}>
                  <Plus color="#fff" size={20} />
                  <Text style={styles.emptyButtonText}>Aggiungi Cliente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredClients.map(renderClientCard)
            )}
          </View>
        ) : activeTab === 'consultants' ? (
          <View style={styles.section}>
            {filteredConsultants.length === 0 ? (
              <View style={styles.emptyState}>
                <UserCheck color="#9CA3AF" size={48} />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Nessun risultato' : 'Nessun consulente'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Nessun consulente corrisponde alla ricerca' 
                    : 'Aggiungi il tuo primo consulente per gestire il network di professionisti'
                  }
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddConsultant}>
                  <Plus color="#fff" size={20} />
                  <Text style={styles.emptyButtonText}>Aggiungi Consulente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredConsultants.map(renderConsultantCard)
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {filteredDeals.length === 0 ? (
              <View style={styles.emptyState}>
                <Briefcase color="#9CA3AF" size={48} />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Nessun risultato' : 'Nessun affare aperto'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Nessun affare corrisponde alla ricerca' 
                    : 'Aggiungi il tuo primo affare per iniziare a tracciare le opportunità di business'
                  }
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddDeal}>
                  <Plus color="#fff" size={20} />
                  <Text style={styles.emptyButtonText}>Aggiungi Affare</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredDeals.map(renderDealCard)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    borderRadius: 12,
    marginHorizontal: 2,
    marginVertical: 8,
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#1E40AF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consultantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'uppercase' as const,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  skillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500' as const,
  },
  moreSkills: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500' as const,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});