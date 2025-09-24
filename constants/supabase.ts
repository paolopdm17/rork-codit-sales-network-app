import { createClient } from '@supabase/supabase-js';

// Sostituisci questi valori con quelli del tuo progetto Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipi per le tabelle del database
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'commercial' | 'master';
          status: 'pending' | 'approved' | 'rejected';
          level: 'junior' | 'senior' | 'team_leader' | 'partner' | 'executive_director' | 'managing_director';
          admin_id?: string;
          leader_id?: string;
          approved_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'commercial' | 'master';
          status?: 'pending' | 'approved' | 'rejected';
          level?: 'junior' | 'senior' | 'team_leader' | 'partner' | 'executive_director' | 'managing_director';
          admin_id?: string;
          leader_id?: string;
          approved_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'commercial' | 'master';
          status?: 'pending' | 'approved' | 'rejected';
          level?: 'junior' | 'senior' | 'team_leader' | 'partner' | 'executive_director' | 'managing_director';
          admin_id?: string;
          leader_id?: string;
          approved_at?: string;
          created_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          name: string;
          date: string;
          gross_margin: number;
          monthly_margin: number;
          duration: number;
          developer_id: string;
          recruiter_id?: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          gross_margin: number;
          monthly_margin: number;
          duration: number;
          developer_id: string;
          recruiter_id?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          gross_margin?: number;
          monthly_margin?: number;
          duration?: number;
          developer_id?: string;
          recruiter_id?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          company?: string;
          position?: string;
          notes?: string;
          status: 'active' | 'inactive' | 'prospect';
          created_by: string;
          assigned_to?: string;
          created_at: string;
          last_contact?: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          company?: string;
          position?: string;
          notes?: string;
          status?: 'active' | 'inactive' | 'prospect';
          created_by: string;
          assigned_to?: string;
          created_at?: string;
          last_contact?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          company?: string;
          position?: string;
          notes?: string;
          status?: 'active' | 'inactive' | 'prospect';
          created_by?: string;
          assigned_to?: string;
          created_at?: string;
          last_contact?: string;
        };
      };
      consultants: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone?: string;
          skills: string[];
          experience: 'Junior (1-2 anni)' | 'Mid-level (3-4 anni)' | 'Senior (5+ anni)' | 'Lead/Architect (8+ anni)';
          availability: 'available' | 'busy' | 'unavailable';
          daily_rate?: number;
          notes?: string;
          created_by: string;
          assigned_to?: string;
          created_at: string;
          last_contact?: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          skills: string[];
          experience: 'Junior (1-2 anni)' | 'Mid-level (3-4 anni)' | 'Senior (5+ anni)' | 'Lead/Architect (8+ anni)';
          availability?: 'available' | 'busy' | 'unavailable';
          daily_rate?: number;
          notes?: string;
          created_by: string;
          assigned_to?: string;
          created_at?: string;
          last_contact?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          skills?: string[];
          experience?: 'Junior (1-2 anni)' | 'Mid-level (3-4 anni)' | 'Senior (5+ anni)' | 'Lead/Architect (8+ anni)';
          availability?: 'available' | 'busy' | 'unavailable';
          daily_rate?: number;
          notes?: string;
          created_by?: string;
          assigned_to?: string;
          created_at?: string;
          last_contact?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          title: string;
          client_id: string;
          client_name: string;
          consultant_id?: string;
          consultant_name?: string;
          value: number;
          daily_margin?: number;
          status: 'cv_sent' | 'initial_interview' | 'final_interview' | 'feedback_pending' | 'closed_won' | 'closed_lost';
          probability: number;
          expected_close_date: string;
          notes?: string;
          created_by: string;
          assigned_to?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          client_id: string;
          client_name: string;
          consultant_id?: string;
          consultant_name?: string;
          value: number;
          daily_margin?: number;
          status?: 'cv_sent' | 'initial_interview' | 'final_interview' | 'feedback_pending' | 'closed_won' | 'closed_lost';
          probability?: number;
          expected_close_date: string;
          notes?: string;
          created_by: string;
          assigned_to?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          client_id?: string;
          client_name?: string;
          consultant_id?: string;
          consultant_name?: string;
          value?: number;
          daily_margin?: number;
          status?: 'cv_sent' | 'initial_interview' | 'final_interview' | 'feedback_pending' | 'closed_won' | 'closed_lost';
          probability?: number;
          expected_close_date?: string;
          notes?: string;
          created_by?: string;
          assigned_to?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper per convertire i dati da Supabase al formato dell'app
