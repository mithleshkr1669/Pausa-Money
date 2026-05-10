const key = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "") as string;

export const CLERK_PUBLISHABLE_KEY = key;

export const isClerkConfigured =
  (key.startsWith("pk_test_") || key.startsWith("pk_live_")) &&
  !key.includes("YOUR_CLERK");
