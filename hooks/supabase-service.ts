import { supabase, Database, convertSupabaseUser, convertSupabaseContract, convertSupabaseClient, convertSupabaseConsultant, convertSupabaseDeal } from '@/constants/supabase';
import { User, Contract, Client, Consultant, Deal } from '@/types';

export class SupabaseService {
  // Users
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data?.map(convertSupabaseUser) || [];
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const insertData: Database['public']['Tables']['users']['Insert'] = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: userData.status || 'pending',
      level: userData.level || 'junior',
      admin_id: userData.adminId,
      leader_id: userData.leaderId,
      approved_at: userData.approvedAt?.toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return convertSupabaseUser(data);
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const updateData: Database['public']['Tables']['users']['Update'] = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: userData.status,
      level: userData.level,
      admin_id: userData.adminId,
      leader_id: userData.leaderId,
      approved_at: userData.approvedAt?.toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return convertSupabaseUser(data);
  }

  static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Contracts
  static async getContracts(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    return data?.map(convertSupabaseContract) || [];
  }

  static async createContract(contractData: Omit<Contract, 'id' | 'createdAt'>): Promise<Contract> {
    const insertData: Database['public']['Tables']['contracts']['Insert'] = {
      name: contractData.name,
      date: contractData.date.toISOString(),
      gross_margin: contractData.grossMargin,
      monthly_margin: contractData.monthlyMargin,
      duration: contractData.duration,
      developer_id: contractData.developerId,
      recruiter_id: contractData.recruiterId,
      created_by: contractData.createdBy,
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      throw error;
    }

    return convertSupabaseContract(data);
  }

  static async updateContract(contractId: string, contractData: Partial<Contract>): Promise<Contract> {
    const updateData: Database['public']['Tables']['contracts']['Update'] = {
      name: contractData.name,
      date: contractData.date?.toISOString(),
      gross_margin: contractData.grossMargin,
      monthly_margin: contractData.monthlyMargin,
      duration: contractData.duration,
      developer_id: contractData.developerId,
      recruiter_id: contractData.recruiterId,
      created_by: contractData.createdBy,
    };

    const { data, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      throw error;
    }

    return convertSupabaseContract(data);
  }

  static async deleteContract(contractId: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);

    if (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return data?.map(convertSupabaseClient) || [];
  }

  static async createClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const insertData: Database['public']['Tables']['clients']['Insert'] = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      company: clientData.company,
      position: clientData.position,
      notes: clientData.notes,
      status: clientData.status || 'prospect',
      created_by: clientData.createdBy,
      assigned_to: clientData.assignedTo,
      last_contact: clientData.lastContact?.toISOString(),
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return convertSupabaseClient(data);
  }

  static async updateClient(clientId: string, clientData: Partial<Client>): Promise<Client> {
    const updateData: Database['public']['Tables']['clients']['Update'] = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      company: clientData.company,
      position: clientData.position,
      notes: clientData.notes,
      status: clientData.status,
      created_by: clientData.createdBy,
      assigned_to: clientData.assignedTo,
      last_contact: clientData.lastContact?.toISOString(),
    };

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }

    return convertSupabaseClient(data);
  }

  static async deleteClient(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Consultants
  static async getConsultants(): Promise<Consultant[]> {
    const { data, error } = await supabase
      .from('consultants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consultants:', error);
      throw error;
    }

    return data?.map(convertSupabaseConsultant) || [];
  }

  static async createConsultant(consultantData: Omit<Consultant, 'id' | 'createdAt'>): Promise<Consultant> {
    const insertData: Database['public']['Tables']['consultants']['Insert'] = {
      name: consultantData.name,
      email: consultantData.email,
      phone: consultantData.phone,
      skills: consultantData.skills,
      experience: consultantData.experience,
      availability: consultantData.availability || 'available',
      daily_rate: consultantData.dailyRate,
      notes: consultantData.notes,
      created_by: consultantData.createdBy,
      assigned_to: consultantData.assignedTo,
      last_contact: consultantData.lastContact?.toISOString(),
    };

    const { data, error } = await supabase
      .from('consultants')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating consultant:', error);
      throw error;
    }

    return convertSupabaseConsultant(data);
  }

  static async updateConsultant(consultantId: string, consultantData: Partial<Consultant>): Promise<Consultant> {
    const updateData: Database['public']['Tables']['consultants']['Update'] = {
      name: consultantData.name,
      email: consultantData.email,
      phone: consultantData.phone,
      skills: consultantData.skills,
      experience: consultantData.experience,
      availability: consultantData.availability,
      daily_rate: consultantData.dailyRate,
      notes: consultantData.notes,
      created_by: consultantData.createdBy,
      assigned_to: consultantData.assignedTo,
      last_contact: consultantData.lastContact?.toISOString(),
    };

    const { data, error } = await supabase
      .from('consultants')
      .update(updateData)
      .eq('id', consultantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating consultant:', error);
      throw error;
    }

    return convertSupabaseConsultant(data);
  }

  static async deleteConsultant(consultantId: string): Promise<void> {
    const { error } = await supabase
      .from('consultants')
      .delete()
      .eq('id', consultantId);

    if (error) {
      console.error('Error deleting consultant:', error);
      throw error;
    }
  }

  // Deals
  static async getDeals(): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }

    return data?.map(convertSupabaseDeal) || [];
  }

  static async createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    const insertData: Database['public']['Tables']['deals']['Insert'] = {
      title: dealData.title,
      client_id: dealData.clientId,
      client_name: dealData.clientName,
      consultant_id: dealData.consultantId,
      consultant_name: dealData.consultantName,
      value: dealData.value,
      daily_margin: dealData.dailyMargin,
      status: dealData.status || 'cv_sent',
      probability: dealData.probability || 0,
      expected_close_date: dealData.expectedCloseDate.toISOString(),
      notes: dealData.notes,
      created_by: dealData.createdBy,
      assigned_to: dealData.assignedTo,
    };

    const { data, error } = await supabase
      .from('deals')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating deal:', error);
      throw error;
    }

    return convertSupabaseDeal(data);
  }

  static async updateDeal(dealId: string, dealData: Partial<Deal>): Promise<Deal> {
    const updateData: Database['public']['Tables']['deals']['Update'] = {
      title: dealData.title,
      client_id: dealData.clientId,
      client_name: dealData.clientName,
      consultant_id: dealData.consultantId,
      consultant_name: dealData.consultantName,
      value: dealData.value,
      daily_margin: dealData.dailyMargin,
      status: dealData.status,
      probability: dealData.probability,
      expected_close_date: dealData.expectedCloseDate?.toISOString(),
      notes: dealData.notes,
      created_by: dealData.createdBy,
      assigned_to: dealData.assignedTo,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      throw error;
    }

    return convertSupabaseDeal(data);
  }

  static async deleteDeal(dealId: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  }

  // Utility methods
  static async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  static async syncLocalDataToSupabase(users: User[], contracts: Contract[], clients: Client[], consultants: Consultant[], deals: Deal[]): Promise<void> {
    try {
      console.log('Starting sync to Supabase...');

      // Sync users
      for (const user of users) {
        try {
          await this.createUser(user);
        } catch (error) {
          console.warn('Failed to sync user:', user.email, error);
        }
      }

      // Sync contracts
      for (const contract of contracts) {
        try {
          await this.createContract(contract);
        } catch (error) {
          console.warn('Failed to sync contract:', contract.name, error);
        }
      }

      // Sync clients
      for (const client of clients) {
        try {
          await this.createClient(client);
        } catch (error) {
          console.warn('Failed to sync client:', client.name, error);
        }
      }

      // Sync consultants
      for (const consultant of consultants) {
        try {
          await this.createConsultant(consultant);
        } catch (error) {
          console.warn('Failed to sync consultant:', consultant.name, error);
        }
      }

      // Sync deals
      for (const deal of deals) {
        try {
          await this.createDeal(deal);
        } catch (error) {
          console.warn('Failed to sync deal:', deal.title, error);
        }
      }

      console.log('Sync to Supabase completed');
    } catch (error) {
      console.error('Error during sync to Supabase:', error);
      throw error;
    }
  }
}