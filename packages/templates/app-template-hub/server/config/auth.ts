import type { AppConfigFactory } from '@nocobase/app-server/config';
import { hubApiKeyAuthentication } from '@nocobase/app-plugin-hub/server';
import {
  defineAuthConfig,
  type AuthConfig,
} from '@nocobase/app-plugin-authentication/server';
import { bearer, deviceAuthorization, username } from 'better-auth/plugins';

/**
 * The command-line clients that may sign in through the browser (`deviceAuthorization()`): `nocobase-cli`, the id
 * `@nocobase/app-cli-client` sends unless a branded CLI names its own. Add the id of any other CLI that should sign in.
 */
const CLI_CLIENT_IDS: readonly string[] = ['nocobase-cli'];

const auth: AppConfigFactory<AuthConfig> = defineAuthConfig({
  defaults: {
    plugins: [
      username({ displayUsername: false }),
      ...hubApiKeyAuthentication(),
      // A CLI signs in through the browser (RFC 8628): it shows a code the person approves on `/device`, below the
      // application's base path, and receives a session token it sends as `Authorization: Bearer` (`bearer()`).
      deviceAuthorization({
        verificationUri: '/device',
        expiresIn: '10m',
        interval: '5s',
        validateClient: (clientId) => CLI_CLIENT_IDS.includes(clientId),
      }),
      bearer(),
    ],
    emailAndPassword: { enabled: true, autoSignIn: false },
    session: { storeSessionInDatabase: true },
    account: { encryptOAuthTokens: true },
  },
});

export default auth;
