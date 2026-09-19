import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DbProvider, useDb } from '@/store/DbContext';
import { Loading } from '@/components/ui';
import { ToastProvider } from '@/components/layout/Toast';

function RootStack() {
  const { ready, user } = useDb();
  if (!ready) return <Loading />;
  return (
    <>
      {/* Login nền tối -> chữ trắng; trong app header trắng -> chữ đen */}
      <StatusBar style={user ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <DbProvider>
            <RootStack />
          </DbProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
