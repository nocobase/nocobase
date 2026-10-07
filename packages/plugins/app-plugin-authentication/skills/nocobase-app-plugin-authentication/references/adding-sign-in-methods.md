# Adding sign-in methods

The plugin is Better Auth with NocoBase storage. Adding a sign-in method is
therefore mostly Better Auth configuration placed in the application, plus
whatever schema, UI, and tests that method needs.

## Choose the mechanism first

| The identity source is                                         | Use                                                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A platform Better Auth supports natively (GitHub, Google, ...) | `socialProviders` in `server/config/auth.ts`                                                                   |
| Any standard OAuth 2.0 or OIDC server                          | Better Auth's `genericOAuth` plugin                                                                            |
| Magic link, email OTP, passkey, two-factor, ...                | The matching official Better Auth plugin                                                                       |
| CLI or device login through the browser                        | `deviceAuthorization()` with `bearer()` ([Better Auth plugins](better-auth-plugins.md#device-login-for-a-cli)) |
| Long-lived credentials for scripts and integrations            | The NocoBase API Keys plugin (`nocobase-app-plugin-api-keys`)                                                  |
| A signed-in user calling an ordinary business API              | Not authentication: a route with `auth.required()`                                                             |
| A proprietary ticket, signature, or enterprise protocol        | [A custom Better Auth plugin](custom-better-auth-plugin.md)                                                    |

Work down the table and stop at the first row that fits. Confirm against the
installed Better Auth version, not from memory: read the version in the
application's lockfile and that version's documentation for the provider or
plugin. Custom code is the last resort because it re-implements security
handling the upstream options already have.

## Settle the requirement before coding

Write these down, and ask when the request does not say:

```text
Sign-in method:
Protocol or identity platform:
How sign-in starts and how the user returns:
Stable external user id (issuer + subject):
Create a user on first sign-in?  yes / no
Link to an existing user?       never / by verified email, confirmed by product
New tables or fields:
Environment variables:
Production callback URL:
Sign out the identity platform too?
```

The stable id is the item that matters most. OAuth and OIDC give an issuer and
a subject; an enterprise protocol has to provide an equivalent. An email is
for display and contact, not for identity, and merging accounts on it is an
account-takeover risk that only a product owner may accept.

## Implementation order

### 1. Configuration and secrets

Read the provider's settings in `server/config/auth.ts` or a sibling file the
config imports, and fail fast when a required value is missing:

```ts
const clientId = process.env.ACME_CLIENT_ID;
const clientSecret = process.env.ACME_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  throw new Error('ACME_CLIENT_ID and ACME_CLIENT_SECRET are required.');
}
```

Map environment variables in `env` of the section's `defineAppConfig`, relative
to the section, and check them with `pnpm nocobase config env`. Secrets never enter
`client/` or a Vite environment variable.

### 2. Register the provider or plugin

```ts
import type { AuthConfig } from '@nocobase/app-plugin-authentication/server';
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import { genericOAuth } from 'better-auth/plugins';
import { username } from 'better-auth/plugins';

const auth: AppConfigFactory<AuthConfig> = defineAppConfig(() => ({
  plugins: [
    username({ displayUsername: false }),
    genericOAuth({
      config: [
        { providerId: 'acme', clientId, clientSecret, discoveryUrl: '...' },
      ],
    }),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  emailAndPassword: { enabled: true, autoSignIn: false },
  session: { storeSessionInDatabase: true },
}));

export default auth;
```

Keep the existing `username` plugin in the array; the plugin prepends it only
when absent. Every endpoint the provider or plugin adds is served under
`/api/auth/*` at once; do not write a Hono route for it.

Add the client counterpart to `client/config/auth.ts` when the plugin has one
(for example `genericOAuthClient()`), so the browser client gains its typed
methods.

### 3. Schema

`socialProviders` and `genericOAuth` use the existing `account` table: `providerId` is the provider, `accountId` the external subject, `userId` the NocoBase user. Nothing to migrate.

Every other Better Auth plugin has to be checked before it is enabled, because configuring it changes nothing in the database. [Enabling an official Better Auth plugin](better-auth-plugins.md#schema) says how to find its schema in the installed version and write the one application migration it needs.

### 4. Client entry

Social and generic OAuth start from the client:

```ts
const { client } = useAuthentication();
await client.signIn.social({
  provider: 'github',
  callbackURL: resolveAppUrl('/'),
});
await client.signIn.oauth2({
  providerId: 'acme',
  callbackURL: resolveAppUrl('/'),
});
```

Put the call in `client/auth/<provider>/` and have an `AuthSsoButtons`
provider entry invoke it; the [client reference](client-session-and-pages.md)
shows the page composition. After the redirect returns, the
`AuthenticationProvider` reads the session on mount, so nothing else needs to
be stored in the browser.

A method that finishes inside the application, such as a ticket exchange,
calls its endpoint and then `refresh()`; it does not replace the session with
the provider's profile, because the server may have mapped, bound, or refused
the account.

### 5. UI and callback

Add the button, tab, or form to the login page. If the provider needs a
dedicated return URL, add one application route for it; otherwise reuse the
existing pages. Handle pending state, user cancellation, provider errors,
double clicks, duplicate callbacks, and the redirect after success.

Register the production callback URL on both sides. Better Auth builds
callback URLs from `app.publicOrigin` and the application's public base path,
so a sub-path deployment needs both set.

## Tests to write

Use a fake provider or a mocked transport; never a real account.

- First sign-in creates the user and the binding; second sign-in reuses them.
- An invalid, expired, tampered, or already-used code, ticket, `state`, or
  `nonce` is rejected.
- Two concurrent first sign-ins produce one binding; the loser re-reads it.
- Sign-up disabled: an unknown subject is rejected.
- After sign-in a route behind `auth.required()` answers `200`; after
  sign-out the same cookie gets `401`.
- The application deployed under a sub-path keeps cookies and callbacks
  correct.
- Any added migration runs `up` and `down`.

## Security checks

Say which of these apply and confirm each that does:

- Callback URL, issuer, audience, and `state`/`nonce` are validated.
- A one-time credential is consumed atomically; shared storage is used when
  more than one instance runs.
- The endpoint is rate-limited.
- Logs contain no credential, ticket, token, or signature.
- No account is merged on an email the platform did not verify.
- Cookies are still issued by Better Auth.
- Secrets exist only on the server.

## Deliverables

Configuration, provider or plugin registration, migration if any, client
helper, UI or callback, tests, and the list of environment variables and
callback URLs the deployer must supply. State explicitly when an item is not
needed and why.
