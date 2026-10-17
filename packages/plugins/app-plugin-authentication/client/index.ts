export * from './auth-client.js';
export { authenticationClientToken } from './tokens.js';
export * from './types.js';
export * from './actions/index.js';
export { useSignUpAvailable } from './sign-up.js';
export { usePasswordResetCapability } from './password-reset-capability.js';

// The registration factory an application lists in its client/plugins.ts.
export { default } from './plugin.js';

export {
  AuthenticationProvider,
  useAuthentication,
  useAuthenticationClient,
} from './auth-provider.js';

export {
  AuthenticationGuard,
  GuestAuthentication,
  RequiredAuthentication,
} from './auth-provider.js';
