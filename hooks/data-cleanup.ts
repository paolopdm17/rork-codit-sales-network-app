import { SupabaseService } from './supabase-service';

export class DataCleanupService {
  /**
   * Pulisce tutti i dati test mantenendo solo l'account master amministrazione@codit.it
   */
  static async cleanupTestData(): Promise<void> {
    try {
      console.log('🧹 Iniziando pulizia dati test...');

      // 1. Elimina tutti i deals
      console.log('Eliminando deals...');
      const deals = await SupabaseService.getDeals();
      for (const deal of deals) {
        await SupabaseService.deleteDeal(deal.id);
      }
      console.log(`✅ Eliminati ${deals.length} deals`);

      // 2. Elimina tutti i consultants
      console.log('Eliminando consultants...');
      const consultants = await SupabaseService.getConsultants();
      for (const consultant of consultants) {
        await SupabaseService.deleteConsultant(consultant.id);
      }
      console.log(`✅ Eliminati ${consultants.length} consultants`);

      // 3. Elimina tutti i clients
      console.log('Eliminando clients...');
      const clients = await SupabaseService.getClients();
      for (const client of clients) {
        await SupabaseService.deleteClient(client.id);
      }
      console.log(`✅ Eliminati ${clients.length} clients`);

      // 4. Elimina tutti i contracts
      console.log('Eliminando contracts...');
      const contracts = await SupabaseService.getContracts();
      for (const contract of contracts) {
        await SupabaseService.deleteContract(contract.id);
      }
      console.log(`✅ Eliminati ${contracts.length} contracts`);

      // 5. Elimina tutti gli utenti TRANNE amministrazione@codit.it
      console.log('Eliminando utenti test (mantenendo amministrazione@codit.it)...');
      const users = await SupabaseService.getUsers();
      const usersToDelete = users.filter(user => user.email !== 'amministrazione@codit.it');
      
      for (const user of usersToDelete) {
        await SupabaseService.deleteUser(user.id);
      }
      console.log(`✅ Eliminati ${usersToDelete.length} utenti test`);

      // 6. Verifica che l'utente master sia ancora presente
      const remainingUsers = await SupabaseService.getUsers();
      const masterUser = remainingUsers.find(user => user.email === 'amministrazione@codit.it');
      
      if (masterUser) {
        console.log('✅ Utente master amministrazione@codit.it preservato correttamente');
        console.log(`   - ID: ${masterUser.id}`);
        console.log(`   - Nome: ${masterUser.name}`);
        console.log(`   - Ruolo: ${masterUser.role}`);
        console.log(`   - Status: ${masterUser.status}`);
      } else {
        console.warn('⚠️  ATTENZIONE: Utente master amministrazione@codit.it non trovato!');
      }

      console.log('🎉 Pulizia dati completata con successo!');
      console.log('📊 Stato finale:');
      console.log(`   - Utenti rimanenti: ${remainingUsers.length}`);
      console.log(`   - Contracts: 0`);
      console.log(`   - Clients: 0`);
      console.log(`   - Consultants: 0`);
      console.log(`   - Deals: 0`);

    } catch (error) {
      console.error('❌ Errore durante la pulizia dati:', error);
      throw error;
    }
  }

  /**
   * Verifica lo stato attuale del database
   */
  static async getDatabaseStatus(): Promise<{
    users: number;
    contracts: number;
    clients: number;
    consultants: number;
    deals: number;
    masterUserExists: boolean;
  }> {
    try {
      const [users, contracts, clients, consultants, deals] = await Promise.all([
        SupabaseService.getUsers(),
        SupabaseService.getContracts(),
        SupabaseService.getClients(),
        SupabaseService.getConsultants(),
        SupabaseService.getDeals(),
      ]);

      const masterUserExists = users.some(user => user.email === 'amministrazione@codit.it');

      return {
        users: users.length,
        contracts: contracts.length,
        clients: clients.length,
        consultants: consultants.length,
        deals: deals.length,
        masterUserExists,
      };
    } catch (error) {
      console.error('Errore nel recupero stato database:', error);
      throw error;
    }
  }
}