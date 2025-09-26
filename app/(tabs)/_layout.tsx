import { Tabs } from "expo-router";
import { Home, Users, FileText, Settings, Briefcase, TrendingUp, UserCheck, Building2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/hooks/auth-context";
import { useData } from "@/hooks/data-context";

export default function TabLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { setCurrentUser } = useData();
  const hasSetUser = useRef(false);

  // Set current user in data context when user changes
  useEffect(() => {
    if (user && isAuthenticated && !hasSetUser.current) {
      console.log('Setting current user in data context:', user.name);
      setCurrentUser(user);
      hasSetUser.current = true;
    } else if (!user && !isAuthenticated && hasSetUser.current) {
      console.log('User not authenticated, clearing current user');
      setCurrentUser(null);
      hasSetUser.current = false;
    }
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
      // Web-specific fixes
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
        fontWeight: '600',
        marginTop: 2,
      },
      tabBarIconStyle: {
        marginBottom: 0,
      },
    }),
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

  // Show loading state while user is being authenticated
  if (isLoading) {
    console.log('TabLayout: Still loading user authentication...');
    return null;
  }

  // Don't render tabs if user is not authenticated
  if (!isAuthenticated || !user) {
    console.log('TabLayout: User not authenticated or missing:', { isAuthenticated, hasUser: !!user });
    return null;
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
          // Hide tab if user doesn't have access
          tabBarButton: isAdminOrMaster ? undefined : () => null,
        }}
      />
      
      {/* Contracts - Master only */}
      <Tabs.Screen
        name="contracts"
        options={{
          ...tabOptions.contracts,
          // Hide tab if user doesn't have access
          tabBarButton: (isMaster && user?.role === 'master') ? undefined : () => null,
        }}
      />
      
      {/* My Contracts - Commercial only */}
      <Tabs.Screen
        name="my-contracts"
        options={{
          ...tabOptions['my-contracts'],
          // Hide tab if user doesn't have access
          tabBarButton: isCommercial ? undefined : () => null,
        }}
      />
      
      {/* My Team - Commercial only */}
      <Tabs.Screen
        name="my-team"
        options={{
          ...tabOptions['my-team'],
          // Hide tab if user doesn't have access
          tabBarButton: isCommercial ? undefined : () => null,
        }}
      />
      
      {/* Team Earnings - Master only */}
      <Tabs.Screen
        name="team-earnings"
        options={{
          ...tabOptions['team-earnings'],
          // Hide tab if user doesn't have access
          tabBarButton: isMaster ? undefined : () => null,
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