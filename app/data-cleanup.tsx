import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Trash2, Database, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataCleanupService } from '@/hooks/data-cleanup';
import { useAlert } from '@/components/WebAlert';

export default function DataCleanupScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    users: number;
    contracts: number;
    clients: number;
    consultants: number;
    deals: number;
    masterUserExists: boolean;
  } | null>(null);

  const loadDatabaseStatus = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const status = await DataCleanupService.getDatabaseStatus();
      setDbStatus(status);
    } catch (error) {
      console.error('Errore nel caricamento stato database:', error);
      showAlert('Errore', 'Impossibile caricare lo stato del database');
    } finally {
      setIsRefreshing(false);
    }
  }, [showAlert]);

  useEffect(() => {
    loadDatabaseStatus();
  }, [loadDatabaseStatus]);

  const handleCleanupData = () => {
    const message = 'Questa operazione eliminerà TUTTI i dati test dal database, mantenendo solo l\'account amministrazione@codit.it.\n\nQuesta azione NON può essere annullata.\n\nSei sicuro di voler procedere?';
    
    showAlert(
      'Conferma Pulizia Dati',
      message,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina Tutto',
          style: 'destructive',
          onPress: performCleanup,
        },
      ]
    );
  };

  const performCleanup = async () => {
    try {
      setIsLoading(true);
      await DataCleanupService.cleanupTestData();
      
      const successMessage = 'Tutti i dati test sono stati eliminati con successo. Solo l\'account master amministrazione@codit.it è stato preservato.';
      
      showAlert(
        'Pulizia Completata',
        successMessage,
        [
          {
            text: 'OK',
            onPress: loadDatabaseStatus,
          },
        ]
      );
    } catch (error) {
      console.error('Errore durante la pulizia:', error);
      const errorMessage = 'Si è verificato un errore durante la pulizia dei dati. Controlla i log per maggiori dettagli.';
      
      showAlert('Errore', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Pulizia Dati Produzione',
          headerStyle: { backgroundColor: '#dc2626' },
          headerTintColor: '#fff',
        }}
      />
      
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ ATTENZIONE</Text>
          <Text style={styles.warningText}>
            Questa sezione è destinata alla pulizia dei dati test prima del rilascio in produzione.
            {'\n\n'}
            L&apos;operazione eliminerà TUTTI i dati presenti nel database, mantenendo solo l&apos;account master amministrazione@codit.it.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Database size={24} color="#374151" />
            <Text style={styles.statusTitle}>Stato Database</Text>
            <TouchableOpacity
              onPress={loadDatabaseStatus}
              disabled={isRefreshing}
              style={styles.refreshButton}
            >
              <RefreshCw 
                size={20} 
                color="#6b7280" 
                style={isRefreshing ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>

          {dbStatus && (
            <View style={styles.statusContent}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Utenti:</Text>
                <Text style={styles.statusValue}>{dbStatus.users}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Contratti:</Text>
                <Text style={styles.statusValue}>{dbStatus.contracts}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Clienti:</Text>
                <Text style={styles.statusValue}>{dbStatus.clients}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Consulenti:</Text>
                <Text style={styles.statusValue}>{dbStatus.consultants}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Deals:</Text>
                <Text style={styles.statusValue}>{dbStatus.deals}</Text>
              </View>
              
              <View style={styles.masterUserStatus}>
                <Text style={styles.statusLabel}>Account Master:</Text>
                <Text style={[
                  styles.statusValue,
                  { color: dbStatus.masterUserExists ? '#059669' : '#dc2626' }
                ]}>
                  {dbStatus.masterUserExists ? '✅ Presente' : '❌ Mancante'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Pulizia Dati</Text>
          <Text style={styles.actionDescription}>
            Elimina tutti i dati test per preparare l&apos;applicazione alla produzione.
            {'\n\n'}
            Verrà mantenuto solo l&apos;account: amministrazione@codit.it
          </Text>

          <TouchableOpacity
            style={[styles.cleanupButton, isLoading && styles.disabledButton]}
            onPress={handleCleanupData}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Trash2 size={20} color="#fff" />
            )}
            <Text style={styles.cleanupButtonText}>
              {isLoading ? 'Pulizia in corso...' : 'Elimina Tutti i Dati Test'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Informazioni</Text>
          <Text style={styles.infoText}>
            • Questa operazione è irreversibile{'\n'}
            • Tutti i dati verranno eliminati dal database Supabase{'\n'}
            • Solo l&apos;account amministrazione@codit.it verrà preservato{'\n'}
            • Dopo la pulizia, l&apos;app sarà pronta per la produzione
          </Text>
        </View>
      </ScrollView>
      <AlertComponent />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  warningCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#dc2626',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  statusContent: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  masterUserStatus: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  cleanupButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  cleanupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0369a1',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
});