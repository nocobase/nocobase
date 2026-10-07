# A custom Better Auth plugin

Read [enabling an official Better Auth plugin](better-auth-plugins.md) first: an official plugin, such as `deviceAuthorization()` for a CLI's sign-in, is preferred whenever one fits.

Write one only when the identity platform uses a protocol none of the
mechanisms in [adding sign-in methods](adding-sign-in-methods.md) can express:
a proprietary ticket, a bespoke signature, an internal enterprise handshake. A plugin belongs in the sign-in path when it has to take
part in verifying identity, binding accounts, or creating the session; a
feature that only runs after sign-in is an ordinary protected route.

Before starting, know how the credential is verified, how long it lives,
whether it is single-use, which issuer, audience, domain, `state`, or `nonce`
must be checked, whether first sign-in may create a user, and whether sign-out
must reach the platform.

## Layout

```text
server/auth/ticket/
  plugin.ts            Better Auth plugin: endpoint, schema, rate limit, errors
  protocol-client.ts   calls the platform, verifies signatures, normalizes identity
  types.ts
database/migrations/
  202608210001_create_ticket_accounts.ts
client/auth/ticket/
  auth.ts              calls the endpoint, then refreshes the session
  sign-in-button.tsx
  callback-page.tsx    only if the platform needs a dedicated return URL
```

`plugin.ts` knows Better Auth; `protocol-client.ts` knows the platform.
Keeping them apart makes the platform client testable with a fake and keeps
Better Auth internals out of protocol code.

## The flow being built

```text
button -> platform -> returns with ticket -> POST /api/auth/sign-in/ticket
  -> verify ticket -> consume it once -> find binding by issuer + subject
  -> find or create user by policy -> create Better Auth session -> set cookie
```

## Plugin skeleton

```ts
import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint } from 'better-auth/api';

export interface TicketAuthOptions {
  issuer: string;
  audience: string;
  allowSignUp?: boolean;
  verifyTicket(input: { ticket: string; request: Request }): Promise<{
    subject: string;
    email?: string;
    emailVerified: boolean;
    name?: string;
    expiresAt: Date;
  }>;
}

export function ticketAuth(options: TicketAuthOptions): BetterAuthPlugin {
  return {
    id: 'nocobase-ticket-auth',
    schema: ticketAccountSchema,
    endpoints: {
      signInWithTicket: createAuthEndpoint(
        '/sign-in/ticket',
        {
          method: 'POST',
          requireRequest: true,
          body: ticketBodySchema,
          metadata: { noStore: true },
        },
        async (context) => {
          const identity = await options.verifyTicket({
            ticket: context.body.ticket,
            request: context.request,
          });
          if (identity.expiresAt <= new Date()) {
            throw new APIError('UNAUTHORIZED', {
              code: 'TICKET_EXPIRED',
              message: 'The sign-in ticket has expired.',
            });
          }
          // 1. consume a hashed digest of the ticket atomically (secondary storage)
          // 2. look up the binding by issuer + subject
          // 3. find or create the user according to allowSignUp
          // 4. create the session through context.context.internalAdapter
          // 5. set the cookie with the helper from 'better-auth/cookies'
          // 6. return { user, session } without secrets
        },
      ),
    },
    rateLimit: [
      { pathMatcher: (path) => path === '/sign-in/ticket', window: 60, max: 5 },
    ],
    $ERROR_CODES: {
      INVALID_TICKET: {
        code: 'INVALID_TICKET',
        message: 'The sign-in ticket is invalid.',
      },
      TICKET_EXPIRED: {
        code: 'TICKET_EXPIRED',
        message: 'The sign-in ticket has expired.',
      },
      TICKET_REPLAYED: {
        code: 'TICKET_REPLAYED',
        message: 'The sign-in ticket has already been used.',
      },
    },
    options,
  };
}
```

`ticketBodySchema` is a Standard Schema validator from a library the
application already depends on; cap the ticket length so arbitrary input is
never forwarded to the platform.

Use only public Better Auth entry points: `better-auth`, `better-auth/api`,
`better-auth/cookies`, and the endpoint context's adapters. Never import from
`dist/*`, never issue a JWT of your own, and never store a session token in
the browser. The session must be a Better Auth session so `auth.required()`,
`getSession`, the guards, and sign-out keep working.

## Storing the binding

When the platform only yields standard provider data, reuse `account`: `providerId` identifies a stable configured provider, `accountId` is its subject, and `userId` identifies the application user. Better Auth 1.7.5 uses the unique pair `providerId + accountId`; the account table has no `issuer` column. Give distinct identity issuers distinct provider IDs, including separate tenants of the same platform, and continue verifying the protocol issuer and audience. Do not reuse a provider ID for a different issuer or merge identities by email. When the protocol needs queryable extras such as a tenant or device id, declare a model in the plugin's `schema` and create it with an application migration:

```ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202608210001_create_ticket_accounts',
  async up({ builder }) {
    await builder.createCollection('ticketAccount', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.string('issuer', { length: 512 }).notNull();
      collection.string('subject', { length: 512 }).notNull();
      collection.datetime('createdAt').notNull();
      collection.datetime('updatedAt').notNull();
      collection.primary('id', { name: 'pk_ticket_account' });
      collection.unique(['issuer', 'subject'], {
        name: 'uq_ticket_account_issuer_subject',
      });
      collection.index('userId', { name: 'idx_ticket_account_user' });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('ticketAccount');
  },
});

export default migration;
```

The plugin schema and the migration describe the same structure; change both
together. Do not add physical foreign keys to the authentication tables.

## Replay protection

"Read then delete" races under concurrency. Hash the credential with a purpose
prefix, store only the digest with a short TTL, and consume it with an atomic
operation. The plugin's secondary storage, `createAuthStorage`, provides
`getAndDelete` and `increment` on the application's cache, which is shared
across instances when the cache provider is. Keep the platform's own
single-use guarantee as a second layer, not the only one.

## User creation policy

- **Existing binding only.** Unknown subjects are refused; an administrator
  or a signed-in user creates the binding. The safe default for internal
  systems.
- **Create on first sign-in.** Only when the application allows registration.
  Handle a missing email or name without fabricating a verified contact.
- **Link by verified email.** Convenient and the easiest way to take over an
  account. Use it only when the platform's verification is trusted and the
  product owner has agreed in writing; audit the conflict cases.

## Registering and calling it

Add `ticketAuth({ ... })` to `plugins` in `server/config/auth.ts`; the
endpoint becomes `POST /api/auth/sign-in/ticket` with no extra route. On the
client, post the ticket through the Better Auth client's `$fetch` or the
application API client, then call `refresh()` from `useAuthentication()`.

## Tests

Cover, with a fake platform:

- new and returning user sign-in, cookie set, protected route reachable,
  sign-out invalidates;
- invalid, expired, tampered, mismatched issuer or audience, cancelled, and
  reused ticket;
- unknown subject refused when sign-up is off; one binding under two
  concurrent first sign-ins; unique-constraint loser re-reads the winner;
- migration `up` and `down`, both naming strategies, no foreign keys.

## Before release

Production issuer, audience, and endpoints; secrets server-side only;
callback registered on both sides; cookie path matches the public base path;
one-time credentials expire, consume atomically, and are rate-limited;
migration applied; shared storage across instances; logs free of credentials;
the user creation policy confirmed by the product owner.
