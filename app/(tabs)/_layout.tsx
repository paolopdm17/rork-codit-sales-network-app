import { Tabs } from "expo-router";
import { Home, Users, FileText, Settings, Briefcase, TrendingUp, UserCheck, Building2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/auth-context";
import { useData } from "@/hooks/data-context";
import { WEB_CONFIG } from "@/constants/web-config";

export default function TabLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { setCurrentUser } = useData();
  const hasSetUser = useRef(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const renderCount = useRef(0);
  
  // Increment render count for debugging
  renderCount.current += 1;
  console.log(`🔄 TabLayout render #${renderCount.current}`, {
    hasUser: !!user,
    isAuthenticated,
    isLoading,
    platform: Platform.OS
  });

  // Set current user in data context when user changes
  useEffect(() => {
    let isMounted = true;
    
    const syncUser = async () => {
      try {
        console.log('🔄 TabLayout: Syncing user...', {
          hasUser: !!user,
          isAuthenticated,
          hasSetUser: hasSetUser.current,
          platform: Platform.OS
        });
        
        if (user && isAuthenticated && !hasSetUser.current && isMounted) {
          console.log('✅ Setting current user in data context:', user.name);
          setCurrentUser(user);
          hasSetUser.current = true;
          setTabError(null);
        } else if (!user && !isAuthenticated && isMounted) {
          console.log('🔄 User not authenticated, clearing current user');
          setCurrentUser(null);
          hasSetUser.current = false;
          setTabError(null);
        }
      } catch (error) {
        console.error('❌ TabLayout: Error syncing user:', error);
        if (isMounted) {
          setTabError(error instanceof Error ? error.message : 'User sync failed');
        }
      }
    };
    
    // Immediate sync for better responsiveness
    syncUser();
    
    return () => {
      isMounted = false;
    };
  }, [user, isAuthenticated, setCurrentUser]);

  // Memoize role checks to prevent unnecessary re-renders
  const userRoles = useMemo(() => {
    if (!user) {
      return { isAdmin: false, isMaster: false, isAdminOrMaster: false, isCommercial: false };
    }
    
    const isAdmin = user.role === "admin";
    const isMaster = user.role === "master";
    const isAdminOrMaster = isAdmin || isMaster;
    const isCommercial = user.role === "commercial";
    
    console.log('🔍 DETAILED User role check:', {
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      userLevel: user.level,
      isAdmin,
      isMaster,
      isAdminOrMaster,
      isCommercial,
      shouldSeeContracts: isMaster,
      shouldSeeMyContracts: isCommercial
    });
    
    return { isAdmin, isMaster, isAdminOrMaster, isCommercial };
  }, [user]);
  
  const { isMaster, isAdminOrMaster, isCommercial } = userRoles;

  // Memoize tab screen options to prevent re-creation on every render
  const tabScreenOptions = useMemo(() => ({
    tabBarActiveTintColor: "#1E40AF",
    tabBarInactiveTintColor: "#94A3B8",
    headerShown: false,
    tabBarStyle: {
      backgroundColor: "#fff",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
      // Web-specific fixes for better compatibility
      ...(Platform.OS === 'web' && {
        position: 'relative' as const,
        elevation: 0,
        shadowOpacity: 0,
      }),
    },
    // Web-specific tab bar options
    ...(Platform.OS === 'web' && {
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600' as const,
      },
      tabBarIconStyle: {
        marginBottom: 0,
      },
      // Ensure tabs are clickable on web
      tabBarItemStyle: {
        ...WEB_CONFIG.STYLES.CURSOR_POINTER,
      },
    }),
    // Animation settings for better web performance
    animationEnabled: Platform.OS !== 'web',
    swipeEnabled: Platform.OS !== 'web',
  }), []);

  // Memoize tab options to prevent re-creation on every render
  const tabOptions = useMemo(() => {
    const iconSize = Platform.OS === 'web' ? 20 : 24;
    
    const baseOptions = {
      dashboard: {
        title: "Dashboard",
        tabBarIcon: ({ color }: { color: string }) => <Home color={color} size={iconSize} />,
        href: '/dashboard' as const,
      },
      users: {
        title: "Utenti",
        tabBarIcon: ({ color }: { color: string }) => <Users color={color} size={iconSize} />,
        href: isAdminOrMaster ? ('/users' as const) : null,
      },
      contracts: {
        title: "Contratti",
        tabBarIcon: ({ color }: { color: string }) => <FileText color={color} size={iconSize} />,
        href: (isMaster && user?.role === 'master') ? ('/contracts' as const) : null,
      },
      'my-contracts': {
        title: "I Miei Contratti",
        tabBarIcon: ({ color }: { color: string }) => <Briefcase color={color} size={iconSize} />,
        href: isCommercial ? ('/my-contracts' as const) : null,
      },
      'my-team': {
        title: "Il Mio Team",
        tabBarIcon: ({ color }: { color: string }) => <UserCheck color={color} size={iconSize} />,
        href: isCommercial ? ('/my-team' as const) : null,
      },
      'team-earnings': {
        title: "Guadagni Team",
        tabBarIcon: ({ color }: { color: string }) => <TrendingUp color={color} size={iconSize} />,
        href: isMaster ? ('/team-earnings' as const) : null,
      },
      crm: {
        title: "CRM",
        tabBarIcon: ({ color }: { color: string }) => <Building2 color={color} size={iconSize} />,
        href: '/crm' as const,
      },
      profile: {
        title: "Profilo",
        tabBarIcon: ({ color }: { color: string }) => <Settings color={color} size={iconSize} />,
        href: '/profile' as const,
      },
    };
    
    return baseOptions;
  }, [isAdminOrMaster, isMaster, isCommercial, user?.role]);

  // Show error state if tab sync failed
  if (tabError) {
    console.error('❌ TabLayout: Tab error state:', tabError);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#d32f2f', marginBottom: 10 }}>Errore Tab</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>{tabError}</Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#2196f3', padding: 12, borderRadius: 8 }}
          onPress={() => {
            console.log('🔄 Resetting tab error state');
            setTabError(null);
            hasSetUser.current = false;
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show loading state while user is being authenticated
  if (isLoading) {
    console.log('⏳ TabLayout: Still loading user authentication...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={{ marginTop: 10, color: '#666' }}>Caricamento utente...</Text>
      </View>
    );
  }

  // Don't render tabs if user is not authenticated
  if (!isAuthenticated || !user) {
    console.log('🚫 TabLayout: User not authenticated or missing:', { isAuthenticated, hasUser: !!user });
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>Accesso richiesto</Text>
        <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 10 }}>Effettua il login per continuare</Text>
      </View>
    );
  }

  // Web-specific: Ensure user is properly set but don't block rendering
  if (Platform.OS === 'web' && !hasSetUser.current && user) {
    console.log('TabLayout: Setting user on web...');
    // Force set user immediately on web
    setTimeout(() => {
      setCurrentUser(user);
      hasSetUser.current = true;
    }, 0);
  }

  console.log('🎯 TabLayout: Rendering tabs for user:', {
    name: user.name,
    email: user.email,
    role: user.role,
    level: user.level,
    roleChecks: {
      isMaster,
      isAdminOrMaster,
      isCommercial
    },
    visibleTabs: {
      dashboard: true,
      users: isAdminOrMaster,
      contracts: isMaster, // Solo Master può vedere i contratti
      myContracts: isCommercial,
      myTeam: isCommercial,
      teamEarnings: isMaster,
      crm: true,
      profile: true
    }
  });

  return (
    <Tabs screenOptions={tabScreenOptions}>
      {/* Dashboard - Always visible */}
      <Tabs.Screen
        name="dashboard"
        options={tabOptions.dashboard}
      />
      
      {/* Users - Admin/Master only */}
      <Tabs.Screen
        name="users"
        options={{
          ...tabOptions.users,
          href: isAdminOrMaster ? tabOptions.users.href : null,
        }}
      />
      
      {/* Contracts - Master only */}
      <Tabs.Screen
        name="contracts"
        options={{
          ...tabOptions.contracts,
          href: (isMaster && user?.role === 'master') ? tabOptions.contracts.href : null,
        }}
      />
      
      {/* My Contracts - Commercial only */}
      <Tabs.Screen
        name="my-contracts"
        options={{
          ...tabOptions['my-contracts'],
          href: isCommercial ? tabOptions['my-contracts'].href : null,
        }}
      />
      
      {/* My Team - Commercial only */}
      <Tabs.Screen
        name="my-team"
        options={{
          ...tabOptions['my-team'],
          href: isCommercial ? tabOptions['my-team'].href : null,
        }}
      />
      
      {/* Team Earnings - Master only */}
      <Tabs.Screen
        name="team-earnings"
        options={{
          ...tabOptions['team-earnings'],
          href: isMaster ? tabOptions['team-earnings'].href : null,
        }}
      />
      
      {/* CRM - Always visible */}
      <Tabs.Screen
        name="crm"
        options={tabOptions.crm}
      />
      
      {/* Profile - Always visible */}
      <Tabs.Screen
        name="profile"
        options={tabOptions.profile}
      />
    </Tabs>
  );
}