import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Profilo",
          headerStyle: {
            backgroundColor: "#1E40AF",
          },
          headerTintColor: "#fff",
        }} 
      />
    </Stack>
  );
}