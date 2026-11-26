import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { MiddlewareHandler } from 'hono';

import type { Auth } from './auth.js';
import type { SignInMethodRegistry } from './sign-in-methods.js';
import type { UserAdministrationService } from './user-administration.js';

export const authenticationToken: ServiceToken<Auth> = createServiceToken<Auth>(
  '@nocobase/app/authentication',
);

export const userAdministrationServiceToken: ServiceToken<UserAdministrationService> =
  createServiceToken<UserAdministrationService>(
    '@nocobase/app/authentication/user-administration',
  );

/**
 * The sign-in methods other plugins add to the Authentication settings page, such as API keys. Add one at
 * boot with `container.resolve(signInMethodsToken).add({...})`, after checking `container.has(signInMethodsToken)`.
 */
export const signInMethodsToken: ServiceToken<SignInMethodRegistry> =
  createServiceToken<SignInMethodRegistry>(
    '@nocobase/app/authentication/sign-in-methods',
  );

/** The settings item that grants reading the Authentication settings, with the `read` action. */
export const AUTHENTICATION_SETTINGS_ID = 'authentication.settings';

/**
 * The permission check in front of `GET /api/authentication/settings`, run after `auth.required()`: it calls `next()`
 * when the caller may read the `authentication.settings` settings item and throws a `403` otherwise. The
 * authorization plugin binds it, since this plugin cannot depend on that one; without a binding the route answers
 * `403` to everyone.
 */
export const authenticationSettingsAccessToken: ServiceToken<MiddlewareHandler> =
  createServiceToken<MiddlewareHandler>(
    '@nocobase/app/authentication/settings-access',
  );
