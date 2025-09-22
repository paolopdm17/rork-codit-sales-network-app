import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { User, UserRole, CareerLevel } from '@/types';

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
      // Mock login - in production, this would call an API
      // Check existing users first
      const usersData = await AsyncStorage.getItem('users');
      let existingUsers: User[] = [];
      if (usersData) {
        try {
          // Check if data is valid JSON before parsing
          const trimmedData = usersData.trim();
          if (trimmedData && trimmedData.length > 0 && 
              ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || 
               (trimmedData.startsWith('[') && trimmedData.endsWith(']')))) {
            const parsed = safeJSONParse(trimmedData);
            if (Array.isArray(parsed)) {
              // Validate that each item in the array has required user properties
              const isValidUserArray = parsed.every(item => 
                item && typeof item === 'object' && 
                typeof item.id === 'string' && 
                typeof item.email === 'string' && 
                typeof item.name === 'string'
              );
              if (isValidUserArray) {
                existingUsers = parsed;
              } else {
                console.error('User array contains invalid items during login, using empty array');
                existingUsers = [];
                await AsyncStorage.setItem('users', JSON.stringify([]));
              }
            } else {
              console.error('Parsed data is not an array during login, using empty array');
              existingUsers = [];
              await AsyncStorage.setItem('users', JSON.stringify([]));
            }
          } else {
            console.error('Invalid JSON format in users data during login, using empty array');
            console.error('Corrupted data preview:', trimmedData.substring(0, 100));
            existingUsers = [];
            await AsyncStorage.setItem('users', JSON.stringify([]));
          }
        } catch (parseError) {
          console.error('Error parsing users data during login, using empty array:', parseError);
          console.error('Corrupted data preview:', usersData.substring(0, 100));
          console.error('Full corrupted data:', usersData);
          existingUsers = [];
          await AsyncStorage.setItem('users', JSON.stringify([]));
        }
      }
      
      console.log('Login attempt for:', email);
      console.log('Existing users in storage:', existingUsers.map((u: User) => ({ id: u.id, email: u.email, name: u.name, level: u.level })));
      
      // Try to find existing user by email
      let mockUser = existingUsers.find((u: User) => u.email === email);
      
      // Special debug for Antonio Baudo
      if (email === 'antonio.baudo@codit.com') {
        console.log('=== ANTONIO BAUDO LOGIN DEBUG ===');
        console.log('Found existing user:', mockUser);
        console.log('User level from database:', mockUser?.level);
        console.log('All existing users:', existingUsers);
      }
      
      if (mockUser) {
        // User exists in the users list, use their data INCLUDING THEIR CURRENT LEVEL
        console.log('Found existing user with level:', mockUser.level);
        // Make sure we use the level from the database, not a hardcoded one
      } else {
        // Create new user based on email
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
        } else if (email === 'antonio.baudo@codit.com') {
          // Check if Antonio already exists in the database with an updated level
          const existingAntonio = existingUsers.find((u: User) => u.id === '4');
          if (existingAntonio) {
            mockUser = existingAntonio;
            console.log('Using existing Antonio with level:', existingAntonio.level);
          } else {
            mockUser = {
              id: '4',
              email,
              name: 'Antonio Baudo',
              role: 'commercial',
              status: 'approved',
              level: 'junior',
              adminId: '1',
              leaderId: '2',
              createdAt: new Date(),
            };
          }
        } else {
          // Default user for other emails
          // Check if this user should be an admin or master based on email or name patterns
          const isAdminUser = email.toLowerCase().includes('admin') || 
                             email.toLowerCase().includes('paolo.dimicco') ||
                             (email.toLowerCase().includes('paolo') && email.toLowerCase().includes('micco'));
          const isMasterUser = email.toLowerCase().includes('master') || 
                              email.toLowerCase().includes('dashboard.master');
          
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
          
          mockUser = {
            id: Date.now().toString(),
            email,
            name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            role: userRole,
            status: 'approved',
            level: userLevel,
            createdAt: new Date(),
          };
          
          console.log('Created new user:', mockUser);
        }
      }
      

      
      // Special handling for Paolo Di Micco and any admin users - ensure they're always admin
      if (mockUser.email.toLowerCase().includes('paolo') && mockUser.email.toLowerCase().includes('micco')) {
        mockUser.role = 'admin';
        mockUser.level = 'managing_director';
        console.log('Paolo Di Micco detected - setting as admin with managing_director level');
        
        // Update the user in the database immediately
        let updatedUsers = existingUsers.map(u => u.id === mockUser.id ? mockUser : u);
        if (!existingUsers.find(u => u.id === mockUser.id)) {
          updatedUsers.push(mockUser);
        }
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log('Updated Paolo Di Micco in users database');
        
        // Also update the existingUsers array for subsequent checks
        existingUsers = updatedUsers;
      }
      
      // General admin role enforcement for any user with admin email patterns
      if (mockUser.email.toLowerCase().includes('admin') || 
          mockUser.email.toLowerCase().includes('paolo.dimicco') ||
          mockUser.email.toLowerCase().includes('paolo') && mockUser.email.toLowerCase().includes('micco')) {
        mockUser.role = 'admin';
        mockUser.level = 'managing_director';
        console.log('Admin email pattern detected - setting as admin with managing_director level');
        
        // Update the user in the database immediately
        let updatedUsers = existingUsers.map(u => u.id === mockUser.id ? mockUser : u);
        if (!existingUsers.find(u => u.id === mockUser.id)) {
          updatedUsers.push(mockUser);
        }
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log('Updated admin user in users database');
        
        // Also update the existingUsers array for subsequent checks
        existingUsers = updatedUsers;
      }
      
      // Master role enforcement for any user with master email patterns
      if (mockUser.email.toLowerCase().includes('master') || 
          mockUser.email.toLowerCase().includes('dashboard.master')) {
        mockUser.role = 'master';
        mockUser.level = 'managing_director';
        console.log('Master email pattern detected - setting as master with managing_director level');
        
        // Update the user in the database immediately
        let updatedUsers = existingUsers.map(u => u.id === mockUser.id ? mockUser : u);
        if (!existingUsers.find(u => u.id === mockUser.id)) {
          updatedUsers.push(mockUser);
        }
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log('Updated master user in users database');
        
        // Also update the existingUsers array for subsequent checks
        existingUsers = updatedUsers;
      }
      
      // General admin role enforcement
      if (mockUser.role === 'admin' && mockUser.level !== 'managing_director') {
        mockUser.level = 'managing_director';
        console.log('Admin role detected - ensuring managing_director level');
        
        // Update the user in the database immediately
        let updatedUsers = existingUsers.map(u => u.id === mockUser.id ? mockUser : u);
        if (!existingUsers.find(u => u.id === mockUser.id)) {
          updatedUsers.push(mockUser);
        }
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log('Updated admin user in users database');
        
        // Also update the existingUsers array for subsequent checks
        existingUsers = updatedUsers;
      }
      
      // General master role enforcement
      if (mockUser.role === 'master' && mockUser.level !== 'managing_director') {
        mockUser.level = 'managing_director';
        console.log('Master role detected - ensuring managing_director level');
        
        // Update the user in the database immediately
        let updatedUsers = existingUsers.map(u => u.id === mockUser.id ? mockUser : u);
        if (!existingUsers.find(u => u.id === mockUser.id)) {
          updatedUsers.push(mockUser);
        }
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log('Updated master user in users database');
        
        // Also update the existingUsers array for subsequent checks
        existingUsers = updatedUsers;
      }
      
      console.log('Logging in user:', mockUser);
      console.log('User level at login:', mockUser.level);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      // Special handling for Antonio Baudo to ensure fresh data
      if (mockUser.email === 'antonio.baudo@codit.com') {
        console.log('Antonio Baudo logged in with level:', mockUser.level);
      }
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