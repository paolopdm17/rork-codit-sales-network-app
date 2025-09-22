import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, User, Mail, Phone, Building, Briefcase, FileText } from 'lucide-react-native';
import { useData } from '@/hooks/data-context';
import { useAuth } from '@/hooks/auth-context';
import { Client } from '@/types';

export default function EditClientScreen() {
  const { updateClient, visibleClients } = useData();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'prospect' as Client['status'],
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const foundClient = visibleClients.find(c => c.id === id);
      if (foundClient) {
        setClient(foundClient);
        setFormData({
          name: foundClient.name,
          email: foundClient.email,
          phone: foundClient.phone || '',
          company: foundClient.company || '',
          position: foundClient.position || '',
          status: foundClient.status,
          notes: foundClient.notes || '',
        });
      } else {
        Alert.alert('Errore', 'Cliente non trovato', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id, visibleClients]);

  const handleSave = async () => {
    if (!user || !client) {
      Alert.alert('Errore', 'Dati mancanti');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Errore', 'Nome e email sono obbligatori');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    setIsLoading(true);
    try {
      const updatedClient: Client = {
        ...client,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        position: formData.position.trim(),
        status: formData.status,
        notes: formData.notes.trim(),
      };

      await updateClient(client.id, updatedClient);
      Alert.alert('Successo', 'Cliente aggiornato con successo', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert('Errore', 'Errore durante l\'aggiornamento del cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'active', label: 'Attivo' },
    { value: 'inactive', label: 'Inattivo' },
  ];

  if (!client) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Modifica Cliente' }} />
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
          title: 'Modifica Cliente',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={[styles.headerButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Save color="#fff" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informazioni Personali</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <User color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Nome *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Inserisci il nome del cliente"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Mail color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Email *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="cliente@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Phone color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Telefono</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="+39 123 456 7890"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informazioni Aziendali</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Building color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Azienda</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(text) => setFormData(prev => ({ ...prev, company: text }))}
              placeholder="Nome dell'azienda"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Briefcase color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Posizione</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.position}
              onChangeText={(text) => setFormData(prev => ({ ...prev, position: text }))}
              placeholder="CEO, CTO, Manager, etc."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stato Cliente</Text>
          
          <View style={styles.statusContainer}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  formData.status === option.value && styles.statusOptionActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, status: option.value as Client['status'] }))}
              >
                <Text style={[
                  styles.statusOptionText,
                  formData.status === option.value && styles.statusOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <FileText color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Note</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Note aggiuntive sul cliente..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#1E40AF',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  statusOptionTextActive: {
    color: '#1E40AF',
  },
  bottomPadding: {
    height: 32,
  },
});