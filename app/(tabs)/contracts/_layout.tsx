import { Stack } from "expo-router";

export default function ContractsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Contratti",
          headerStyle: {
            backgroundColor: "#1E40AF",
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}