import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Colors from "@/constants/colors";
import { trpc, getTRPCClient } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import * as ScreenOrientation from "expo-screen-orientation";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="company-selection" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="dispatcher" options={{ headerShown: false }} />
      <Stack.Screen name="driver" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppContent() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      if (Platform.OS !== 'web') {
        try {
          await ScreenOrientation.unlockAsync();
        } catch (e) {
          console.log('ScreenOrientation unlock error', e);
        }
      } else {
        console.log('Web platform, orientation control limited');
      }
      timer = setTimeout(() => {
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
    };
    run();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [trpcClient] = useState(() => getTRPCClient());

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <DataProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <AppContent />
                </GestureHandlerRootView>
              </DataProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
  },
});
