export type UserRole = 'admin' | 'commercial' | 'master';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export type CareerLevel = 
  | 'junior'
  | 'senior'
  | 'team_leader'
  | 'partner'
  | 'executive_director'
  | 'managing_director';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  level: CareerLevel;
  adminId?: string;
  leaderId?: string;
  teamLeader?: string; // Alias for leaderId for compatibility
  adminRef?: string; // Alias for adminId for compatibility
  createdAt: Date;
  approvedAt?: Date;
}

export interface Contract {
  id: string;
  name: string;
  date: Date;
  grossMargin: number;
  monthlyMargin: number;
  duration: number;
  developerId: string;
  recruiterId?: string;
  createdBy: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  level: CareerLevel;
  personalRevenue: number;
  groupRevenue: number;
  commission: number;
}

export interface LevelRequirements {
  level: CareerLevel;
  personalRevenue: number;
  groupRevenue?: number;
  requiredMembers?: {
    level: CareerLevel;
    count: number;
  };
  isOrCondition?: boolean; // If true, personal OR group revenue requirement (not both)
}

export interface DashboardMetrics {
  currentLevel: CareerLevel;
  nextLevel?: CareerLevel;
  personalRevenue: number;
  groupRevenue: number;
  teamRevenue: number;
  personalCommission: number;
  teamCommission: number;
  totalCommission: number;
  progressToNextLevel: number;
  teamMembers: TeamMember[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'prospect';
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  lastContact?: Date;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: 'Junior (1-2 anni)' | 'Mid-level (3-4 anni)' | 'Senior (5+ anni)' | 'Lead/Architect (8+ anni)';
  availability: 'available' | 'busy' | 'unavailable';
  dailyRate?: number;
  notes?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  lastContact?: Date;
}

export interface Deal {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  consultantId?: string;
  consultantName?: string;
  value: number;
  dailyMargin?: number;
  status: 'cv_sent' | 'initial_interview' | 'final_interview' | 'feedback_pending' | 'closed_won' | 'closed_lost';
  probability: number; // 0-100
  expectedCloseDate: Date;
  notes?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}