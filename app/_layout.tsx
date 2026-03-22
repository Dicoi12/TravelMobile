import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <NavigationGuard />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F1929' } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="objective/[id]"
            options={{
              headerShown: true,
              title: '',
              headerStyle: { backgroundColor: '#0F1929' },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="event/[id]"
            options={{
              headerShown: true,
              title: '',
              headerStyle: { backgroundColor: '#0F1929' },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="itinerary/[id]"
            options={{
              headerShown: true,
              title: '',
              headerStyle: { backgroundColor: '#0F1929' },
              headerTintColor: '#FFFFFF',
              headerShadowVisible: false,
            }}
          />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
