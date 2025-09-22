import { CareerLevel, LevelRequirements } from '@/types';

export const CAREER_LEVELS: Record<CareerLevel, string> = {
  junior: 'Junior Account',
  senior: 'Senior Account',
  team_leader: 'Team Leader',
  partner: 'Partner',
  executive_director: 'Executive Director',
  managing_director: 'Managing Director',
};

export const LEVEL_REQUIREMENTS: LevelRequirements[] = [
  {
    level: 'junior',
    personalRevenue: 5000,
  },
  {
    level: 'senior',
    personalRevenue: 15000,
    groupRevenue: 50000,
    requiredMembers: { level: 'junior', count: 1 },
    isOrCondition: true, // Personal OR Group revenue requirement
  },
  {
    level: 'team_leader',
    personalRevenue: 30000,
    groupRevenue: 150000,
    requiredMembers: { level: 'senior', count: 2 },
    isOrCondition: true, // Personal OR Group revenue requirement
  },
  {
    level: 'partner',
    personalRevenue: 50000,
    groupRevenue: 500000,
    requiredMembers: { level: 'team_leader', count: 3 },
    isOrCondition: true, // Personal OR Group revenue requirement
  },
  {
    level: 'executive_director',
    personalRevenue: 0,
    groupRevenue: 1500000,
    requiredMembers: { level: 'partner', count: 2 },
  },
  {
    level: 'managing_director',
    personalRevenue: 0,
    groupRevenue: 5000000,
    requiredMembers: { level: 'executive_director', count: 3 },
  },
];

export const COMMISSION_RATES: Record<CareerLevel, number> = {
  junior: 0.20,
  senior: 0.30,
  team_leader: 0.40,
  partner: 0.50,
  executive_director: 0.55,
  managing_director: 0.60,
};

export const LEVEL_COLORS: Record<CareerLevel, string> = {
  junior: '#10B981',
  senior: '#3B82F6',
  team_leader: '#8B5CF6',
  partner: '#F59E0B',
  executive_director: '#EF4444',
  managing_director: '#EC4899',
};