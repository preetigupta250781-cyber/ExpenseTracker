import { Stack } from 'expo-router';
import '../global.css';
import { useFonts, Fraunces_400Regular, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { ActivityIndicator, View } from 'react-native';
import { theme } from '../components/theme';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    Manrope_400Regular,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ 
          presentation: 'modal', 
          title: 'Add Transaction', 
          headerShown: true, 
          headerStyle: { backgroundColor: theme.colors.surface }, 
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontFamily: 'Fraunces_700Bold' }
        }} />
      </Stack>
    </>
  );
}
