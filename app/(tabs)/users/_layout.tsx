import { Stack } from "expo-router";

export default function UsersLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Gestione Utenti",
          headerStyle: {
            backgroundColor: "#1E40AF",
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}