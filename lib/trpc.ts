import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const normalize = (u: string) => u.replace(/\/$/, "");

const pickProtocol = (host: string) => {
  const h = host.toLowerCase();
  if (h.includes(":443") || h.includes("https") || h.includes("ngrok") || h.includes("exp.direct") || h.includes("trycloudflare") || h.endsWith(".dev")) {
    return "https://";
  }
  return "http://";
};

const getBaseUrl = (): string => {
  try {
    const envUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL || (Constants as any)?.expoConfig?.extra?.EXPO_PUBLIC_TOOLKIT_URL;
    if (envUrl && typeof envUrl === "string" && envUrl.startsWith("http")) {
      return normalize(envUrl);
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const origin = window.location.origin;
      return normalize(origin);
    }

    const hostUri = (Constants as any)?.expoGoConfig?.hostUri as string | undefined;
    if (hostUri) {
      const host = hostUri.split("/")[0];
      const protocol = pickProtocol(host);
      const inferred = `${protocol}${host}`;
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

export const trpcClient = trpc.createClient({
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
            const text = await response.text();
            console.error("tRPC error response:", text.substring(0, 200));
            throw new Error(`HTTP ${response.status}`);
          }
          return response;
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            console.error("Request timeout after 10s");
            throw new Error('Request timeout');
          }
          console.error("tRPC fetch error:", err?.message || err);
          throw err;
        }
      },
    }),
  ],
});
