import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  console.log('EXPO_PUBLIC_RORK_API_BASE_URL:', baseUrl);
  
  if (baseUrl) {
    return baseUrl;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL. Current env: " + JSON.stringify(process.env)
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('tRPC fetch to:', url);
        console.log('tRPC fetch options:', JSON.stringify(options, null, 2));
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
