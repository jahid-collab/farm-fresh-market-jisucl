
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'cart',
      route: '/(tabs)/cart',
      icon: 'shopping_cart',
      label: 'Cart',
    },
    {
      name: 'favorites',
      route: '/(tabs)/favorites',
      icon: 'favorite',
      label: 'Favorites',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="cart" name="cart" />
        <Stack.Screen key="favorites" name="favorites" />
        <Stack.Screen key="profile" name="profile" />
        <Stack.Screen key="auth" name="auth" />
        <Stack.Screen key="edit-profile" name="edit-profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
