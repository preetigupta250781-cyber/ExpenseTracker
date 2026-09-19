import { Tabs } from 'expo-router';

import { theme } from '../../components/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: 'Fraunces_700Bold' },
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopWidth: 0 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontFamily: 'Manrope_700Bold' }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
        }}
      />
    </Tabs>
  );
}
