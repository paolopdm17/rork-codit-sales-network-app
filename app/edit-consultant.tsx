import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, User, Mail, Phone, Code, Clock, Euro, FileText, X } from 'lucide-react-native';
import { useData } from '@/hooks/data-context';
import { useAuth } from '@/hooks/auth-context';
import { Consultant } from '@/types';

export default function EditConsultantScreen() {
  const { updateConsultant, visibleConsultants } = useData();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [] as string[],
    experience: 'Junior (1-2 anni)' as Consultant['experience'],
    availability: 'available' as Consultant['availability'],
    dailyRate: '',
    notes: '',
  });
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consultant, setConsultant] = useState<Consultant | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const foundConsultant = visibleConsultants.find(c => c.id === id);
      if (foundConsultant) {
        setConsultant(foundConsultant);
        setFormData({
          name: foundConsultant.name,
          email: foundConsultant.email,
          phone: foundConsultant.phone || '',
          skills: foundConsultant.skills || [],
          experience: foundConsultant.experience,
          availability: foundConsultant.availability,
          dailyRate: foundConsultant.dailyRate ? foundConsultant.dailyRate.toString() : '',
          notes: foundConsultant.notes || '',
        });
      } else {
        Alert.alert('Errore', 'Consulente non trovato', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id, visibleConsultants]);

  const handleSave = async () => {
    if (!user || !consultant) {
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

    // Validate daily rate if provided
    let dailyRate: number | undefined;
    if (formData.dailyRate.trim()) {
      dailyRate = parseFloat(formData.dailyRate);
      if (isNaN(dailyRate) || dailyRate < 0) {
        Alert.alert('Errore', 'Inserisci una tariffa giornaliera valida');
        return;
      }
    }

    setIsLoading(true);
    try {
      const updatedConsultant: Consultant = {
        ...consultant,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        skills: formData.skills,
        experience: formData.experience,
        availability: formData.availability,
        dailyRate,
        notes: formData.notes.trim(),
      };

      await updateConsultant(consultant.id, updatedConsultant);
      Alert.alert('Successo', 'Consulente aggiornato con successo', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating consultant:', error);
      Alert.alert('Errore', 'Errore durante l\'aggiornamento del consulente');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const experienceOptions = [
    'Junior (1-2 anni)',
    'Mid-level (3-4 anni)',
    'Senior (5+ anni)',
    'Lead/Architect (8+ anni)',
  ];

  const availabilityOptions = [
    { value: 'available', label: 'Disponibile', color: '#10B981' },
    { value: 'busy', label: 'Occupato', color: '#F59E0B' },
    { value: 'unavailable', label: 'Non disponibile', color: '#EF4444' },
  ];

  if (!consultant) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Modifica Consulente' }} />
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
          title: 'Modifica Consulente',
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
              placeholder="Inserisci il nome del consulente"
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
              placeholder="consulente@example.com"
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
          <Text style={styles.sectionTitle}>Competenze Professionali</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Code color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Competenze</Text>
            </View>
            <View style={styles.skillInputContainer}>
              <TextInput
                style={[styles.input, styles.skillInput]}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Aggiungi una competenza"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={addSkill}
              />
              <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
                <Text style={styles.addSkillButtonText}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
            {formData.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                {formData.skills.map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                      <X color="#1E40AF" size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Clock color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Esperienza</Text>
            </View>
            <View style={styles.experienceContainer}>
              {experienceOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.experienceOption,
                    formData.experience === option && styles.experienceOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, experience: option as Consultant['experience'] }))}
                >
                  <Text style={[
                    styles.experienceOptionText,
                    formData.experience === option && styles.experienceOptionTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Euro color="#6B7280" size={20} />
              <Text style={styles.inputLabel}>Tariffa Giornaliera (€)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.dailyRate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dailyRate: text }))}
              placeholder="640"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilità</Text>
          
          <View style={styles.availabilityContainer}>
            {availabilityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.availabilityOption,
                  formData.availability === option.value && {
                    backgroundColor: option.color + '20',
                    borderColor: option.color,
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, availability: option.value as Consultant['availability'] }))}
              >
                <View style={[styles.availabilityDot, { backgroundColor: option.color }]} />
                <Text style={[
                  styles.availabilityOptionText,
                  formData.availability === option.value && { color: option.color }
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
              placeholder="Note aggiuntive sul consulente..."
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
  skillInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  skillInput: {
    flex: 1,
  },
  addSkillButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addSkillButtonText: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  skillText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500' as const,
  },
  experienceContainer: {
    gap: 8,
  },
  experienceOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  experienceOptionActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#1E40AF',
  },
  experienceOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
    textAlign: 'center',
  },
  experienceOptionTextActive: {
    color: '#1E40AF',
  },
  availabilityContainer: {
    gap: 12,
  },
  availabilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availabilityOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 32,
  },
});