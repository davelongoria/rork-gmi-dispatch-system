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
      fetch: (url, options) => {
        console.log('tRPC fetch to:', url);
        return fetch(url, options).catch(err => {
          console.error('tRPC fetch error:', err);
          throw err;
        });
      },
    }),
  ],
});
