import { useClientApplication } from '@nocobase/app-client';

declare module '@nocobase/app-client' {
  /** The `auth` fields `defineAuthConfig` publishes; keep in step with `AUTH_PUBLIC_PATHS` on the server. */
  interface PublicAppConfig {
    auth: {
      passwordReset?: { available?: boolean };
      emailAndPassword?: { enabled?: boolean; disableSignUp?: boolean };
    };
  }
}

/**
 * Whether the server accepts password sign-up, from the `auth` fields it publishes.
 *
 * Both have to allow it: password authentication enabled and sign-up not disabled. A field the server does not publish
 * reads as Better Auth's default, which allows sign-up, so an application that has not declared its `auth` section
 * with `defineAuthConfig` keeps showing registration.
 */
export function useSignUpAvailable(): boolean {
  const config = useClientApplication().config.public;
  // `has` first, so an application that publishes neither field does not warn on every render.
  const enabled = config.has('auth.emailAndPassword.enabled')
    ? config.get('auth.emailAndPassword.enabled')
    : undefined;
  const disableSignUp = config.has('auth.emailAndPassword.disableSignUp')
    ? config.get('auth.emailAndPassword.disableSignUp')
    : undefined;
  return enabled !== false && disableSignUp !== true;
}

export function usePasswordResetAvailable(): boolean {
  const config = useClientApplication().config.public;
  return (
    config.has('auth.passwordReset.available') &&
    config.get('auth.passwordReset.available') === true
  );
}