export const convertSupabaseUser = (supabaseUser: Database['public']['Tables']['users']['Row']) => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.name,
    role: supabaseUser.role,
    status: supabaseUser.status,
    level: supabaseUser.level,
    adminId: supabaseUser.admin_id,
    leaderId: supabaseUser.leader_id,
    approvedAt: supabaseUser.approved_at ? new Date(supabaseUser.approved_at) : undefined,
    createdAt: new Date(supabaseUser.created_at),
  };
};

export const convertSupabaseContract = (supabaseContract: Database['public']['Tables']['contracts']['Row']) => {
  return {
    id: supabaseContract.id,
    name: supabaseContract.name,
    date: new Date(supabaseContract.date),
    grossMargin: supabaseContract.gross_margin,
    monthlyMargin: supabaseContract.monthly_margin,
    duration: supabaseContract.duration,
    developerId: supabaseContract.developer_id,
    recruiterId: supabaseContract.recruiter_id,
    createdBy: supabaseContract.created_by,
    createdAt: new Date(supabaseContract.created_at),
  };
};

export const convertSupabaseClient = (supabaseClient: Database['public']['Tables']['clients']['Row']) => {
  return {
    id: supabaseClient.id,
    name: supabaseClient.name,
    email: supabaseClient.email,
    phone: supabaseClient.phone,
    company: supabaseClient.company,
    position: supabaseClient.position,
    notes: supabaseClient.notes,
    status: supabaseClient.status,
    createdBy: supabaseClient.created_by,
    assignedTo: supabaseClient.assigned_to,
    createdAt: new Date(supabaseClient.created_at),
    lastContact: supabaseClient.last_contact ? new Date(supabaseClient.last_contact) : undefined,
  };
};

export const convertSupabaseConsultant = (supabaseConsultant: Database['public']['Tables']['consultants']['Row']) => {
  return {
    id: supabaseConsultant.id,
    name: supabaseConsultant.name,
    email: supabaseConsultant.email,
    phone: supabaseConsultant.phone,
    skills: supabaseConsultant.skills,
    experience: supabaseConsultant.experience,
    availability: supabaseConsultant.availability,
    dailyRate: supabaseConsultant.daily_rate,
    notes: supabaseConsultant.notes,
    createdBy: supabaseConsultant.created_by,
    assignedTo: supabaseConsultant.assigned_to,
    createdAt: new Date(supabaseConsultant.created_at),
    lastContact: supabaseConsultant.last_contact ? new Date(supabaseConsultant.last_contact) : undefined,
  };
};

export const convertSupabaseDeal = (supabaseDeal: Database['public']['Tables']['deals']['Row']) => {
  return {
    id: supabaseDeal.id,
    title: supabaseDeal.title,
    clientId: supabaseDeal.client_id,
    clientName: supabaseDeal.client_name,
    consultantId: supabaseDeal.consultant_id,
    consultantName: supabaseDeal.consultant_name,
    value: supabaseDeal.value,
    dailyMargin: supabaseDeal.daily_margin,
    status: supabaseDeal.status,
    probability: supabaseDeal.probability,
    expectedCloseDate: new Date(supabaseDeal.expected_close_date),
    notes: supabaseDeal.notes,
    createdBy: supabaseDeal.created_by,
    assignedTo: supabaseDeal.assigned_to,
    createdAt: new Date(supabaseDeal.created_at),
    updatedAt: new Date(supabaseDeal.updated_at),
  };
};