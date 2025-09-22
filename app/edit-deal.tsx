import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, FileText, Euro } from 'lucide-react-native';
import { useData } from '@/hooks/data-context';
import { useAuth } from '@/hooks/auth-context';
import { Deal } from '@/types';

const statusOptions = [
  { value: 'cv_sent', label: 'CV Inviato' },
  { value: 'initial_interview', label: 'Interview iniziale' },
  { value: 'final_interview', label: 'Interview Finale' },
  { value: 'feedback_pending', label: 'Feedback da ricevere' },
  { value: 'closed_won', label: 'Chiuso Vinto' },
  { value: 'closed_lost', label: 'Chiuso Perso' },
] as const;

export default function EditDealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { visibleDeals, updateDeal } = useData();
  const { user } = useAuth();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [title, setTitle] = useState('');
  const [dailyMargin, setDailyMargin] = useState('');
  const [status, setStatus] = useState<Deal['status']>('cv_sent');
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    if (id) {
      const foundDeal = visibleDeals.find(d => d.id === id);
      if (foundDeal) {
        setDeal(foundDeal);
        setTitle(foundDeal.title);
        setDailyMargin(foundDeal.dailyMargin?.toString() || '');
        setStatus(foundDeal.status);
      } else {
        Alert.alert('Errore', 'Affare non trovato');
        router.back();
      }
    }
  }, [id, visibleDeals]);

  const handleSave = async () => {
    if (!deal || !user) return;

    if (!title.trim()) {
      Alert.alert('Errore', 'Il nome dell\'affare è obbligatorio');
      return;
    }

    setIsLoading(true);

    try {
      const updatedDeal: Deal = {
        ...deal,
        title: title.trim(),
        dailyMargin: dailyMargin ? Number(dailyMargin) : undefined,
        status,
        updatedAt: new Date(),
      };

      console.log('Calling updateDeal with:', { dealId: deal.id, updatedDeal });
      await updateDeal(deal.id, updatedDeal);
      console.log('updateDeal completed successfully');
      
      Alert.alert(
        'Successo',
        'Affare aggiornato con successo!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating deal:', error);
      Alert.alert('Errore', 'Errore durante l\'aggiornamento dell\'affare');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (statusValue: Deal['status']) => {
    switch (statusValue) {
      case 'cv_sent': return '#3B82F6';
      case 'initial_interview': return '#8B5CF6';
      case 'final_interview': return '#F59E0B';
      case 'feedback_pending': return '#06B6D4';
      case 'closed_won': return '#10B981';
      case 'closed_lost': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (statusValue: Deal['status']) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option?.label || statusValue;
  };

  if (!deal) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Modifica Affare',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft color="#1E40AF" size={24} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Modifica Affare',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft color="#1E40AF" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.headerButton, { opacity: isLoading ? 0.5 : 1 }]}
              disabled={isLoading}
            >
              <Save color="#1E40AF" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modifica Affare</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome dell&apos;Affare *</Text>
            <View style={styles.inputContainer}>
              <FileText color="#64748B" size={20} />
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Inserisci il nome dell&apos;affare"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stato dell&apos;Affare *</Text>
            <TouchableOpacity 
              style={styles.dropdownContainer}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
              <Text style={styles.dropdownText}>
                {getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
            {showStatusDropdown && (
              <View style={styles.dropdown}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.dropdownItem, status === option.value && styles.selectedDropdownItem]}
                    onPress={() => {
                      setStatus(option.value);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(option.value) }]} />
                    <Text style={[styles.dropdownItemText, status === option.value && styles.selectedDropdownItemText]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Probabile Margine Giornaliero (€)</Text>
            <View style={styles.inputContainer}>
              <Euro color="#64748B" size={20} />
              <TextInput
                style={styles.input}
                value={dailyMargin}
                onChangeText={setDailyMargin}
                placeholder="Inserisci il margine giornaliero"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { opacity: isLoading ? 0.5 : 1 }]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Save color="#fff" size={20} />
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedDropdownItem: {
    backgroundColor: '#EBF4FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  selectedDropdownItemText: {
    color: '#1E40AF',
    fontWeight: '600' as const,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});