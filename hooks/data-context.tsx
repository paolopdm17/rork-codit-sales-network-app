import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Contract, User, DashboardMetrics, TeamMember, CareerLevel, Client, Consultant, Deal } from '@/types';
import { COMMISSION_RATES, LEVEL_REQUIREMENTS } from '@/constants/levels';
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

interface DataState {
  contracts: Contract[];
  users: User[];
  pendingUsers: User[];
  visibleContracts: Contract[];
  visibleUsers: User[];
  clients: Client[];
  consultants: Consultant[];
  deals: Deal[];
  visibleClients: Client[];
  visibleConsultants: Consultant[];
  visibleDeals: Deal[];
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => Promise<void>;
  updateContract: (contractId: string, contract: Contract) => Promise<void>;
  deleteContract: (contractId: string) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'status' | 'approvedAt'>) => Promise<User>;
  updateUser: (userId: string, userData: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  approveUser: (userId: string, adminId: string, leaderId?: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (clientId: string, client: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  addConsultant: (consultant: Omit<Consultant, 'id' | 'createdAt'>) => Promise<void>;
  updateConsultant: (consultantId: string, consultant: Consultant) => Promise<void>;
  deleteConsultant: (consultantId: string) => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDeal: (dealId: string, deal: Deal) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  refreshData: (currentUser?: User | null) => Promise<void>;
  resetData: () => Promise<void>;
  clearCorruptedData: () => Promise<void>;
  forceDataRefresh: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
}

export const [DataProvider, useData] = createContextHook<DataState>(() => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [visibleContracts, setVisibleContracts] = useState<Contract[]>([]);
  const [visibleUsers, setVisibleUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [visibleClients, setVisibleClients] = useState<Client[]>([]);
  const [visibleConsultants, setVisibleConsultants] = useState<Consultant[]>([]);
  const [visibleDeals, setVisibleDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');

  const getConnectedUserIds = (userId: string, allUsers: User[]): string[] => {
    const connectedIds = new Set<string>();
    const visited = new Set<string>();
    
    const addUserAndTeam = (currentUserId: string) => {
      if (visited.has(currentUserId)) return;
      visited.add(currentUserId);
      
      connectedIds.add(currentUserId);
      
      // Find all users where current user is the leader (direct team members)
      const directTeamMembers = allUsers.filter(u => u.leaderId === currentUserId && u.status === 'approved');
      directTeamMembers.forEach(member => {
        addUserAndTeam(member.id);
      });
    };
    
    addUserAndTeam(userId);
    
    const currentUserFromList = allUsers.find(u => u.id === userId);
    console.log(`Connected user IDs for ${userId} (${currentUserFromList?.name || 'Unknown'}):`, Array.from(connectedIds));
    return Array.from(connectedIds);
  };

  const filterDataForUser = (user: User | null) => {
    if (!user) return;

    console.log('=== FILTERING DATA FOR USER ===');
    console.log('Current user:', { id: user.id, name: user.name, role: user.role });
    console.log('All users:', users.map(u => ({ id: u.id, name: u.name, leaderId: u.leaderId, status: u.status })));
    console.log('All contracts:', contracts.map(c => ({ id: c.id, name: c.name, developerId: c.developerId, recruiterId: c.recruiterId })));
    console.log('All deals:', deals.map(d => ({ id: d.id, title: d.title, createdBy: d.createdBy, assignedTo: d.assignedTo })));

    // Admins and Masters can see everything
    if (user.role === 'admin' || user.role === 'master') {
      console.log('Admin/Master user - showing all data');
      console.log('Setting visible contracts:', contracts.length);
      console.log('Setting visible users:', users.length);
      console.log('Setting visible deals:', deals.length);
      
      // Force immediate update with all approved users for master/admin
      const allApprovedUsers = users.filter(u => u.status === 'approved');
      console.log('All approved users for master/admin:', allApprovedUsers.length, allApprovedUsers.map(u => ({ id: u.id, name: u.name, level: u.level })));
      
      // Special debug for Andrew Ferro visibility
      const andrewFerro = allApprovedUsers.find(u => u.name === 'Andrew Ferro');
      console.log('🔍 ANDREW FERRO VISIBILITY CHECK:', andrewFerro ? 'FOUND' : 'NOT FOUND');
      if (andrewFerro) {
        console.log('Andrew Ferro details:', andrewFerro);
      }
      
      setVisibleContracts([...contracts]); // Create new array to trigger re-render
      setVisibleUsers([...allApprovedUsers]); // Show only approved users
      setVisibleClients([...clients]); // Admin/Master can see all clients
      setVisibleConsultants([...consultants]); // Admin/Master can see all consultants
      setVisibleDeals([...deals]); // Admin/Master can see all deals
      return;
    }

    // For commercials, filter data based on their connections
    const connectedUserIds = getConnectedUserIds(user.id, users);
    console.log('Connected user IDs for', user.name, ':', connectedUserIds);

    // Filter contracts: show contracts where current user or their team members are involved
    const filteredContracts = contracts.filter(contract => {
      const isDeveloper = connectedUserIds.includes(contract.developerId);
      const isRecruiter = contract.recruiterId ? connectedUserIds.includes(contract.recruiterId) : false;
      console.log(`Contract ${contract.id} (${contract.name}): developer=${contract.developerId} (included: ${isDeveloper}), recruiter=${contract.recruiterId} (included: ${isRecruiter})`);
      return isDeveloper || isRecruiter;
    });

    // Filter users: show only connected users (team members)
    const filteredUsers = users.filter(u => {
      const isConnected = connectedUserIds.includes(u.id) && u.status === 'approved';
      console.log(`User ${u.name} (${u.id}): connected=${connectedUserIds.includes(u.id)}, approved=${u.status === 'approved'}, included=${isConnected}`);
      return isConnected;
    });

    console.log('Final filtered contracts:', filteredContracts.length, filteredContracts.map(c => ({ id: c.id, name: c.name })));
    console.log('Final filtered users:', filteredUsers.length, filteredUsers.map(u => u.name));
    
    // Filter CRM data using the same logic
    const filteredClients = clients.filter(client => {
      const isCreatedBy = connectedUserIds.includes(client.createdBy);
      const isAssignedTo = client.assignedTo ? connectedUserIds.includes(client.assignedTo) : false;
      console.log(`Client ${client.id} (${client.name}): createdBy=${client.createdBy} (included: ${connectedUserIds.includes(client.createdBy)}), assignedTo=${client.assignedTo} (included: ${client.assignedTo ? connectedUserIds.includes(client.assignedTo) : false})`);
      return isCreatedBy || isAssignedTo;
    });
    
    const filteredConsultants = consultants.filter(consultant => {
      const isCreatedBy = connectedUserIds.includes(consultant.createdBy);
      const isAssignedTo = consultant.assignedTo ? connectedUserIds.includes(consultant.assignedTo) : false;
      console.log(`Consultant ${consultant.id} (${consultant.name}): createdBy=${consultant.createdBy} (included: ${connectedUserIds.includes(consultant.createdBy)}), assignedTo=${consultant.assignedTo} (included: ${consultant.assignedTo ? connectedUserIds.includes(consultant.assignedTo) : false})`);
      return isCreatedBy || isAssignedTo;
    });
    
    // Filter deals using the same logic - CRITICAL: Apply hierarchical filtering
    const filteredDeals = deals.filter(deal => {
      const isCreatedBy = connectedUserIds.includes(deal.createdBy);
      const isAssignedTo = deal.assignedTo ? connectedUserIds.includes(deal.assignedTo) : false;
      console.log(`Deal ${deal.id} (${deal.title}): createdBy=${deal.createdBy} (included: ${connectedUserIds.includes(deal.createdBy)}), assignedTo=${deal.assignedTo} (included: ${deal.assignedTo ? connectedUserIds.includes(deal.assignedTo) : false})`);
      return isCreatedBy || isAssignedTo;
    });
    
    console.log('Final filtered clients:', filteredClients.length, filteredClients.map(c => ({ id: c.id, name: c.name })));
    console.log('Final filtered consultants:', filteredConsultants.length, filteredConsultants.map(c => ({ id: c.id, name: c.name })));
    console.log('Final filtered deals:', filteredDeals.length, filteredDeals.map(d => ({ id: d.id, title: d.title })));
    console.log('=== END FILTERING ===');

    setVisibleContracts(filteredContracts);
    setVisibleUsers(filteredUsers);
    setVisibleClients(filteredClients);
    setVisibleConsultants(filteredConsultants);
    setVisibleDeals(filteredDeals);
  };

  const loadData = async (user?: User | null) => {
    try {
      setIsLoading(true);
      
      // Test Supabase connection
      const supabaseConnected = await SupabaseService.testConnection();
      setIsOnline(supabaseConnected);
      
      console.log('Supabase connection status:', supabaseConnected ? 'ONLINE' : 'OFFLINE');
      
      // Try to load from Supabase first if online
      if (supabaseConnected) {
        try {
          console.log('Loading data from Supabase...');
          const [supabaseUsers, supabaseContracts, supabaseClients, supabaseConsultants, supabaseDeals] = await Promise.all([
            SupabaseService.getUsers(),
            SupabaseService.getContracts(),
            SupabaseService.getClients(),
            SupabaseService.getConsultants(),
            SupabaseService.getDeals()
          ]);
          
          console.log('Loaded from Supabase:', {
            users: supabaseUsers.length,
            contracts: supabaseContracts.length,
            clients: supabaseClients.length,
            consultants: supabaseConsultants.length,
            deals: supabaseDeals.length
          });
          
          // Update local storage with Supabase data
          await AsyncStorage.setItem('contracts', JSON.stringify(supabaseContracts));
          await AsyncStorage.setItem('users', JSON.stringify(supabaseUsers));
          await AsyncStorage.setItem('clients', JSON.stringify(supabaseClients));
          await AsyncStorage.setItem('consultants', JSON.stringify(supabaseConsultants));
          await AsyncStorage.setItem('deals', JSON.stringify(supabaseDeals));
          
          // Set state with Supabase data
          setContracts(supabaseContracts);
          setUsers(supabaseUsers);
          setClients(supabaseClients);
          setConsultants(supabaseConsultants);
          setDeals(supabaseDeals);
          
          // If no data in Supabase, sync local data to Supabase
          if (supabaseUsers.length === 0 && supabaseContracts.length === 0) {
            console.log('No data in Supabase, checking local data...');
            const localContracts = await AsyncStorage.getItem('contracts');
            const localUsers = await AsyncStorage.getItem('users');
            
            if (localContracts || localUsers) {
              console.log('Found local data, syncing to Supabase...');
              await syncLocalToSupabase();
              // Reload after sync
              return loadData(user);
            } else {
              console.log('No local data, generating mock data...');
              const mockUsers = generateMockUsers();
              const mockContracts = generateMockContracts();
              const mockDeals = generateMockDeals();
              
              // Save to both local and Supabase
              await Promise.all([
                AsyncStorage.setItem('contracts', JSON.stringify(mockContracts)),
                AsyncStorage.setItem('users', JSON.stringify(mockUsers)),
                AsyncStorage.setItem('deals', JSON.stringify(mockDeals)),
                SupabaseService.syncLocalDataToSupabase(mockUsers, mockContracts, [], [], mockDeals)
              ]);
              
              setContracts(mockContracts);
              setUsers(mockUsers);
              setDeals(mockDeals);
            }
          }
          
          setSyncStatus('success');
        } catch (supabaseError) {
          console.error('Error loading from Supabase, falling back to local storage:', supabaseError);
          setSyncStatus('error');
          setIsOnline(false);
          // Fall back to local storage loading
          await loadFromLocalStorage();
        }
      } else {
        console.log('Supabase offline, loading from local storage...');
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFromLocalStorage = async () => {
    try {
      // Load contracts from local storage
      const contractsData = await AsyncStorage.getItem('contracts');
      let loadedContracts: Contract[];
      if (!contractsData) {
        // First time - save mock data
        loadedContracts = generateMockContracts();
        await AsyncStorage.setItem('contracts', JSON.stringify(loadedContracts));
      } else {
        try {
          // More robust JSON validation with better error handling
          const trimmedData = contractsData.trim();
          if (trimmedData && trimmedData.length > 0 && 
              ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || 
               (trimmedData.startsWith('[') && trimmedData.endsWith(']')))) {
            // Additional check: ensure it's valid JSON by attempting to parse
            const parsed = safeJSONParse(trimmedData);
            if (Array.isArray(parsed)) {
              // Validate that each item in the array has required contract properties
              const isValidContractArray = parsed.every(item => 
                item && typeof item === 'object' && 
                typeof item.id === 'string' && 
                typeof item.name === 'string'
              );
              if (isValidContractArray) {
                loadedContracts = parsed;
              } else {
                console.warn('Contract array contains invalid items, regenerating mock data');
                throw new Error('Contract array contains invalid items');
              }
            } else {
              console.warn('Parsed contracts data is not an array, regenerating mock data');
              throw new Error('Parsed data is not an array');
            }
          } else {
            console.warn('Invalid JSON format in contracts data, regenerating mock data');
            console.warn('Corrupted data preview:', contractsData.substring(0, 100));
            throw new Error('Invalid JSON format');
          }
        } catch (error) {
          console.warn('Error parsing contracts data, using fresh mock data:', (error as Error).message);
          if (contractsData.length > 100) {
            console.warn('Corrupted data preview:', contractsData.substring(0, 100));
          } else {
            console.warn('Full corrupted data:', contractsData);
          }
          loadedContracts = generateMockContracts();
          await AsyncStorage.setItem('contracts', JSON.stringify(loadedContracts));
        }
      }
      console.log('=== LOADED CONTRACTS ===');
      console.log('Total contracts:', loadedContracts.length);
      setContracts(loadedContracts);
      
      // Load users
      const usersData = await AsyncStorage.getItem('users');
      let loadedUsers: User[];
      if (!usersData) {
        // First time - save mock data
        loadedUsers = generateMockUsers();
        await AsyncStorage.setItem('users', JSON.stringify(loadedUsers));
      } else {
        try {
          // More robust JSON validation with better error handling
          const trimmedData = usersData.trim();
          if (trimmedData && trimmedData.length > 0 && 
              ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || 
               (trimmedData.startsWith('[') && trimmedData.endsWith(']')))) {
            // Additional check: ensure it's valid JSON by attempting to parse
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
                loadedUsers = parsed;
                console.log('✅ Successfully loaded users from storage:', loadedUsers.length);
                console.log('Andrew Ferro check in loaded users:', loadedUsers.find(u => u.name === 'Andrew Ferro') ? '✅ FOUND' : '❌ NOT FOUND');
              } else {
                console.warn('User array contains invalid items, regenerating mock data');
                throw new Error('User array contains invalid items');
              }
            } else {
              console.warn('Parsed users data is not an array, regenerating mock data');
              throw new Error('Parsed data is not an array');
            }
          } else {
            console.warn('Invalid JSON format in users data, regenerating mock data');
            console.warn('Corrupted data preview:', usersData.substring(0, 100));
            throw new Error('Invalid JSON format');
          }
        } catch (error) {
          console.warn('Error parsing users data, using fresh mock data:', (error as Error).message);
          if (usersData.length > 100) {
            console.warn('Corrupted data preview:', usersData.substring(0, 100));
          } else {
            console.warn('Full corrupted data:', usersData);
          }
          loadedUsers = generateMockUsers();
          console.log('🔄 Generated fresh mock users:', loadedUsers.length);
          console.log('Andrew Ferro in fresh mock users:', loadedUsers.find(u => u.name === 'Andrew Ferro') ? '✅ FOUND' : '❌ NOT FOUND');
          await AsyncStorage.setItem('users', JSON.stringify(loadedUsers));
        }
      }
      console.log('Loaded users:', loadedUsers);
      console.log('🔍 ANDREW FERRO CHECK IN LOADED USERS:', loadedUsers.find(u => u.name === 'Andrew Ferro') ? 'FOUND' : 'NOT FOUND');
      setUsers(loadedUsers);
      
      // Load pending users
      const pendingData = await AsyncStorage.getItem('pendingUsers');
      let loadedPending: User[] = [];
      if (pendingData) {
        try {
          // More robust JSON validation
          const trimmedData = pendingData.trim();
          if (trimmedData && trimmedData.length > 0 && 
              ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || 
               (trimmedData.startsWith('[') && trimmedData.endsWith(']')))) {
            // Additional check: ensure it's valid JSON by attempting to parse
            const parsed = safeJSONParse(trimmedData);
            if (Array.isArray(parsed)) {
              // Validate that each item in the array has required user properties (if any)
              const isValidPendingArray = parsed.length === 0 || parsed.every(item => 
                item && typeof item === 'object' && 
                typeof item.id === 'string' && 
                typeof item.email === 'string'
              );
              if (isValidPendingArray) {
                loadedPending = parsed;
              } else {
                console.error('Pending user array contains invalid items, using empty array');
                loadedPending = [];
                await AsyncStorage.setItem('pendingUsers', JSON.stringify([]));
              }
            } else {
              console.error('Parsed pending data is not an array, using empty array');
              loadedPending = [];
              await AsyncStorage.setItem('pendingUsers', JSON.stringify([]));
            }
          } else {
            console.error('Invalid JSON format in pending users data (does not start with { or [), using empty array');
            console.error('Corrupted data preview:', pendingData.substring(0, 100));
            loadedPending = [];
            await AsyncStorage.setItem('pendingUsers', JSON.stringify([]));
          }
        } catch (error) {
          console.error('Error parsing pending users data, using empty array:', error);
          console.error('Corrupted data preview:', pendingData.substring(0, 100));
          console.error('Full corrupted data:', pendingData);
          loadedPending = [];
          await AsyncStorage.setItem('pendingUsers', JSON.stringify([]));
        }
      }
      setPendingUsers(loadedPending);
      
      // Load CRM data
      const clientsData = await AsyncStorage.getItem('clients');
      let loadedClients: Client[] = [];
      if (clientsData) {
        try {
          const parsed = safeJSONParse(clientsData);
          if (Array.isArray(parsed)) {
            loadedClients = parsed;
          }
        } catch (error) {
          console.warn('Error parsing clients data:', error);
        }
      }
      setClients(loadedClients);
      
      const consultantsData = await AsyncStorage.getItem('consultants');
      let loadedConsultants: Consultant[] = [];
      if (consultantsData) {
        try {
          const parsed = safeJSONParse(consultantsData);
          if (Array.isArray(parsed)) {
            loadedConsultants = parsed;
          }
        } catch (error) {
          console.warn('Error parsing consultants data:', error);
        }
      }
      setConsultants(loadedConsultants);
      
      // Load deals
      const dealsData = await AsyncStorage.getItem('deals');
      let loadedDeals: Deal[] = [];
      if (!dealsData) {
        // First time - save mock data
        loadedDeals = generateMockDeals();
        await AsyncStorage.setItem('deals', JSON.stringify(loadedDeals));
      } else {
        try {
          const parsed = safeJSONParse(dealsData);
          if (Array.isArray(parsed)) {
            loadedDeals = parsed;
          }
        } catch (error) {
          console.warn('Error parsing deals data:', error);
          loadedDeals = generateMockDeals();
          await AsyncStorage.setItem('deals', JSON.stringify(loadedDeals));
        }
      }
      setDeals(loadedDeals);
      
      // Calculate metrics for current user
      if (currentUser) {
        console.log('Calculating metrics for user:', currentUser.id, currentUser.name);
        
        // Ensure the current user exists in the users list
        let userExistsInList = loadedUsers.find(u => u.id === currentUser.id);
        let finalUsersList = loadedUsers;
        
        if (!userExistsInList) {
          console.log('Current user not found in users list, adding them...');
          finalUsersList = [...loadedUsers, currentUser];
          setUsers(finalUsersList);
          await AsyncStorage.setItem('users', JSON.stringify(finalUsersList));
        } else {
          // Check if existing user needs role/level update (e.g., Paolo Di Micco should be admin)
          let needsUpdate = false;
          const updatedUser = { ...userExistsInList };
          
          // Special handling for Paolo Di Micco and any admin users - ensure they're always admin
          if (currentUser.email.toLowerCase().includes('paolo') && currentUser.email.toLowerCase().includes('micco')) {
            if (updatedUser.role !== 'admin' || updatedUser.level !== 'managing_director') {
              updatedUser.role = 'admin';
              updatedUser.level = 'managing_director';
              needsUpdate = true;
              console.log('Updating Paolo Di Micco to admin status in database');
            }
          }
          
          // General admin email pattern check
          if (currentUser.email.toLowerCase().includes('admin') || 
              currentUser.email.toLowerCase().includes('paolo.dimicco') ||
              (currentUser.email.toLowerCase().includes('paolo') && currentUser.email.toLowerCase().includes('micco'))) {
            if (updatedUser.role !== 'admin' || updatedUser.level !== 'managing_director') {
              updatedUser.role = 'admin';
              updatedUser.level = 'managing_director';
              needsUpdate = true;
              console.log('Updating admin user to admin status in database');
            }
          }
          
          // Update user in database if needed
          if (needsUpdate) {
            finalUsersList = loadedUsers.map(u => u.id === currentUser.id ? updatedUser : u);
            setUsers(finalUsersList);
            await AsyncStorage.setItem('users', JSON.stringify(finalUsersList));
            
            // Also update the auth user
            const updatedAuthUser = { ...currentUser, role: updatedUser.role, level: updatedUser.level };
            await AsyncStorage.setItem('user', JSON.stringify(updatedAuthUser));
            console.log('Updated auth user with new role/level');
          }
        }
        
        // Calculate metrics with the final users list
        const userMetrics = calculateMetrics(currentUser.id, loadedContracts, finalUsersList, currentUser);
        console.log('Calculated metrics:', userMetrics);
        setMetrics(userMetrics);
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
  };
  
  // Function to sync local data to Supabase
  const syncLocalToSupabase = async () => {
    try {
      setSyncStatus('syncing');
      console.log('Syncing local data to Supabase...');
      
      // Get all local data
      const [localContracts, localUsers, localClients, localConsultants, localDeals] = await Promise.all([
        AsyncStorage.getItem('contracts'),
        AsyncStorage.getItem('users'),
        AsyncStorage.getItem('clients'),
        AsyncStorage.getItem('consultants'),
        AsyncStorage.getItem('deals')
      ]);
      
      const contractsToSync: Contract[] = localContracts ? safeJSONParse(localContracts) || [] : [];
      const usersToSync: User[] = localUsers ? safeJSONParse(localUsers) || [] : [];
      const clientsToSync: Client[] = localClients ? safeJSONParse(localClients) || [] : [];
      const consultantsToSync: Consultant[] = localConsultants ? safeJSONParse(localConsultants) || [] : [];
      const dealsToSync: Deal[] = localDeals ? safeJSONParse(localDeals) || [] : [];
      
      console.log('Data to sync:', {
        contracts: contractsToSync.length,
        users: usersToSync.length,
        clients: clientsToSync.length,
        consultants: consultantsToSync.length,
        deals: dealsToSync.length
      });
      
      // Sync to Supabase
      await SupabaseService.syncLocalDataToSupabase(
        usersToSync,
        contractsToSync,
        clientsToSync,
        consultantsToSync,
        dealsToSync
      );
      
      console.log('Local data synced to Supabase successfully');
      setSyncStatus('success');
    } catch (error) {
      console.error('Error syncing local data to Supabase:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  const calculateMetrics = (userId: string, contracts: Contract[], users: User[], authUser?: User | null): DashboardMetrics => {
    console.log('=== CALCULATING METRICS ===');
    console.log('User ID:', userId);
    console.log('Total contracts to process:', contracts.length);
    
    // Debug for specific users having issues
    const currentUserFromList = users.find(u => u.id === userId);
    if (currentUserFromList && (currentUserFromList.name.includes('Andrew') || currentUserFromList.name.includes('Ferro') || currentUserFromList.name.includes('Antonio') || currentUserFromList.name.includes('Baudo'))) {
      console.log(`=== DEBUGGING ${currentUserFromList.name.toUpperCase()} ===`);
      console.log(`${currentUserFromList.name} user ID:`, currentUserFromList.id);
      console.log('All contracts:', contracts.map(c => ({ id: c.id, name: c.name, developerId: c.developerId, recruiterId: c.recruiterId, monthlyMargin: c.monthlyMargin })));
      console.log(`${currentUserFromList.name} contracts as developer:`, contracts.filter(c => c.developerId === currentUserFromList.id));
      console.log(`${currentUserFromList.name} contracts as recruiter:`, contracts.filter(c => c.recruiterId === currentUserFromList.id));
      console.log(`${currentUserFromList.name} user data:`, currentUserFromList);
      console.log('Current user from auth:', authUser);
    }
    
    // Get all active contracts (considering their duration)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter contracts that are active in the current month
    const activeContracts = contracts.filter(c => {
      const contractDate = new Date(c.date);
      const contractEndDate = new Date(contractDate);
      
      // If contract has duration, calculate end date
      if (c.duration && c.duration > 0) {
        contractEndDate.setMonth(contractEndDate.getMonth() + c.duration);
      } else {
        // Legacy contracts without duration - treat as single month
        contractEndDate.setMonth(contractEndDate.getMonth() + 1);
      }
      
      // Check if current month falls within contract period
      // Use first day of current month for comparison
      const currentMonthStart = new Date(currentYear, currentMonth, 1);
      const nextMonthStart = new Date(currentYear, currentMonth + 1, 1);
      
      // Contract is active if:
      // 1. Contract starts before or during current month AND
      // 2. Contract ends after current month starts
      const contractStartsBeforeOrDuringCurrentMonth = contractDate < nextMonthStart;
      const contractEndsAfterCurrentMonthStarts = contractEndDate > currentMonthStart;
      
      const isActive = contractStartsBeforeOrDuringCurrentMonth && contractEndsAfterCurrentMonthStarts;
      
      console.log(`Contract ${c.id} (${c.name || 'Unnamed'}):`, isActive);
      
      return isActive;
    });
    
    console.log('Active contracts this month:', activeContracts.length);
    
    // Special debug for Andrew Ferro
    if (userId === '5' || (currentUserFromList && currentUserFromList.name === 'Andrew Ferro')) {
      console.log('🔍 ANDREW FERRO SPECIAL DEBUG 🔍');
      console.log('Andrew Ferro user found:', currentUserFromList);
      console.log('Andrew Ferro ID being calculated:', userId);
      console.log('All users in system:', users.map(u => ({ id: u.id, name: u.name, level: u.level, leaderId: u.leaderId })));
      console.log('All contracts in system:', contracts.map(c => ({ id: c.id, name: c.name, developerId: c.developerId, monthlyMargin: c.monthlyMargin })));
      console.log('Active contracts:', activeContracts.map(c => ({ id: c.id, name: c.name, developerId: c.developerId, monthlyMargin: c.monthlyMargin })));
      console.log('Andrew contracts:', activeContracts.filter(c => c.developerId === '5' || c.recruiterId === '5'));
    }
    
    // Find current user from users list or use provided user
    let userForCalculation = users.find(u => u.id === userId);
    
    // If user not found in users list, use the provided user data
    if (!userForCalculation && authUser && authUser.id === userId) {
      userForCalculation = authUser;
      console.log('Using provided user data:', userForCalculation);
    }
    
    // If still no user found, log error and return default metrics
    if (!userForCalculation) {
      console.error('ERROR: Could not find user with ID:', userId);
      console.log('Available users:', users.map(u => ({ id: u.id, name: u.name })));
      
      // Return default metrics to prevent crashes
      return {
        currentLevel: 'junior',
        personalRevenue: 0,
        groupRevenue: 0,
        teamRevenue: 0,
        personalCommission: 0,
        teamCommission: 0,
        totalCommission: 0,
        progressToNextLevel: 0,
        teamMembers: [],
      };
    }
    
    // Ensure admin and master always have managing_director level
    let currentLevel = userForCalculation?.level || 'junior';
    if (userForCalculation?.email === 'admin@codit.com' || userForCalculation?.role === 'admin' || userForCalculation?.role === 'master') {
      currentLevel = 'managing_director';
      console.log('Admin/Master detected, setting level to managing_director');
    }
    
    console.log('Current user:', userForCalculation);
    console.log('Current user level:', currentLevel);
    console.log('Commission rate for', currentLevel, ':', COMMISSION_RATES[currentLevel]);
    
    // Get all team members recursively for admins and leaders
    const getAllTeamMembers = (leaderId: string): User[] => {
      const directMembers = users.filter(u => u.leaderId === leaderId && u.status === 'approved');
      let allMembers = [...directMembers];
      
      // Recursively get team members of team members
      directMembers.forEach(member => {
        const subMembers = getAllTeamMembers(member.id);
        allMembers = [...allMembers, ...subMembers];
      });
      
      return allMembers;
    };
    
    // For admins and masters, get all users in the organization
    let teamMembers: User[];
    if (userForCalculation?.role === 'admin' || userForCalculation?.role === 'master') {
      // Admin/Master sees all approved users except themselves
      teamMembers = users.filter(u => u.id !== userId && u.status === 'approved');
      console.log('Admin/Master - All team members:', teamMembers.map(u => ({ id: u.id, name: u.name, level: u.level })));
    } else {
      // Regular users see their direct and indirect team members
      teamMembers = getAllTeamMembers(userId);
      console.log('Regular user - Team members:', teamMembers.map(u => ({ id: u.id, name: u.name, level: u.level })));
    }
    
    // Calculate personal revenue (using monthly margin)
    const personalContracts = activeContracts.filter(c => 
      c.developerId === userId || c.recruiterId === userId
    );
    
    console.log('Personal contracts for user', userId, ':', personalContracts.map(c => ({
      id: c.id,
      name: c.name,
      developerId: c.developerId,
      recruiterId: c.recruiterId,
      monthlyMargin: c.monthlyMargin,
      isDeveloper: c.developerId === userId,
      isRecruiter: c.recruiterId === userId
    })));
    
    const personalRevenue = personalContracts.reduce((sum, contract) => {
      // Use monthly margin if available, otherwise calculate from gross margin
      const monthlyAmount = contract.monthlyMargin || (contract.grossMargin / (contract.duration || 1));
      
      // If contract has both developer and recruiter (split)
      if (contract.recruiterId && contract.developerId) {
        // Check if current user is developer or recruiter
        const isCurrentUserDeveloper = contract.developerId === userId;
        const isCurrentUserRecruiter = contract.recruiterId === userId;
        
        if (isCurrentUserDeveloper || isCurrentUserRecruiter) {
          return sum + (monthlyAmount * 0.5);
        }
      } else {
        // Full margin if only developer
        return sum + monthlyAmount;
      }
      return sum;
    }, 0);
    
    console.log('Personal revenue:', personalRevenue);
    
    // Calculate team member data with their revenues
    const teamMemberData: TeamMember[] = teamMembers.map(member => {
      const memberContracts = activeContracts
        .filter(c => c.developerId === member.id || c.recruiterId === member.id);
      
      console.log(`Member ${member.name} contracts:`, memberContracts);
      
      const memberRevenue = memberContracts.reduce((sum, contract) => {
        const monthlyAmount = contract.monthlyMargin || (contract.grossMargin / (contract.duration || 1));
        
        if (contract.recruiterId && contract.developerId) {
          const isMemberDeveloper = contract.developerId === member.id;
          const isMemberRecruiter = contract.recruiterId === member.id;
          
          if (isMemberDeveloper || isMemberRecruiter) {
            return sum + (monthlyAmount * 0.5);
          }
        } else {
          return sum + monthlyAmount;
        }
        return sum;
      }, 0);
      
      console.log(`Member ${member.name} revenue:`, memberRevenue);
      
      return {
        id: member.id,
        name: member.name,
        level: member.level,
        personalRevenue: memberRevenue,
        groupRevenue: 0, // Would calculate recursively in production
        commission: memberRevenue * COMMISSION_RATES[member.level],
      };
    });
    
    const teamRevenue = teamMemberData.reduce((sum, m) => sum + m.personalRevenue, 0);
    const groupRevenue = personalRevenue + teamRevenue;
    
    console.log('Team revenue:', teamRevenue);
    console.log('Group revenue:', groupRevenue);
    
    // Calculate personal commission
    const personalCommission = personalRevenue * COMMISSION_RATES[currentLevel];
    
    console.log('Personal commission:', personalCommission);
    
    // Calculate team commission (difference between leader and member rates)
    let teamCommission = 0;
    
    if (userForCalculation?.role === 'admin' || userForCalculation?.role === 'master') {
      // For admin/master, calculate commission from ALL team members (direct and indirect)
      // Admin/Master gets the difference between their rate and member rates
      teamCommission = teamMemberData.reduce((sum, member) => {
        // Admin/Master has managing_director level which has 0.30 rate
        const adminRate = COMMISSION_RATES[currentLevel];
        const memberRate = COMMISSION_RATES[member.level];
        // Admin/Master earns the difference in commission rates on team member revenue
        const commissionDiff = Math.max(0, adminRate - memberRate);
        const memberCommission = member.personalRevenue * commissionDiff;
        console.log(`Admin/Master team commission calc - Admin/Master rate: ${adminRate} (${currentLevel}), Member ${member.name} rate: ${memberRate} (${member.level}), Diff: ${commissionDiff}, Revenue: ${member.personalRevenue}, Commission: ${memberCommission}`);
        return sum + memberCommission;
      }, 0);
    } else {
      // For regular leaders, calculate commission from ALL team members (direct and indirect)
      // This ensures that superior commercials earn from their entire team hierarchy
      teamCommission = teamMemberData.reduce((sum, member) => {
        const leaderRate = COMMISSION_RATES[currentLevel];
        const memberRate = COMMISSION_RATES[member.level];
        const diff = leaderRate - memberRate;
        console.log(`Team commission calc - Leader rate: ${leaderRate} (${currentLevel}), Member ${member.name} rate: ${memberRate} (${member.level}), Diff: ${diff}, Revenue: ${member.personalRevenue}`);
        return sum + (member.personalRevenue * Math.max(0, diff));
      }, 0);
    }
    
    console.log('Team commission:', teamCommission);
    
    const totalCommission = personalCommission + teamCommission;
    
    console.log('Total commission:', totalCommission);
    
    // Check if user should be promoted to next level
    let updatedLevel = currentLevel;
    const currentLevelIndex = LEVEL_REQUIREMENTS.findIndex(r => r.level === currentLevel);
    const nextLevelReq = LEVEL_REQUIREMENTS[currentLevelIndex + 1];
    
    console.log('Current level index:', currentLevelIndex);
    console.log('Current level:', currentLevel);
    console.log('Next level requirements:', nextLevelReq);
    console.log('Personal revenue:', personalRevenue);
    console.log('Group revenue:', groupRevenue);
    
    // Check if user meets requirements for next level
    if (nextLevelReq && userForCalculation && userForCalculation.role !== 'admin' && userForCalculation.role !== 'master') {
      const meetsPersonalReq = personalRevenue >= nextLevelReq.personalRevenue;
      const meetsGroupReq = !nextLevelReq.groupRevenue || groupRevenue >= nextLevelReq.groupRevenue;
      
      // Check member development requirements
      let meetsMemberReq = true;
      let developedMembersCount = 0;
      
      if (nextLevelReq.requiredMembers) {
        // Count team members at the required level or higher
        const requiredLevel = nextLevelReq.requiredMembers.level;
        const requiredCount = nextLevelReq.requiredMembers.count;
        
        // Get level hierarchy for comparison
        const levelHierarchy = ['junior', 'senior', 'team_leader', 'partner', 'executive_director', 'managing_director'];
        const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
        
        // Count direct team members who are at required level or higher
        const directTeamMembers = teamMembers.filter(member => {
          const memberUser = users.find(u => u.id === member.id);
          return memberUser?.leaderId === userId;
        });
        
        developedMembersCount = directTeamMembers.filter(member => {
          const memberLevelIndex = levelHierarchy.indexOf(member.level);
          return memberLevelIndex >= requiredLevelIndex;
        }).length;
        
        meetsMemberReq = developedMembersCount >= requiredCount;
        
        console.log('Member development check:');
        console.log(`- Required: ${requiredCount} ${requiredLevel} or higher`);
        console.log(`- Current: ${developedMembersCount} developed members`);
        console.log(`- Direct team members:`, directTeamMembers.map(m => ({ name: m.name, level: m.level })));
        console.log(`- Meets member requirement: ${meetsMemberReq}`);
      }
      
      console.log('=== LEVEL PROMOTION CHECK ===');
      console.log('Current level:', currentLevel);
      console.log('Next level:', nextLevelReq.level);
      console.log('Personal revenue:', personalRevenue);
      console.log('Required personal revenue:', nextLevelReq.personalRevenue);
      console.log('Group revenue:', groupRevenue);
      console.log('Required group revenue:', nextLevelReq.groupRevenue || 'Not required');
      console.log('Is OR condition:', nextLevelReq.isOrCondition || false);
      console.log('Meets personal requirement?', meetsPersonalReq, `(${personalRevenue} >= ${nextLevelReq.personalRevenue})`);
      console.log('Meets group requirement?', meetsGroupReq, `(${groupRevenue} >= ${nextLevelReq.groupRevenue || 0})`);
      console.log('Meets member requirement?', meetsMemberReq);
      
      // Determine if revenue requirements are met based on OR/AND logic
      let meetsRevenueReq = false;
      if (nextLevelReq.isOrCondition) {
        // OR condition: personal revenue OR group revenue (plus member requirement)
        meetsRevenueReq = meetsPersonalReq || meetsGroupReq;
        console.log('Revenue requirement (OR logic):', meetsRevenueReq);
      } else {
        // AND condition: both personal AND group revenue required
        meetsRevenueReq = meetsPersonalReq && meetsGroupReq;
        console.log('Revenue requirement (AND logic):', meetsRevenueReq);
      }
      
      // User is promoted if they meet revenue requirements AND member development requirements
      if (meetsRevenueReq && meetsMemberReq) {
        updatedLevel = nextLevelReq.level;
        console.log('🎉 USER SHOULD BE PROMOTED TO:', updatedLevel);
        
        // Update user level in the database
        const updatedUser = { ...userForCalculation, level: updatedLevel };
        const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
        
        // Save the updated user level
        AsyncStorage.setItem('users', JSON.stringify(updatedUsers)).then(() => {
          console.log('✅ User level updated in storage to:', updatedLevel);
        });
        
        // Also update the auth user if it's the same user
        if (authUser && authUser.id === userId) {
          const updatedAuthUser = { ...authUser, level: updatedLevel };
          AsyncStorage.setItem('user', JSON.stringify(updatedAuthUser)).then(() => {
            console.log('✅ Auth user level updated to:', updatedLevel);
          });
        }
      } else {
        console.log('❌ User does not meet promotion requirements');
        if (!meetsRevenueReq) {
          if (nextLevelReq.isOrCondition) {
            console.log(`   - Revenue requirement (OR): Need either €${nextLevelReq.personalRevenue} personal OR €${nextLevelReq.groupRevenue || 0} group revenue`);
            console.log(`   - Current: €${personalRevenue} personal, €${groupRevenue} group`);
          } else {
            if (!meetsPersonalReq) {
              console.log(`   - Personal revenue shortfall: €${(nextLevelReq.personalRevenue - personalRevenue).toFixed(2)}`);
            }
            if (!meetsGroupReq && nextLevelReq.groupRevenue) {
              console.log(`   - Group revenue shortfall: €${(nextLevelReq.groupRevenue - groupRevenue).toFixed(2)}`);
            }
          }
        }
        if (!meetsMemberReq && nextLevelReq.requiredMembers) {
          const needed = nextLevelReq.requiredMembers.count - developedMembersCount;
          console.log(`   - Member development shortfall: Need ${needed} more ${nextLevelReq.requiredMembers.level} or higher`);
        }
      }
      console.log('=== END LEVEL PROMOTION CHECK ===');
    }
    
    // Calculate progress to next level (after potential promotion)
    const updatedLevelIndex = LEVEL_REQUIREMENTS.findIndex(r => r.level === updatedLevel);
    const updatedNextLevelReq = LEVEL_REQUIREMENTS[updatedLevelIndex + 1];
    
    let progressToNextLevel = 0;
    if (updatedNextLevelReq) {
      const personalProgress = updatedNextLevelReq.personalRevenue > 0 ? personalRevenue / updatedNextLevelReq.personalRevenue : 1;
      const groupProgress = updatedNextLevelReq.groupRevenue ? groupRevenue / updatedNextLevelReq.groupRevenue : 1;
      progressToNextLevel = Math.min(personalProgress, groupProgress);
    }
    
    return {
      currentLevel: updatedLevel,
      nextLevel: updatedNextLevelReq?.level,
      personalRevenue,
      groupRevenue,
      teamRevenue,
      personalCommission: personalRevenue * COMMISSION_RATES[updatedLevel], // Use updated level for commission
      teamCommission,
      totalCommission: (personalRevenue * COMMISSION_RATES[updatedLevel]) + teamCommission, // Use updated level
      progressToNextLevel: Math.min(1, Math.max(0, progressToNextLevel)),
      teamMembers: teamMemberData,
    };
  };

  const addContract = async (contract: Omit<Contract, 'id' | 'createdAt'>) => {
    const newContract: Contract = {
      ...contract,
      id: Date.now().toString(),
      createdAt: new Date(),
      // Ensure monthlyMargin is set
      monthlyMargin: contract.monthlyMargin || (contract.grossMargin / (contract.duration || 1)),
      duration: contract.duration || 1,
    };
    
    console.log('=== ADDING NEW CONTRACT ===');
    console.log('New contract:', newContract);
    console.log('Developer ID:', newContract.developerId);
    console.log('Recruiter ID:', newContract.recruiterId);
    
    const updatedContracts = [...contracts, newContract];
    
    // Save to AsyncStorage first
    await AsyncStorage.setItem('contracts', JSON.stringify(updatedContracts));
    
    // Try to sync to Supabase if online
    if (isOnline) {
      try {
        await SupabaseService.createContract(newContract);
        console.log('Contract synced to Supabase');
      } catch (error) {
        console.warn('Failed to sync contract to Supabase:', error);
      }
    }
    
    // Update state immediately
    setContracts(updatedContracts);
    
    console.log('Contract added successfully. Total contracts now:', updatedContracts.length);
    
    // Force refresh visible data and metrics for current user
    if (currentUser) {
      console.log('Updating visible data after contract addition...');
      
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        console.log('Admin/Master user - updating visible contracts');
        setVisibleContracts([...updatedContracts]);
      } else {
        // For commercials, recalculate filtered contracts
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        console.log('Recalculating contract visibility for', currentUser.name, ':', connectedUserIds);
        
        const filteredContracts = updatedContracts.filter(contract => {
          const isDeveloper = connectedUserIds.includes(contract.developerId);
          const isRecruiter = contract.recruiterId ? connectedUserIds.includes(contract.recruiterId) : false;
          console.log(`Contract ${contract.id} (${contract.name}): developer=${contract.developerId} (included: ${isDeveloper}), recruiter=${contract.recruiterId} (included: ${isRecruiter})`);
          return isDeveloper || isRecruiter;
        });
        
        console.log('Updated filtered contracts:', filteredContracts.length, filteredContracts.map(c => ({ id: c.id, name: c.name })));
        setVisibleContracts(filteredContracts);
      }
      
      // Recalculate metrics with updated contracts
      const userMetrics = calculateMetrics(currentUser.id, updatedContracts, users, currentUser);
      console.log('Updated metrics after contract addition:', userMetrics);
      setMetrics(userMetrics);
    }
    
    console.log('=== CONTRACT ADDITION COMPLETE ===');
  };

  const updateContract = async (contractId: string, updatedContract: Contract) => {
    console.log('Updating contract:', contractId, updatedContract);
    
    const updatedContracts = contracts.map(c => 
      c.id === contractId ? {
        ...updatedContract,
        monthlyMargin: updatedContract.monthlyMargin || (updatedContract.grossMargin / (updatedContract.duration || 1)),
        duration: updatedContract.duration || 1,
      } : c
    );
    
    // Save to AsyncStorage first
    await AsyncStorage.setItem('contracts', JSON.stringify(updatedContracts));
    
    // Try to sync to Supabase if online
    if (isOnline) {
      try {
        await SupabaseService.updateContract(contractId, updatedContract);
        console.log('Contract update synced to Supabase');
      } catch (error) {
        console.warn('Failed to sync contract update to Supabase:', error);
      }
    }
    
    // Update state
    setContracts(updatedContracts);
    
    console.log('Contract updated in storage successfully');
  };

  const approveUser = async (userId: string, adminId: string, leaderId?: string) => {
    const userToApprove = pendingUsers.find(u => u.id === userId);
    if (!userToApprove) return;
    
    const approvedUser: User = {
      ...userToApprove,
      status: 'approved',
      adminId,
      leaderId,
      approvedAt: new Date(),
    };
    
    const updatedUsers = [...users, approvedUser];
    const updatedPending = pendingUsers.filter(u => u.id !== userId);
    
    setUsers(updatedUsers);
    setPendingUsers(updatedPending);
    
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    await AsyncStorage.setItem('pendingUsers', JSON.stringify(updatedPending));
  };

  const rejectUser = async (userId: string) => {
    const updatedPending = pendingUsers.filter(u => u.id !== userId);
    setPendingUsers(updatedPending);
    await AsyncStorage.setItem('pendingUsers', JSON.stringify(updatedPending));
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'status' | 'approvedAt'>) => {
    try {
      console.log('=== STARTING USER ADDITION ===');
      console.log('User data to add:', userData);
      console.log('Current users count before addition:', users.length);
      
      // Validate required fields
      if (!userData.name || !userData.email || !userData.role) {
        throw new Error('Nome, email e ruolo sono obbligatori');
      }
      
      // Check for duplicate email
      const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        throw new Error(`Un utente con l'email ${userData.email} esiste già`);
      }
      
      // Generate unique ID with timestamp and random component
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser: User = {
        ...userData,
        id: uniqueId,
        status: 'approved',
        createdAt: new Date(),
        approvedAt: new Date(),
      };
      
      // Ensure admin and master users have the correct level
      if ((newUser.role === 'admin' || newUser.role === 'master') && newUser.level !== 'managing_director') {
        newUser.level = 'managing_director';
        console.log('Admin/Master user detected during addition - setting level to managing_director');
      }
      
      // Special handling for Paolo Di Micco and any admin users - ensure they're always admin
      if (newUser.email.toLowerCase().includes('paolo') && newUser.email.toLowerCase().includes('micco')) {
        newUser.role = 'admin';
        newUser.level = 'managing_director';
        console.log('Paolo Di Micco detected during user addition - setting as admin');
      }
      
      // General admin email pattern check
      if (newUser.email.toLowerCase().includes('admin') || 
          newUser.email.toLowerCase().includes('paolo.dimicco') ||
          (newUser.email.toLowerCase().includes('paolo') && newUser.email.toLowerCase().includes('micco'))) {
        newUser.role = 'admin';
        newUser.level = 'managing_director';
        console.log('Admin email pattern detected during user addition - setting as admin');
      }
      
      console.log('Final new user object:', newUser);
      
      // Create updated users array
      const updatedUsers = [...users, newUser];
      console.log('Updated users array length:', updatedUsers.length);
      
      // Try to save to Supabase first if online
      let supabaseSuccess = false;
      if (isOnline) {
        try {
          console.log('Attempting to save user to Supabase...');
          const supabaseUser = await SupabaseService.createUser(newUser);
          console.log('✅ User saved to Supabase successfully:', supabaseUser.id);
          // Update the user with the Supabase-generated data if different
          if (supabaseUser.id !== newUser.id) {
            newUser.id = supabaseUser.id;
            updatedUsers[updatedUsers.length - 1] = newUser;
          }
          supabaseSuccess = true;
        } catch (supabaseError) {
          console.warn('⚠️ Failed to save user to Supabase, continuing with local storage:', supabaseError);
          // Continue with local storage - don't fail the entire operation
        }
      } else {
        console.log('📴 Offline mode - saving to local storage only');
      }
      
      // Save to AsyncStorage (always do this as backup)
      console.log('Saving updated users to AsyncStorage...');
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      console.log('✅ Users saved to AsyncStorage successfully');
      
      // Update state immediately
      console.log('Updating users state...');
      setUsers(updatedUsers);
      
      console.log('✅ User added successfully!');
      console.log('- User ID:', newUser.id);
      console.log('- User name:', newUser.name);
      console.log('- User email:', newUser.email);
      console.log('- Total users now:', updatedUsers.length);
      console.log('- Supabase sync:', supabaseSuccess ? '✅ Success' : '⚠️ Failed (local only)');
      
      // CRITICAL: Force immediate update of visible data for current user
      console.log('🔄 Forcing immediate data visibility update...');
      
      if (currentUser) {
        console.log('Current user found:', currentUser.name, '- Role:', currentUser.role);
        
        // Update visible data based on user role
        if (currentUser.role === 'admin' || currentUser.role === 'master') {
          console.log('👑 Admin/Master user - showing all data');
          
          // Force re-render by creating new arrays - only show approved users
          const allApprovedUsers = updatedUsers.filter(u => u.status === 'approved');
          console.log('📊 Setting visible data:');
          console.log('- Contracts:', contracts.length);
          console.log('- Approved users:', allApprovedUsers.length);
          console.log('- User names:', allApprovedUsers.map(u => u.name));
          
          setVisibleContracts([...contracts]);
          setVisibleUsers([...allApprovedUsers]);
          
          console.log('✅ Admin/Master visible data updated');
        } else {
          console.log('👤 Commercial user - filtering data based on connections');
          
          // For commercials, recalculate connections with new user list
          const connectedUserIds = getConnectedUserIds(currentUser.id, updatedUsers);
          console.log('🔗 Connected user IDs for', currentUser.name, ':', connectedUserIds);
          
          const filteredContracts = contracts.filter(contract => {
            const isDeveloper = connectedUserIds.includes(contract.developerId);
            const isRecruiter = contract.recruiterId ? connectedUserIds.includes(contract.recruiterId) : false;
            return isDeveloper || isRecruiter;
          });
          
          const filteredUsers = updatedUsers.filter(u => {
            const isConnected = connectedUserIds.includes(u.id) && u.status === 'approved';
            return isConnected;
          });
          
          console.log('📊 Setting filtered data:');
          console.log('- Filtered contracts:', filteredContracts.length);
          console.log('- Filtered users:', filteredUsers.length);
          
          setVisibleContracts(filteredContracts);
          setVisibleUsers(filteredUsers);
          
          console.log('✅ Commercial visible data updated');
        }
        
        // Recalculate metrics with updated user list
        console.log('📈 Recalculating metrics...');
        const userMetrics = calculateMetrics(currentUser.id, contracts, updatedUsers, currentUser);
        console.log('📊 Updated metrics:', {
          personalRevenue: userMetrics.personalRevenue,
          teamRevenue: userMetrics.teamRevenue,
          totalCommission: userMetrics.totalCommission
        });
        setMetrics(userMetrics);
        
        console.log('✅ Metrics updated successfully');
      } else {
        console.log('⚠️ No current user found - skipping data filtering');
      }
      
      console.log('=== USER ADDITION COMPLETED SUCCESSFULLY ===');
      
      // Return the created user for confirmation
      return newUser;
      
    } catch (error) {
      console.error('❌ ERROR DURING USER ADDITION:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userData: userData,
        currentUsersCount: users.length
      });
      
      // Re-throw the error so the UI can handle it
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: User) => {
    const updatedUsers = users.map(u => u.id === userId ? userData : u);
    setUsers(updatedUsers);
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    
    console.log('User updated in storage successfully');
  };

  const deleteContract = async (contractId: string) => {
    console.log('=== DELETING CONTRACT ===');
    console.log('Contract ID to delete:', contractId);
    
    const updatedContracts = contracts.filter(c => c.id !== contractId);
    
    // Save to AsyncStorage first
    await AsyncStorage.setItem('contracts', JSON.stringify(updatedContracts));
    
    // Update state immediately
    setContracts(updatedContracts);
    
    console.log('Contract deleted successfully. Total contracts now:', updatedContracts.length);
    
    // Force refresh visible data and metrics for current user
    if (currentUser) {
      console.log('Updating visible data after contract deletion...');
      
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        console.log('Admin/Master user - updating visible contracts');
        setVisibleContracts([...updatedContracts]);
      } else {
        // For commercials, recalculate filtered contracts
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        console.log('Recalculating contract visibility for', currentUser.name, ':', connectedUserIds);
        
        const filteredContracts = updatedContracts.filter(contract => {
          const isDeveloper = connectedUserIds.includes(contract.developerId);
          const isRecruiter = contract.recruiterId ? connectedUserIds.includes(contract.recruiterId) : false;
          return isDeveloper || isRecruiter;
        });
        
        console.log('Updated filtered contracts:', filteredContracts.length);
        setVisibleContracts(filteredContracts);
      }
      
      // Recalculate metrics with updated contracts
      const userMetrics = calculateMetrics(currentUser.id, updatedContracts, users, currentUser);
      console.log('Updated metrics after contract deletion:', userMetrics);
      setMetrics(userMetrics);
    }
    
    console.log('=== CONTRACT DELETION COMPLETE ===');
  };

  const deleteUser = async (userId: string) => {
    console.log('=== DELETING USER ===');
    console.log('User ID to delete:', userId);
    
    // Check if user has any contracts
    const userContracts = contracts.filter(c => c.developerId === userId || c.recruiterId === userId);
    if (userContracts.length > 0) {
      console.log('User has active contracts, cannot delete');
      throw new Error('Impossibile eliminare l\'utente: ha contratti attivi. Elimina prima i contratti associati.');
    }
    
    // Check if user is a leader of other users
    const teamMembers = users.filter(u => u.leaderId === userId);
    if (teamMembers.length > 0) {
      console.log('User is a leader of other users, cannot delete');
      throw new Error('Impossibile eliminare l\'utente: è leader di altri commerciali. Riassegna prima i membri del team.');
    }
    
    const updatedUsers = users.filter(u => u.id !== userId);
    
    // Save to AsyncStorage first
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Update state immediately
    setUsers(updatedUsers);
    
    console.log('User deleted successfully. Total users now:', updatedUsers.length);
    
    // Force refresh data for all users to ensure proper filtering
    console.log('Forcing data refresh after user deletion...');
    
    // Update visible data immediately for current user if exists
    if (currentUser) {
      // Recalculate visible data with the new user list
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        console.log('Admin/Master user - updating visible data after user deletion');
        const allApprovedUsers = updatedUsers.filter(u => u.status === 'approved');
        console.log('Approved users for master/admin after deletion:', allApprovedUsers.length, allApprovedUsers.map(u => u.name));
        
        setVisibleContracts([...contracts]);
        setVisibleUsers([...allApprovedUsers]);
      } else {
        // For commercials, recalculate connections with new user list
        const connectedUserIds = getConnectedUserIds(currentUser.id, updatedUsers);
        console.log('Recalculating connections for', currentUser.name, ':', connectedUserIds);
        
        const filteredContracts = contracts.filter(contract => {
          const isDeveloper = connectedUserIds.includes(contract.developerId);
          const isRecruiter = contract.recruiterId ? connectedUserIds.includes(contract.recruiterId) : false;
          return isDeveloper || isRecruiter;
        });
        
        const filteredUsers = updatedUsers.filter(u => {
          const isConnected = connectedUserIds.includes(u.id) && u.status === 'approved';
          return isConnected;
        });
        
        console.log('Updated filtered contracts:', filteredContracts.length);
        console.log('Updated filtered users:', filteredUsers.length);
        
        setVisibleContracts(filteredContracts);
        setVisibleUsers(filteredUsers);
      }
      
      // Recalculate metrics with updated user list
      const userMetrics = calculateMetrics(currentUser.id, contracts, updatedUsers, currentUser);
      console.log('Updated metrics after user deletion:', userMetrics);
      setMetrics(userMetrics);
    }
    
    console.log('=== USER DELETION COMPLETE ===');
  };

  const refreshData = async (user?: User | null) => {
    console.log('=== REFRESHING DATA ===');
    console.log('Refresh requested for user:', user ? { id: user.id, name: user.name, email: user.email } : 'No user');
    
    try {
      // Force reload from AsyncStorage to get the latest data
      const contractsData = await AsyncStorage.getItem('contracts');
      const usersData = await AsyncStorage.getItem('users');
      
      let loadedContracts: Contract[] = [];
      let loadedUsers: User[] = [];
      
      if (contractsData) {
        try {
          // Check if data is valid JSON before parsing
          const trimmedData = contractsData.trim();
          if (trimmedData && trimmedData.length > 0 && 
              ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || 
               (trimmedData.startsWith('[') && trimmedData.endsWith(']')))) {
            loadedContracts = safeJSONParse(contractsData) || [];
          } else {
            console.error('Invalid JSON format in contracts data during refresh, using empty array');
            loadedContracts = [];
            await AsyncStorage.setItem('contracts', JSON.stringify([]));
          }
        } catch (error) {
          console.error('Error parsing contracts data during refresh, using empty array:', error);
          loadedContracts = [];
          await AsyncStorage.setItem('contracts', JSON.stringify([]));
        }
      }
      
      if (usersData) {
        try {
          // Check if data is valid JSON before parsing
          const trimmedData = usersData.trim();
          if (trimmedData && trimmedData.length > 0 && 
              ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || 
               (trimmedData.startsWith('[') && trimmedData.endsWith(']')))) {
            loadedUsers = safeJSONParse(usersData) || [];
          } else {
            console.error('Invalid JSON format in users data during refresh, using empty array');
            loadedUsers = [];
            await AsyncStorage.setItem('users', JSON.stringify([]));
          }
        } catch (error) {
          console.error('Error parsing users data during refresh, using empty array:', error);
          loadedUsers = [];
          await AsyncStorage.setItem('users', JSON.stringify([]));
        }
      }
      
      console.log('Refreshed contracts:', loadedContracts.length);
      console.log('Refreshed users:', loadedUsers.length);
      console.log('All contracts:', loadedContracts.map((c: Contract) => ({ id: c.id, name: c.name, developerId: c.developerId, recruiterId: c.recruiterId })));
      console.log('All users:', loadedUsers.map((u: User) => ({ id: u.id, name: u.name, email: u.email })));
      
      // Update state with fresh data
      setContracts(loadedContracts);
      setUsers(loadedUsers);
      
      // Recalculate visible data and metrics for current user
      if (user) {
        console.log('Recalculating data for user:', user.id, user.name);
        
        // Ensure the user exists in the loaded users list
        let userInLoadedList = loadedUsers.find((u: User) => u.id === user.id);
        if (!userInLoadedList) {
          console.log('User not found in loaded users, adding them...');
          const updatedUsers = [...loadedUsers, user];
          setUsers(updatedUsers);
          await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
          userInLoadedList = user;
        }
        
        // Filter data for user
        if (user.role === 'admin' || user.role === 'master') {
          console.log('Admin/Master user - showing all data');
          const allApprovedUsers = loadedUsers.filter(u => u.status === 'approved');
          console.log('Approved users for master/admin during refresh:', allApprovedUsers.length, allApprovedUsers.map(u => u.name));
          
          setVisibleContracts([...loadedContracts]);
          setVisibleUsers([...allApprovedUsers]);
        } else {
          // For commercials, filter data based on their connections
          const connectedUserIds = getConnectedUserIds(user.id, loadedUsers);
          console.log('Connected user IDs for', user.name, ':', connectedUserIds);
          
          const filteredContracts = loadedContracts.filter((contract: Contract) => {
            const isDeveloper = connectedUserIds.includes(contract.developerId);
            const isRecruiter = contract.recruiterId ? connectedUserIds.includes(contract.recruiterId) : false;
            console.log(`Filtering contract ${contract.id} (${contract.name}): developer=${contract.developerId} (included: ${isDeveloper}), recruiter=${contract.recruiterId} (included: ${isRecruiter})`);
            return isDeveloper || isRecruiter;
          });
          
          const filteredUsers = loadedUsers.filter((u: User) => {
            const isConnected = connectedUserIds.includes(u.id) && u.status === 'approved';
            return isConnected;
          });
          
          console.log('Final filtered contracts for', user.name, ':', filteredContracts.length, filteredContracts.map((c: Contract) => ({ id: c.id, name: c.name })));
          console.log('Final filtered users for', user.name, ':', filteredUsers.length, filteredUsers.map((u: User) => u.name));
          
          setVisibleContracts(filteredContracts);
          setVisibleUsers(filteredUsers);
        }
        
        // Recalculate metrics with fresh data
        const userMetrics = calculateMetrics(user.id, loadedContracts, loadedUsers, user);
        console.log('Refreshed metrics for', user.name, ':', userMetrics);
        setMetrics(userMetrics);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    
    console.log('=== DATA REFRESH COMPLETE ===');
  };

  const resetData = async () => {
    try {
      console.log('=== RESETTING ALL DATA ===');
      // Clear all stored data and reload with fresh mock data
      await AsyncStorage.removeItem('contracts');
      await AsyncStorage.removeItem('users');
      await AsyncStorage.removeItem('pendingUsers');
      // Don't clear auth user to maintain login state
      
      console.log('All AsyncStorage data cleared (except auth user)');
      
      // Reset state to initial values
      setContracts([]);
      setUsers([]);
      setPendingUsers([]);
      setVisibleContracts([]);
      setVisibleUsers([]);
      setMetrics(null);
      
      // Generate fresh mock data
      const freshContracts = generateMockContracts();
      const freshUsers = generateMockUsers();
      
      console.log('Generated fresh mock data:');
      console.log('Fresh contracts:', freshContracts.length);
      console.log('Fresh users:', freshUsers.length);
      console.log('Andrew Ferro in fresh users:', freshUsers.find(u => u.name === 'Andrew Ferro'));
      
      // Save fresh data to storage
      await AsyncStorage.setItem('contracts', JSON.stringify(freshContracts));
      await AsyncStorage.setItem('users', JSON.stringify(freshUsers));
      await AsyncStorage.setItem('pendingUsers', JSON.stringify([]));
      
      // Update state with fresh data
      setContracts(freshContracts);
      setUsers(freshUsers);
      setPendingUsers([]);
      
      // Force immediate data filtering and metrics calculation for current user
      if (currentUser) {
        console.log('Forcing immediate data update for current user:', currentUser.name);
        
        // Ensure current user exists in fresh users list
        let userInFreshList = freshUsers.find(u => u.id === currentUser.id || u.email === currentUser.email);
        let finalUsersList = freshUsers;
        
        if (!userInFreshList) {
          console.log('Current user not in fresh list, adding them...');
          finalUsersList = [...freshUsers, currentUser];
          setUsers(finalUsersList);
          await AsyncStorage.setItem('users', JSON.stringify(finalUsersList));
        }
        
        // Filter data for current user
        if (currentUser.role === 'admin' || currentUser.role === 'master') {
          const allApprovedUsers = finalUsersList.filter(u => u.status === 'approved');
          console.log('Admin/Master - setting visible data:', freshContracts.length, 'contracts,', allApprovedUsers.length, 'users');
          setVisibleContracts([...freshContracts]);
          setVisibleUsers([...allApprovedUsers]);
        } else {
          // For commercials, filter based on connections
          const connectedUserIds = getConnectedUserIds(currentUser.id, finalUsersList);
          const filteredContracts = freshContracts.filter(contract => {
            const isDeveloper = connectedUserIds.includes(contract.developerId);
            const isRecruiter = contract.recruiterId ? connectedUserIds.includes(contract.recruiterId) : false;
            return isDeveloper || isRecruiter;
          });
          const filteredUsers = finalUsersList.filter(u => {
            return connectedUserIds.includes(u.id) && u.status === 'approved';
          });
          
          console.log('Commercial - setting filtered data:', filteredContracts.length, 'contracts,', filteredUsers.length, 'users');
          setVisibleContracts(filteredContracts);
          setVisibleUsers(filteredUsers);
        }
        
        // Calculate fresh metrics
        const freshMetrics = calculateMetrics(currentUser.id, freshContracts, finalUsersList, currentUser);
        console.log('Setting fresh metrics:', freshMetrics);
        setMetrics(freshMetrics);
      }
      
      console.log('=== DATA RESET COMPLETE ===');
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  };

  const clearCorruptedData = async () => {
    try {
      console.log('=== CLEARING CORRUPTED DATA ===');
      // Clear all AsyncStorage data that might be corrupted
      await AsyncStorage.removeItem('contracts');
      await AsyncStorage.removeItem('users');
      await AsyncStorage.removeItem('pendingUsers');
      await AsyncStorage.removeItem('user');
      
      console.log('All potentially corrupted data cleared');
      
      // Reset all state to initial values
      setContracts([]);
      setUsers([]);
      setPendingUsers([]);
      setVisibleContracts([]);
      setVisibleUsers([]);
      setMetrics(null);
      setCurrentUser(null);
      
      // Force reload with fresh mock data
      const freshContracts = generateMockContracts();
      const freshUsers = generateMockUsers();
      
      await AsyncStorage.setItem('contracts', JSON.stringify(freshContracts));
      await AsyncStorage.setItem('users', JSON.stringify(freshUsers));
      await AsyncStorage.setItem('pendingUsers', JSON.stringify([]));
      
      setContracts(freshContracts);
      setUsers(freshUsers);
      setPendingUsers([]);
      
      console.log('Fresh mock data loaded after clearing corruption');
      console.log('=== CORRUPTED DATA CLEAR COMPLETE ===');
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    await AsyncStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Update visible clients for current user
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleClients([...updatedClients]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredClients = updatedClients.filter(client => {
          const isCreatedBy = connectedUserIds.includes(client.createdBy);
          const isAssignedTo = client.assignedTo ? connectedUserIds.includes(client.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleClients(filteredClients);
      }
    }
  };
  
  const addDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedDeals = [...deals, newDeal];
    setDeals(updatedDeals);
    await AsyncStorage.setItem('deals', JSON.stringify(updatedDeals));
    
    // Update visible deals for current user
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleDeals([...updatedDeals]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredDeals = updatedDeals.filter(deal => {
          const isCreatedBy = connectedUserIds.includes(deal.createdBy);
          const isAssignedTo = deal.assignedTo ? connectedUserIds.includes(deal.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleDeals(filteredDeals);
      }
    }
  };
  
  const updateDeal = async (dealId: string, dealData: Deal) => {
    const updatedDeals = deals.map(d => d.id === dealId ? { ...dealData, updatedAt: new Date() } : d);
    setDeals(updatedDeals);
    await AsyncStorage.setItem('deals', JSON.stringify(updatedDeals));
    
    // Update visible deals for current user
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleDeals([...updatedDeals]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredDeals = updatedDeals.filter(deal => {
          const isCreatedBy = connectedUserIds.includes(deal.createdBy);
          const isAssignedTo = deal.assignedTo ? connectedUserIds.includes(deal.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleDeals(filteredDeals);
      }
    }
  };
  
  const deleteDeal = async (dealId: string) => {
    const updatedDeals = deals.filter(d => d.id !== dealId);
    setDeals(updatedDeals);
    await AsyncStorage.setItem('deals', JSON.stringify(updatedDeals));
    
    // Update visible deals
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleDeals([...updatedDeals]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredDeals = updatedDeals.filter(deal => {
          const isCreatedBy = connectedUserIds.includes(deal.createdBy);
          const isAssignedTo = deal.assignedTo ? connectedUserIds.includes(deal.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleDeals(filteredDeals);
      }
    }
  };
  
  const updateClient = async (clientId: string, clientData: Client) => {
    const updatedClients = clients.map(c => c.id === clientId ? clientData : c);
    setClients(updatedClients);
    await AsyncStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Update visible clients for current user
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleClients([...updatedClients]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredClients = updatedClients.filter(client => {
          const isCreatedBy = connectedUserIds.includes(client.createdBy);
          const isAssignedTo = client.assignedTo ? connectedUserIds.includes(client.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleClients(filteredClients);
      }
    }
  };
  
  const deleteClient = async (clientId: string) => {
    const updatedClients = clients.filter(c => c.id !== clientId);
    setClients(updatedClients);
    await AsyncStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Update visible clients
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleClients([...updatedClients]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredClients = updatedClients.filter(client => {
          const isCreatedBy = connectedUserIds.includes(client.createdBy);
          const isAssignedTo = client.assignedTo ? connectedUserIds.includes(client.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleClients(filteredClients);
      }
    }
  };
  
  const addConsultant = async (consultantData: Omit<Consultant, 'id' | 'createdAt'>) => {
    const newConsultant: Consultant = {
      ...consultantData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    const updatedConsultants = [...consultants, newConsultant];
    setConsultants(updatedConsultants);
    await AsyncStorage.setItem('consultants', JSON.stringify(updatedConsultants));
    
    // Update visible consultants for current user
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleConsultants([...updatedConsultants]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredConsultants = updatedConsultants.filter(consultant => {
          const isCreatedBy = connectedUserIds.includes(consultant.createdBy);
          const isAssignedTo = consultant.assignedTo ? connectedUserIds.includes(consultant.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleConsultants(filteredConsultants);
      }
    }
  };
  
  const updateConsultant = async (consultantId: string, consultantData: Consultant) => {
    const updatedConsultants = consultants.map(c => c.id === consultantId ? consultantData : c);
    setConsultants(updatedConsultants);
    await AsyncStorage.setItem('consultants', JSON.stringify(updatedConsultants));
    
    // Update visible consultants for current user
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleConsultants([...updatedConsultants]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredConsultants = updatedConsultants.filter(consultant => {
          const isCreatedBy = connectedUserIds.includes(consultant.createdBy);
          const isAssignedTo = consultant.assignedTo ? connectedUserIds.includes(consultant.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleConsultants(filteredConsultants);
      }
    }
  };
  
  const deleteConsultant = async (consultantId: string) => {
    const updatedConsultants = consultants.filter(c => c.id !== consultantId);
    setConsultants(updatedConsultants);
    await AsyncStorage.setItem('consultants', JSON.stringify(updatedConsultants));
    
    // Update visible consultants
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'master') {
        setVisibleConsultants([...updatedConsultants]);
      } else {
        const connectedUserIds = getConnectedUserIds(currentUser.id, users);
        const filteredConsultants = updatedConsultants.filter(consultant => {
          const isCreatedBy = connectedUserIds.includes(consultant.createdBy);
          const isAssignedTo = consultant.assignedTo ? connectedUserIds.includes(consultant.assignedTo) : false;
          return isCreatedBy || isAssignedTo;
        });
        setVisibleConsultants(filteredConsultants);
      }
    }
  };

  const forceDataRefresh = async () => {
    try {
      console.log('=== FORCING COMPLETE DATA REFRESH ===');
      
      // Clear all data and reload fresh
      await clearCorruptedData();
      
      // Wait a moment for state to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reload data for current user if exists
      if (currentUser) {
        console.log('Reloading data for current user after force refresh:', currentUser.name);
        await loadData(currentUser);
      }
      
      console.log('=== FORCE DATA REFRESH COMPLETE ===');
    } catch (error) {
      console.error('Error in force data refresh:', error);
    }
  };

  // Effect to handle data loading and filtering when user changes
  useEffect(() => {
    if (currentUser) {
      console.log('=== USER CHANGED, LOADING DATA ===');
      console.log('New user:', { id: currentUser.id, name: currentUser.name, email: currentUser.email });
      
      // Load initial data if not loaded yet
      if (contracts.length === 0 && users.length === 0) {
        loadData(currentUser);
      } else {
        // Filter existing data and recalculate metrics immediately
        filterDataForUser(currentUser);
        const userMetrics = calculateMetrics(currentUser.id, contracts, users, currentUser);
        setMetrics(userMetrics);
        
        // Load CRM data if not loaded yet - but do it in a non-blocking way
        setTimeout(async () => {
          try {
            let loadedClients: Client[] = clients;
            let loadedConsultants: Consultant[] = consultants;
            
            if (clients.length === 0) {
              const clientsData = await AsyncStorage.getItem('clients');
              loadedClients = [];
              if (clientsData) {
                try {
                  const parsed = safeJSONParse(clientsData);
                  if (Array.isArray(parsed)) {
                    loadedClients = parsed;
                  }
                } catch (error) {
                  console.warn('Error parsing clients data:', error);
                }
              }
              setClients(loadedClients);
              console.log('Loaded clients:', loadedClients.length);
            }
            
            if (consultants.length === 0) {
              const consultantsData = await AsyncStorage.getItem('consultants');
              loadedConsultants = [];
              if (consultantsData) {
                try {
                  const parsed = safeJSONParse(consultantsData);
                  if (Array.isArray(parsed)) {
                    loadedConsultants = parsed;
                  }
                } catch (error) {
                  console.warn('Error parsing consultants data:', error);
                }
              }
              setConsultants(loadedConsultants);
              console.log('Loaded consultants:', loadedConsultants.length);
            }
            
            // Update visible CRM data after loading
            console.log('Updating visible CRM data after loading...');
            if (currentUser.role === 'admin' || currentUser.role === 'master') {
              console.log('Admin/Master - setting all CRM data as visible');
              setVisibleClients([...loadedClients]);
              setVisibleConsultants([...loadedConsultants]);
            } else {
              const connectedUserIds = getConnectedUserIds(currentUser.id, users);
              console.log('Commercial - filtering CRM data for connected users:', connectedUserIds);
              
              const filteredClients = loadedClients.filter(client => {
                const isCreatedBy = connectedUserIds.includes(client.createdBy);
                const isAssignedTo = client.assignedTo ? connectedUserIds.includes(client.assignedTo) : false;
                return isCreatedBy || isAssignedTo;
              });
              
              const filteredConsultants = loadedConsultants.filter(consultant => {
                const isCreatedBy = connectedUserIds.includes(consultant.createdBy);
                const isAssignedTo = consultant.assignedTo ? connectedUserIds.includes(consultant.assignedTo) : false;
                return isCreatedBy || isAssignedTo;
              });
              
              console.log('Setting filtered clients:', filteredClients.length);
              console.log('Setting filtered consultants:', filteredConsultants.length);
              setVisibleClients(filteredClients);
              setVisibleConsultants(filteredConsultants);
            }
          } catch (error) {
            console.error('Error loading CRM data:', error);
          }
        }, 500); // Increased delay to prevent blocking
      }
    }
  }, [currentUser?.id]); // Only depend on user ID to prevent excessive re-renders

  // Effect to filter data and recalculate metrics when contracts or users change
  useEffect(() => {
    if (currentUser && contracts.length >= 0 && users.length >= 0) {
      console.log('=== DATA CHANGED, FILTERING AND CALCULATING ===');
      console.log('User:', { id: currentUser.id, name: currentUser.name, email: currentUser.email });
      console.log('Contracts count:', contracts.length);
      console.log('Users count:', users.length);
      
      // Use requestAnimationFrame to prevent blocking the UI thread
      requestAnimationFrame(() => {
        try {
          // Always filter data for user
          filterDataForUser(currentUser);
          
          // Always recalculate metrics, even if no contracts/users yet
          const userMetrics = calculateMetrics(currentUser.id, contracts, users, currentUser);
          console.log('Setting metrics from useEffect:', userMetrics);
          setMetrics(userMetrics);
        } catch (error) {
          console.error('Error in data filtering/calculation:', error);
        }
      });
    } else {
      console.log('=== DATA CHANGE NOT PROCESSED ===');
      console.log('User exists:', !!currentUser);
      console.log('Contracts length:', contracts.length);
      console.log('Users length:', users.length);
    }
  }, [currentUser?.id, contracts.length, users.length]);
  
  // Effect to handle CRM data changes and update visible data
  useEffect(() => {
    if (currentUser && (clients.length > 0 || consultants.length > 0 || deals.length > 0)) {
      console.log('=== CRM DATA CHANGED, UPDATING VISIBLE DATA ===');
      console.log('Clients count:', clients.length);
      console.log('Consultants count:', consultants.length);
      console.log('Deals count:', deals.length);
      
      // Use requestAnimationFrame to prevent blocking the UI thread
      requestAnimationFrame(() => {
        try {
          if (currentUser.role === 'admin' || currentUser.role === 'master') {
            console.log('Admin/Master - setting all CRM data as visible');
            setVisibleClients([...clients]);
            setVisibleConsultants([...consultants]);
            setVisibleDeals([...deals]);
          } else {
            const connectedUserIds = getConnectedUserIds(currentUser.id, users);
            console.log('Commercial - filtering CRM data for connected users:', connectedUserIds);
            
            const filteredClients = clients.filter(client => {
              const isCreatedBy = connectedUserIds.includes(client.createdBy);
              const isAssignedTo = client.assignedTo ? connectedUserIds.includes(client.assignedTo) : false;
              return isCreatedBy || isAssignedTo;
            });
            
            const filteredConsultants = consultants.filter(consultant => {
              const isCreatedBy = connectedUserIds.includes(consultant.createdBy);
              const isAssignedTo = consultant.assignedTo ? connectedUserIds.includes(consultant.assignedTo) : false;
              return isCreatedBy || isAssignedTo;
            });
            
            console.log('Setting filtered clients:', filteredClients.length);
            console.log('Setting filtered consultants:', filteredConsultants.length);
            setVisibleClients(filteredClients);
            setVisibleConsultants(filteredConsultants);
            
            const filteredDeals = deals.filter(deal => {
              const isCreatedBy = connectedUserIds.includes(deal.createdBy);
              const isAssignedTo = deal.assignedTo ? connectedUserIds.includes(deal.assignedTo) : false;
              return isCreatedBy || isAssignedTo;
            });
            
            console.log('Setting filtered deals:', filteredDeals.length);
            setVisibleDeals(filteredDeals);
          }
        } catch (error) {
          console.error('Error updating CRM visible data:', error);
        }
      });
    }
  }, [currentUser?.id, clients.length, consultants.length, deals.length, users.length]);
  
  // Additional effect to handle immediate updates when data changes - throttled logging
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('=== VISIBLE DATA UPDATE TRIGGER ===');
      console.log('Visible contracts:', visibleContracts.length);
      console.log('Visible users:', visibleUsers.length);
      console.log('Visible clients:', visibleClients.length);
      console.log('Visible consultants:', visibleConsultants.length);
      console.log('Visible deals:', visibleDeals.length);
    }, 1000); // Throttle logging to prevent spam
    
    return () => clearTimeout(timeoutId);
  }, [visibleContracts.length, visibleUsers.length, visibleClients.length, visibleConsultants.length, visibleDeals.length]);

  return {
    contracts,
    users,
    pendingUsers,
    visibleContracts,
    visibleUsers,
    clients,
    consultants,
    deals,
    visibleClients,
    visibleConsultants,
    visibleDeals,
    metrics,
    isLoading,
    isOnline,
    syncStatus,
    addContract,
    updateContract,
    deleteContract,
    addUser,
    updateUser,
    deleteUser,
    approveUser,
    rejectUser,
    addClient,
    updateClient,
    deleteClient,
    addConsultant,
    updateConsultant,
    deleteConsultant,
    addDeal,
    updateDeal,
    deleteDeal,
    refreshData,
    resetData,
    clearCorruptedData,
    forceDataRefresh,
    setCurrentUser,
  };
});

// Mock data generators
const generateMockUsers = (): User[] => {
  return [
    {
      id: '1',
      email: 'admin@codit.com',
      name: 'Mario Rossi',
      role: 'admin',
      status: 'approved',
      level: 'managing_director',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      email: 'leader@codit.com',
      name: 'Luca Bianchi',
      role: 'commercial',
      status: 'approved',
      level: 'team_leader',
      adminId: '1',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '3',
      email: 'senior@codit.com',
      name: 'Anna Verdi',
      role: 'commercial',
      status: 'approved',
      level: 'senior',
      adminId: '1',
      leaderId: '2',
      createdAt: new Date('2024-02-01'),
    },
    {
      id: '4',
      email: 'antonio.baudo@codit.com',
      name: 'Antonio Baudo',
      role: 'commercial',
      status: 'approved',
      level: 'junior',
      adminId: '1',
      leaderId: '2',
      createdAt: new Date('2024-03-01'),
    },
    {
      id: '5',
      email: 'andrew.ferro@codit.com',
      name: 'Andrew Ferro',
      role: 'commercial',
      status: 'approved',
      level: 'managing_director',
      adminId: '1',
      // No leaderId - reports directly to Master
      createdAt: new Date('2024-04-01'),
    },
  ];
};

const generateMockContracts = (): Contract[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return [
    {
      id: '1',
      name: 'Contratto E-commerce Platform',
      date: new Date(currentYear, currentMonth - 2, 5),
      grossMargin: 36000,
      monthlyMargin: 3000,
      duration: 12,
      developerId: '2',
      createdBy: '1',
      createdAt: new Date(currentYear, currentMonth - 2, 5),
    },
    {
      id: '2',
      name: 'App Mobile Banking',
      date: new Date(currentYear, currentMonth - 1, 15),
      grossMargin: 24000,
      monthlyMargin: 4000,
      duration: 6,
      developerId: '3',
      recruiterId: '2',
      createdBy: '1',
      createdAt: new Date(currentYear, currentMonth - 1, 15),
    },
    {
      id: '3',
      name: 'Sistema Gestionale CRM',
      date: new Date(currentYear, currentMonth, 1),
      grossMargin: 60000,
      monthlyMargin: 2500,
      duration: 24,
      developerId: '2',
      createdBy: '1',
      createdAt: new Date(currentYear, currentMonth, 1),
    },
    {
      id: '4',
      name: 'Portale Web Aziendale',
      date: new Date(currentYear, currentMonth, 10),
      grossMargin: 180000, // Increased to €180,000 total (€15,000/month)
      monthlyMargin: 15000, // €15,000/month to meet senior requirements
      duration: 12,
      developerId: '4', // Antonio Baudo
      createdBy: '1',
      createdAt: new Date(currentYear, currentMonth, 10),
    },
    {
      id: '5',
      name: 'Consulenza Enterprise',
      date: new Date(currentYear, currentMonth - 1, 1),
      grossMargin: 48000,
      monthlyMargin: 4000,
      duration: 12,
      developerId: '1', // Admin Mario Rossi
      createdBy: '1',
      createdAt: new Date(currentYear, currentMonth - 1, 1),
    },
    {
      id: '6',
      name: 'Progetto Mobile App',
      date: new Date(currentYear, currentMonth, 15),
      grossMargin: 72000,
      monthlyMargin: 6000,
      duration: 12,
      developerId: '5', // Andrew Ferro
      createdBy: '1',
      createdAt: new Date(currentYear, currentMonth, 15),
    },
  ];
};

const generateMockDeals = (): Deal[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return [
    {
      id: '1',
      title: 'Sviluppo App Mobile per Banca',
      clientId: 'client-1',
      clientName: 'Banca Nazionale',
      consultantId: 'consultant-1',
      consultantName: 'Marco Sviluppatore',
      value: 45000,
      status: 'final_interview',
      probability: 75,
      expectedCloseDate: new Date(currentYear, currentMonth + 1, 15),
      notes: 'Cliente molto interessato, in fase di negoziazione finale',
      createdBy: '1',
      assignedTo: '2',
      createdAt: new Date(currentYear, currentMonth - 1, 10),
      updatedAt: new Date(currentYear, currentMonth, 5),
    },
    {
      id: '2',
      title: 'Consulenza CRM Enterprise',
      clientId: 'client-2',
      clientName: 'TechCorp Solutions',
      value: 28000,
      status: 'initial_interview',
      probability: 60,
      expectedCloseDate: new Date(currentYear, currentMonth + 2, 1),
      notes: 'Proposta inviata, in attesa di feedback',
      createdBy: '2',
      assignedTo: '3',
      createdAt: new Date(currentYear, currentMonth, 1),
      updatedAt: new Date(currentYear, currentMonth, 3),
    },
    {
      id: '3',
      title: 'Portale E-commerce B2B',
      clientId: 'client-3',
      clientName: 'Retail Group',
      consultantId: 'consultant-2',
      consultantName: 'Anna Frontend',
      value: 65000,
      status: 'initial_interview',
      probability: 40,
      expectedCloseDate: new Date(currentYear, currentMonth + 3, 20),
      notes: 'Prima proposta, cliente sta valutando altre opzioni',
      createdBy: '3',
      createdAt: new Date(currentYear, currentMonth, 8),
      updatedAt: new Date(currentYear, currentMonth, 12),
    },
    {
      id: '4',
      title: 'Sistema Gestionale HR',
      clientId: 'client-4',
      clientName: 'Human Resources Inc',
      value: 38000,
      status: 'final_interview',
      probability: 85,
      expectedCloseDate: new Date(currentYear, currentMonth, 25),
      notes: 'Quasi chiuso, ultimi dettagli contrattuali',
      createdBy: '4',
      assignedTo: '2',
      createdAt: new Date(currentYear, currentMonth - 2, 15),
      updatedAt: new Date(currentYear, currentMonth, 18),
    },
  ];
};