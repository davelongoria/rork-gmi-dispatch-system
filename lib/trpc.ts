import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const normalize = (u: string) => u.replace(/\/$/, "");

const getBaseUrl = (): string => {
  try {
    const envUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL;
    if (envUrl && typeof envUrl === "string" && envUrl.startsWith("http")) {
      console.log("Backend URL from env:", envUrl);
      return normalize(envUrl);
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const origin = window.location.origin;
      console.warn("Backend URL fallback to window.origin:", origin);
      return normalize(origin);
    }

    const hostUri = (Constants as any)?.expoGoConfig?.hostUri as string | undefined;
    if (hostUri) {
      const inferred = `http://${hostUri.split("/")[0]}`;
      console.warn("Backend URL inferred from expoGoConfig.hostUri:", inferred);
      return normalize(inferred);
    }
  } catch (e) {
    console.error("Error while resolving base URL:", e);
  }

  throw new Error(
    "No backend URL found. Set EXPO_PUBLIC_TOOLKIT_URL (rork start sets it)."
  );
};

const apiUrl = `${getBaseUrl()}/api/trpc`;
console.log("tRPC base URL:", apiUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: apiUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('tRPC fetch to:', url);
        try {
          const response = await fetch(url, options);
          console.log('tRPC response status:', response.status);
          if (!response.ok) {
            const text = await response.text();
            console.error('tRPC error response:', text.substring(0, 500));
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
          }
          return response;
        } catch (err) {
          console.error('tRPC fetch error:', err);
          throw err;
        }
      },
    }),
  ],
});
