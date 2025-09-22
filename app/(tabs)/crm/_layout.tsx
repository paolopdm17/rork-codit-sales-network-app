import { Stack } from "expo-router";
import React from "react";

export default function CRMLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1E40AF",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold" as const,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "CRM",
        }}
      />
    </Stack>
  );
}