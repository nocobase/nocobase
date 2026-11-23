import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
export const authenticationClientToken: ServiceToken<unknown> =
  createServiceToken<unknown>('@nocobase/authentication/client');

/** What the application tells the authentication plugin's pages about itself, from `authentication({ ... })`. */
export interface AuthenticationClientSettings {
  /** The providers the application's sign-in page shows a button for, by provider id. */
  readonly signInButtons: readonly string[];
}

export const authenticationClientSettingsToken: ServiceToken<AuthenticationClientSettings> =
  createServiceToken<AuthenticationClientSettings>(
    '@nocobase/authentication/client-settings',
  );
