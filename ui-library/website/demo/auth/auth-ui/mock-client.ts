import type { useSignUpAvailable as useRealSignUpAvailable } from '@nocobase/app-plugin-authentication/client';

// The static preview has no application runtime to read the server's published `auth` configuration from, so
// vite.config.ts points the plugin's `client` export at this file, as it points `client/actions` at mock-actions.tsx.
// Typing it from the real export keeps the stand-in on the plugin's contract. The preview shows the sign-up link.
// The name has to be the hook's, since it replaces the hook's export, although the stand-in calls no hook itself.
// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
export const useSignUpAvailable: typeof useRealSignUpAvailable = () => true;
