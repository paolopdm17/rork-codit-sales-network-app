import { Tabs, router } from "expo-router";
import { Home, Users, FileText, Settings, Briefcase, TrendingUp, UserCheck, Building2 } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/auth-context";

export default function TabLayout() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated]);

  // Memoize role checks to prevent unnecessary re-renders
  const userRoles = useMemo(() => {
    const isAdmin = user?.role === "admin";
    const isMaster = user?.role === "master";
    const isAdminOrMaster = isAdmin || isMaster;
    const isCommercial = user?.role === "commercial";
    
    return { isAdmin, isMaster, isAdminOrMaster, isCommercial };
  }, [user?.role]);
  
  const { isAdmin, isMaster, isAdminOrMaster, isCommercial } = userRoles;

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

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      {isAdminOrMaster && (
        <Tabs.Screen
          name="users"
          options={{
            title: "Utenti",
            tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          }}
        />
      )}
      {isAdminOrMaster && (
        <Tabs.Screen
          name="contracts"
          options={{
            title: "Contratti",
            tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
          }}
        />
      )}
      {!isAdminOrMaster && (
        <Tabs.Screen
          name="my-contracts"
          options={{
            title: "I Miei Contratti",
            tabBarIcon: ({ color }) => <Briefcase color={color} size={24} />,
          }}
        />
      )}
      {isCommercial && (
        <Tabs.Screen
          name="my-team"
          options={{
            title: "Il Mio Team",
            tabBarIcon: ({ color }) => <UserCheck color={color} size={24} />,
          }}
        />
      )}
      {isMaster && (
        <Tabs.Screen
          name="team-earnings"
          options={{
            title: "Guadagni Team",
            tabBarIcon: ({ color }) => <TrendingUp color={color} size={24} />,
          }}
        />
      )}
      <Tabs.Screen
        name="crm"
        options={{
          title: "CRM",
          tabBarIcon: ({ color }) => <Building2 color={color} size={24} />,
        }}
      />
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