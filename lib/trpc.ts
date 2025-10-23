import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const normalize = (u: string) => u.replace(/\/$/, "");

const pickProtocol = (hostOrHostPort: string) => {
  const h = hostOrHostPort.toLowerCase();
  if (
    h.includes(':443') ||
    h.startsWith('https') ||
    h.includes('ngrok') ||
    h.includes('exp.direct') ||
    h.includes('trycloudflare') ||
    h.endsWith('.dev')
  ) {
    return 'https://';
  }
  return 'http://';
};

const getBaseUrl = (): string => {
  try {
    const envUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL || (Constants as any)?.expoConfig?.extra?.EXPO_PUBLIC_TOOLKIT_URL;
    
    if (envUrl && typeof envUrl === "string" && envUrl.startsWith("http")) {
      console.log('Using env URL:', envUrl);
      return normalize(envUrl);
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const origin = window.location.origin;
      console.log('Using web origin:', origin);
      return normalize(origin);
    }

    const hostUri = (Constants as any)?.expoGoConfig?.hostUri as string | undefined;
    console.log('Expo Go hostUri:', hostUri);
    
    if (hostUri) {
      const hostPort = hostUri.split("/")[0];
      const protocol = pickProtocol(hostPort);
      const inferred = `${protocol}${hostPort}`;
      console.log('Inferred backend URL:', inferred);
      return normalize(inferred);
    }
  } catch (e) {
    console.error("Error while resolving base URL:", e);
  }

  console.warn('Could not determine backend URL');
  return "/";
};

let cachedClient: ReturnType<typeof trpc.createClient> | null = null;

export const getTRPCClient = () => {
  if (cachedClient) return cachedClient;
  
  const baseUrl = getBaseUrl();
  
  if (!baseUrl) {
    console.warn('No backend URL found. Falling back to relative /api/trpc');
  }

  const apiUrl = `${normalize(baseUrl)}/api/trpc`;
  console.log('tRPC API URL:', apiUrl);

  cachedClient = trpc.createClient({
    links: [
      httpLink({
        url: apiUrl,
        transformer: superjson,
        fetch: async (url, options) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response;
          } catch (err: any) {
            if (err?.name === 'AbortError') {
              console.warn('Backend request timeout - app will work offline');
              throw new Error('Request timeout');
            }
            console.warn('Backend request failed:', err?.message);
            throw err;
          }
        },
      }),
    ],
  });
  
  return cachedClient;
};

export const trpcClient = getTRPCClient();
