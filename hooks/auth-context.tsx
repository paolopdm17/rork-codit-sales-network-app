import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { User, UserRole, CareerLevel } from '@/types';
import { SupabaseService } from '@/hooks/supabase-service';

// Utility function to safely parse JSON
const safeJSONParse = (jsonString: string): any | null => {
  try {
    // Additional validation before parsing
    const trimmed = jsonString.trim();
    if (!trimmed || trimmed.length === 0) {
      console.warn('Empty JSON string provided to safeJSONParse');
      return null;
    }
    
    // Check for basic JSON structure
    if (!((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']')))) {
      console.warn('Invalid JSON structure in safeJSONParse:', trimmed.substring(0, 50));
      return null;
    }
    
    // Check for common corruption patterns
    if (trimmed.includes('object Object') || 
        trimmed.startsWith('object') || 
        trimmed.includes('undefined') ||
        trimmed.includes('NaN') ||
        /^[a-zA-Z]/.test(trimmed)) { // Starts with a letter (not a valid JSON start)
      console.warn('Detected corrupted JSON pattern in safeJSONParse:', trimmed.substring(0, 50));
      return null;
    }
    
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn('JSON parse error in safeJSONParse:', error, 'Data:', jsonString.substring(0, 100));
    return null;
  }
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (updatedUser: User) => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          try {
            // More robust JSON validation
            const trimmedData = userData.trim();
            if (trimmedData && trimmedData.length > 0 && trimmedData.startsWith('{') && trimmedData.endsWith('}')) {
              // Additional check: ensure it's valid JSON by attempting to parse
              const parsed = safeJSONParse(trimmedData);
              if (parsed && typeof parsed === 'object' && 
                  typeof parsed.id === 'string' && 
                  typeof parsed.email === 'string' && 
                  typeof parsed.name === 'string' &&
                  typeof parsed.role === 'string') {
                setUser(parsed);
              } else {
                console.error('Parsed user data is invalid (missing required fields), clearing corrupted data');
                console.error('Invalid user data preview:', JSON.stringify(parsed).substring(0, 100));
                await AsyncStorage.removeItem('user');
                setUser(null);
              }
            } else {
              console.error('Invalid JSON format in user data (does not start with {), clearing corrupted data');
              console.error('Corrupted user data preview:', trimmedData.substring(0, 100));
              await AsyncStorage.removeItem('user');
              setUser(null);
            }
          } catch (parseError) {
            console.error('Error parsing user data, clearing corrupted data:', parseError);
            console.error('Corrupted user data preview:', userData.substring(0, 100));
            console.error('Full corrupted user data:', userData);
            await AsyncStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Method to manually update user data (called from data context when needed)
  const updateUserData = async (updatedUser: User) => {
    console.log('Updating user data in auth context:', updatedUser);
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt for:', email);
      
      // First try to get users from Supabase
      let existingUsers: User[] = [];
      try {
        existingUsers = await SupabaseService.getUsers();
        console.log('Loaded users from Supabase:', existingUsers.length);
      } catch (supabaseError) {
        console.warn('Failed to load from Supabase, falling back to local storage:', supabaseError);
        
        // Fallback to AsyncStorage if Supabase fails
        const usersData = await AsyncStorage.getItem('users');
        if (usersData) {
          try {
            const trimmedData = usersData.trim();
            if (trimmedData && trimmedData.length > 0 && 
                ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || 
                 (trimmedData.startsWith('[') && trimmedData.endsWith(']')))) {
              const parsed = safeJSONParse(trimmedData);
              if (Array.isArray(parsed)) {
                const isValidUserArray = parsed.every(item => 
                  item && typeof item === 'object' && 
                  typeof item.id === 'string' && 
                  typeof item.email === 'string' && 
                  typeof item.name === 'string'
                );
                if (isValidUserArray) {
                  existingUsers = parsed;
                }
              }
            }
          } catch (parseError) {
            console.error('Error parsing local users data:', parseError);
          }
        }
      }
      
      // Try to find existing user by email
      let mockUser = existingUsers.find((u: User) => u.email === email);
      
      if (mockUser) {
        console.log('Found existing user with level:', mockUser.level);
      } else {
        // Create new user based on email patterns
        const isAdminUser = email.toLowerCase().includes('admin') || 
                           email.toLowerCase().includes('paolo.dimicco') ||
                           (email.toLowerCase().includes('paolo') && email.toLowerCase().includes('micco'));
        const isMasterUser = email.toLowerCase().includes('master') || 
                            email.toLowerCase().includes('dashboard.master') ||
                            email === 'amministrazione@codit.it';
        
        console.log('Creating new user for email:', email);
        console.log('Is admin user?', isAdminUser);
        console.log('Is master user?', isMasterUser);
        
        let userRole: UserRole = 'commercial';
        let userLevel: CareerLevel = 'junior';
        
        if (isMasterUser) {
          userRole = 'master';
          userLevel = 'managing_director';
        } else if (isAdminUser) {
          userRole = 'admin';
          userLevel = 'managing_director';
        }
        
        // Create default users for demo emails
        if (email === 'admin@codit.com') {
          mockUser = {
            id: '1',
            email,
            name: 'Mario Rossi',
            role: 'admin',
            status: 'approved',
            level: 'managing_director',
            createdAt: new Date(),
          };
        } else if (email === 'leader@codit.com') {
          mockUser = {
            id: '2',
            email,
            name: 'Luca Bianchi',
            role: 'commercial',
            status: 'approved',
            level: 'team_leader',
            adminId: '1',
            createdAt: new Date(),
          };
          console.log('👤 Creating Luca Bianchi as COMMERCIAL:', mockUser);
        } else if (email === 'senior@codit.com') {
          mockUser = {
            id: '3',
            email,
            name: 'Anna Verdi',
            role: 'commercial',
            status: 'approved',
            level: 'senior',
            adminId: '1',
            leaderId: '2',
            createdAt: new Date(),
          };
        } else if (email === 'amministrazione@codit.it') {
          mockUser = {
            id: 'master-1',
            email,
            name: 'Amministrazione Codit',
            role: 'master',
            status: 'approved',
            level: 'managing_director',
            createdAt: new Date(),
          };
        } else {
          mockUser = {
            id: Date.now().toString(),
            email,
            name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            role: userRole,
            status: 'approved',
            level: userLevel,
            createdAt: new Date(),
          };
        }
        
        // Try to save new user to Supabase
        try {
          const createdUser = await SupabaseService.createUser(mockUser);
          mockUser = createdUser;
          console.log('Created new user in Supabase:', mockUser);
        } catch (supabaseError) {
          console.warn('Failed to create user in Supabase, using local data:', supabaseError);
          // Save to local storage as fallback
          const localUsers = [...existingUsers, mockUser];
          await AsyncStorage.setItem('users', JSON.stringify(localUsers));
        }
      }
      
      console.log('Logging in user:', mockUser);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      // Set user immediately to prevent UI blocking
      setUser(mockUser);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Mock registration - in production, this would call an API
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role: 'commercial',
        status: 'pending',
        level: 'junior',
        createdAt: new Date(),
      };
      
      // In a real app, this would be saved to a backend
      await AsyncStorage.setItem('pendingUser', JSON.stringify(newUser));
      throw new Error('La tua registrazione è in attesa di approvazione');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && user.status === 'approved',
    login,
    register,
    logout,
    updateUserData,
  };
});