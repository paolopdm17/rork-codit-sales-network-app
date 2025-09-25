import { Tabs } from "expo-router";
import { Home, Users, FileText, Settings, Briefcase, TrendingUp, UserCheck, Building2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef } from "react";
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
    
    console.log('User role check:', {
      userRole: user.role,
      isAdmin,
      isMaster,
      isAdminOrMaster,
      isCommercial
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
    },
  }), []);

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

  console.log('TabLayout: Rendering tabs for user:', {
    name: user.name,
    role: user.role,
    level: user.level,
    visibleTabs: {
      dashboard: true,
      users: isAdminOrMaster,
      contracts: isAdminOrMaster,
      myContracts: isCommercial,
      myTeam: isCommercial,
      teamEarnings: isMaster,
      crm: true,
      profile: true
    }
  });

  return (
    <Tabs screenOptions={tabScreenOptions}>
      {/* Dashboard - Visibile a tutti */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      
      {/* Utenti - Solo Master e Admin */}
      {isAdminOrMaster && (
        <Tabs.Screen
          name="users"
          options={{
            title: "Utenti",
            tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          }}
        />
      )}
      
      {/* Contratti - Solo Master e Admin */}
      {isAdminOrMaster && (
        <Tabs.Screen
          name="contracts"
          options={{
            title: "Contratti",
            tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
          }}
        />
      )}
      
      {/* I Miei Contratti - Solo Commercial */}
      {isCommercial && (
        <Tabs.Screen
          name="my-contracts"
          options={{
            title: "I Miei Contratti",
            tabBarIcon: ({ color }) => <Briefcase color={color} size={24} />,
          }}
        />
      )}
      
      {/* Il Mio Team - Solo Commercial */}
      {isCommercial && (
        <Tabs.Screen
          name="my-team"
          options={{
            title: "Il Mio Team",
            tabBarIcon: ({ color }) => <UserCheck color={color} size={24} />,
          }}
        />
      )}
      
      {/* Guadagni Team - Solo Master */}
      {isMaster && (
        <Tabs.Screen
          name="team-earnings"
          options={{
            title: "Guadagni Team",
            tabBarIcon: ({ color }) => <TrendingUp color={color} size={24} />,
          }}
        />
      )}
      
      {/* CRM - Visibile a tutti */}
      <Tabs.Screen
        name="crm"
        options={{
          title: "CRM",
          tabBarIcon: ({ color }) => <Building2 color={color} size={24} />,
        }}
      />
      
      {/* Profilo - Visibile a tutti */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profilo",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}