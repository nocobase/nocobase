/**
 * The snippets of the guides to turning on two-factor authentication and passkeys. Each names only exports Better Auth
 * 1.7 ships: `twoFactor` from `better-auth/plugins` and `twoFactorClient` from `better-auth/client/plugins`;
 * `passkey` from the separate `@better-auth/passkey` package and `passkeyClient` from `@better-auth/passkey/client`.
 * The migrations spell out the plugins' schema in that version (`twoFactor/schema.ts`, `passkey/schema.ts`).
 */

export type MethodGuide = 'twoFactor' | 'passkey';

export interface MethodGuideSnippets {
  /** A dependency to install first, or `undefined` when Better Auth already ships the plugin. */
  readonly install?: string;
  readonly server: string;
  readonly client: string;
  readonly migration: string;
}

export interface PasskeyRelyingParty {
  /** The domain passkeys are bound to: the public origin's host name, without scheme or port. */
  readonly rpID: string;
  /** The exact address the browser shows, scheme and port included. */
  readonly origin: string;
}

const PLACEHOLDER_ORIGIN = 'https://<your-domain>';

/** The relying party a passkey belongs to, from `app.publicOrigin`; placeholders without one. */
export function passkeyRelyingParty(
  publicOrigin: string | null | undefined,
): PasskeyRelyingParty {
  if (publicOrigin) {
    try {
      const url = new URL(publicOrigin);
      return { rpID: url.hostname, origin: url.origin };
    } catch {
      // Fall through to the placeholders; the settings page flags the origin.
    }
  }
  return { rpID: '<your-domain>', origin: PLACEHOLDER_ORIGIN };
}

const TWO_FACTOR_MIGRATION = `// database/main/migrations/<timestamp>_create_two_factor.ts
// The twoFactor() schema in better-auth 1.7.21.
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '<timestamp>_create_two_factor',

  async up({ builder }) {
    await builder.alterCollection('user', (collection) => {
      collection.boolean('twoFactorEnabled').nullable().defaultTo(false);
    });
    await builder.createCollection('twoFactor', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('secret', { length: 255 }).notNull();
      collection.text('backupCodes').notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.boolean('verified').nullable().defaultTo(true);
      collection.integer('failedVerificationCount').nullable().defaultTo(0);
      collection.datetime('lockedUntil').nullable();

      collection.primary('id', { name: 'pk_two_factor' });
      collection.index('secret', { name: 'idx_two_factor_secret' });
      collection.index('userId', { name: 'idx_two_factor_user' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('twoFactor');
    await builder.alterCollection('user', (collection) => {
      collection.dropField('twoFactorEnabled');
    });
  },
});

export default migration;`;

const PASSKEY_MIGRATION = `// database/main/migrations/<timestamp>_create_passkey.ts
// The passkey() schema in @better-auth/passkey 1.7.21, with credentialID stored as
// credentialId: an all-caps suffix does not survive the snake_case column names.
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '<timestamp>_create_passkey',

  async up({ builder }) {
    await builder.createCollection('passkey', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('name', { length: 255 }).nullable();
      collection.text('publicKey').notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.string('credentialId', { length: 255 }).notNull();
      collection.integer('counter').notNull();
      collection.string('deviceType', { length: 32 }).notNull();
      collection.boolean('backedUp').notNull();
      collection.string('transports', { length: 255 }).nullable();
      collection.datetime('createdAt').nullable();
      collection.string('aaguid', { length: 64 }).nullable();

      collection.primary('id', { name: 'pk_passkey' });
      collection.index('userId', { name: 'idx_passkey_user' });
      collection.index('credentialId', { name: 'idx_passkey_credential' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('passkey');
  },
});

export default migration;`;

/** The snippets the guide to `method` hands over; `publicOrigin` fills in the passkey relying party. */
export function methodGuideSnippets(
  method: MethodGuide,
  publicOrigin?: string | null,
): MethodGuideSnippets {
  if (method === 'twoFactor')
    return {
      server: [
        '// server/config/auth.ts → defaults.plugins (keep the plugins already there)',
        "import { twoFactor } from 'better-auth/plugins';",
        '',
        "twoFactor({ issuer: '<application name>' }),",
      ].join('\n'),
      client: [
        '// client/config/auth.ts → plugins',
        "import { twoFactorClient } from 'better-auth/client/plugins';",
        '',
        'twoFactorClient(),',
      ].join('\n'),
      migration: TWO_FACTOR_MIGRATION,
    };
  const party = passkeyRelyingParty(publicOrigin);
  return {
    install:
      'pnpm add @better-auth/passkey@<the better-auth version in pnpm-lock.yaml>',
    server: [
      '// server/config/auth.ts → defaults.plugins (keep the plugins already there)',
      "import { passkey } from '@better-auth/passkey';",
      '',
      'passkey({',
      `  rpID: '${party.rpID}',`,
      "  rpName: '<application name>',",
      `  origin: '${party.origin}',`,
      '  // Column names are snake_case, which cannot spell credentialID back.',
      "  schema: { passkey: { fields: { credentialID: 'credentialId' } } },",
      '}),',
    ].join('\n'),
    client: [
      '// client/config/auth.ts → plugins',
      "import { passkeyClient } from '@better-auth/passkey/client';",
      '',
      'passkeyClient(),',
    ].join('\n'),
    migration: PASSKEY_MIGRATION,
  };
}
