# User lifecycle and deployment

## Account state from server code

`userAdministrationServiceToken` is the plugin's administration contract. The
Users plugin builds its page and API on it; application code that needs the
same operations, such as an onboarding job or a compliance workflow, resolves
it too.

```ts
import {
  userAdministrationServiceToken,
  UserAdministrationError,
} from '@nocobase/app-plugin-authentication';

const users = app.container.resolve(userAdministrationServiceToken);
await users.disable(userId);
```

| Method                                              | Effect                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `list({ page, pageSize, search, status, userIds })` | Paged users; `pageSize` caps at 100; `status` is `'enabled'` or `'disabled'`                           |
| `get(userId)`                                       | One user or `undefined`                                                                                |
| `create({ name, email, username?, password })`      | Creates the user and a credential account; email and username are normalized to lower case             |
| `update(userId, { name?, email?, username? })`      | `username: null` clears it                                                                             |
| `disable(userId)`                                   | Sets `disabledAt`, deletes every session, disconnects realtime; sign-in returns `403 ACCOUNT_DISABLED` |
| `enable(userId)`                                    | Clears `disabledAt`; the user signs in again, old sessions stay gone                                   |
| `resetPassword(userId, password)`                   | Rehashes and revokes sessions                                                                          |
| `revokeSessions(userId)`                            | Deletes sessions and disconnects realtime without changing state                                       |
| `withConnection(connection)`                        | Binds every operation to a caller-owned transaction                                                    |

Errors are `UserAdministrationError` with a `code` of `USER_NOT_FOUND`,
`USER_EMAIL_CONFLICT`, `USER_USERNAME_CONFLICT`, `USER_IDENTITY_CONFLICT`,
`PASSWORD_TOO_SHORT`, or `PASSWORD_TOO_LONG`. Map them to stable HTTP
responses; do not surface database errors.

Use `withConnection` when a user change must commit with other rows, for
example creating a user together with its role assignment. The Users plugin's
role scope registry is the place to hook application roles into that flow;
read `nocobase-app-plugin-users` for it. There is no user deletion.

The service does not delete a user and does not send email. Compose a
notification yourself after `resetPassword` when the flow needs one.

## Service accounts

A user's `kind` is `person` or `service`. A service account (an application may show it as an API key's own identity) never signs in: every session it would get is refused with `SERVICE_ACCOUNT_NO_LOGIN` (password, magic link, one-time code, social or OIDC provider), it never gets a password or a linked provider, and its reset link is never sent. It acts only through API keys issued to it. Create one with `userAdministration.createServiceAccount({ name, description })`; it gets an unroutable `@service.invalid` address. `userAdministration.list()` lists people unless `kind: 'service'` or `'all'` is asked for, and `isServiceAccount(user)` tells one apart in code. Disabling or deleting it stops its keys at once, because `Auth.getSession()` re-reads the account on every request.

## Extending the user record

Better Auth's `user.additionalFields` in `server/config/auth.ts` declares
extra columns on `user`, with `input: false` for fields the user may not set
at sign-up. The declaration alone changes nothing: add an application
migration that alters the `user` collection with the same column, and a
`down` that drops it. The plugin already injects `disabledAt`; do not declare
it again.

Prefer an application-owned profile collection keyed by `userId` for anything
beyond a couple of scalar fields. It keeps the authentication tables stable
across plugin upgrades and lets the profile carry its own authorization
rules.

## Hooks

`databaseHooks` in `server/config/auth.ts` runs before or after Better Auth
writes a user, session, account, or verification. Typical uses are stamping
an application field on `user.create.before`, or refusing sign-up for a
domain. The plugin wraps `session.create.before` with the disabled-account
check and still calls the application's hook first; returning `false` from
it blocks the session as usual.

Keep hooks free of external calls that can fail slowly; sign-in waits on
them. Anything that can be done afterwards belongs in a job or a workflow.

## Email verification and password reset

The password-reset pages ship, the email does not. Configure the sender:

```ts
emailAndPassword: {
  enabled: true,
  sendResetPassword: async ({ user, url }) => {
    await mailer.send({ to: user.email, template: 'reset-password', url });
  },
},
emailVerification: {
  sendOnSignUp: true,
  sendVerificationEmail: async ({ user, url }) => { /* ... */ },
},
```

Send through the application's notification plugin rather than a second mail
client; `nocobase-app-plugin-notification` describes the channel to use. The
`url` already points at the application's `/reset-password` route with the
token. Rules that apply to any implementation:

- Respond the same whether or not the email exists.
- Keep the redirect on an allowlist that is the application's own origin.
- Let Better Auth own token expiry and single use; do not add a parallel
  token table.
- Do not expose the forgot-password link in production until the sender is
  configured and tested.

## Deployment

**Secret.** Better Auth's keys are derived from the application's
`secrets.keys` (`SECRETS_KEYS` in the environment), for the purpose
`@nocobase/app-plugin-authentication/better-auth`: identical on every
instance, never in source or in a browser build. An `auth.secret` beside
them is passed to Better Auth as its legacy secret, so data it encrypted
before still decrypts; `auth.secret` alone still works, and `auth.secrets`
set in `server/config/auth.ts` is used as written. With none of these the
application refuses to start, naming `secrets.keys`; a standalone start names
`pnpm nocobase config init`, which generates it. The plugin never invents a
secret: one made up at boot changes on every restart and silently invalidates
every session. Better Auth signs its session cookie with the current key, so
putting a new key first in `secrets.keys`, or adding `secrets.keys` beside an
existing `auth.secret`, signs every user out once.

**Public origin.** Set `app.publicOrigin` to the HTTPS address the browser
sees. Better Auth derives its base URL and callback URLs from it and from the
application's public base path; a container-internal address breaks OAuth
callbacks and cookie attributes. The reverse proxy must forward host,
protocol, and cookies.

**Business request CSRF.** `Auth.required()` and `Auth.optional()` reject cookie-bearing writes unless `Origin` (or, when absent, `Referer`) matches Better Auth's configured base origin or a trusted origin. Configure `app.publicOrigin` for deployed applications and add separate frontend origins through `auth.trustedOrigins`; without a trusted origin, browser writes fail closed with `403 PERMISSION_DENIED`, reason `INVALID_CSRF_ORIGIN`, in the standard error body. Cookie-free API key requests can proceed after authentication. A credential header does not exempt a request carrying cookies, including routes that skip session lookup.

**Cookies.** The plugin derives the cookie prefix from the application name
and the cookie path from the public base path. Override
`advanced.defaultCookieAttributes` only with a reason: `secure` off is for
local HTTP only, `sameSite` changes affect OAuth returns, and widening
`domain` shares the cookie with every sub-domain. Two applications on one
host need distinct prefixes.

**Shared storage.** `session.storeSessionInDatabase: true` keeps sessions in
the database. Rate-limit counters, one-time values, and the session cache
live in the application's cache through `createAuthStorage`; a multi-instance
deployment needs a shared cache provider such as Redis or those diverge per
instance.

**Logs.** Never log passwords, session tokens, verification values, tickets,
or OAuth tokens; log user ids, request ids, and outcomes. Return stable
authentication error codes, not adapter errors.
`databaseAdapter({ debugLogs: true })` is for controlled diagnosis only.

**Checklist before go-live.** Secret from secure configuration on every
instance; public origin is the real HTTPS address; cookie prefix, path,
`secure`, and `sameSite` verified under the deployed path; authentication
migrations applied; shared cache for more than one instance; sign-in,
sign-up, sign-out, session read, and password reset checked in a real
browser; anonymous requests refused by every protected route; logs and error
bodies free of credentials.
