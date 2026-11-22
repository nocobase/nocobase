// @vitest-environment node
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { BetterAuthPlugin } from 'better-auth';
import { createAuthEndpoint } from 'better-auth/api';
import { mergeSchema } from 'better-auth/db';
import { twoFactor } from 'better-auth/plugins';
import { afterEach, describe, expect, it } from 'vitest';

import {
  methodGuideSnippets,
  type MethodGuide,
} from '../../../client/pages/method-guides.js';
import { createAuthFixture } from './support.js';

const directory = new URL(
  './fixtures/method-guide-migrations/',
  import.meta.url,
);
const guideMigrations = [
  {
    packageName: 'method-guide-test',
    directory: fileURLToPath(directory),
  },
];
const files: Record<MethodGuide, readonly [string, string]> = {
  twoFactor: ['202612010001', '202612010001_create_two_factor.ts'],
  passkey: ['202612010002', '202612010002_create_passkey.ts'],
};

/** The migration a guide hands over, as the application would save it: without the path comment, with a timestamp. */
function guideMigration(method: MethodGuide): string {
  const [timestamp] = files[method];
  return `${methodGuideSnippets(method)
    .migration.split('\n')
    .slice(1)
    .join('\n')
    .replaceAll('<timestamp>', timestamp)}\n`;
}

/** RFC 6238 with Better Auth's defaults (SHA-1, 6 digits, 30 seconds); the URI carries the secret in base32. */
function totp(base32: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const character of base32.replace(/=+$/u, '').toUpperCase())
    bits += alphabet.indexOf(character).toString(2).padStart(5, '0');
  const key = Buffer.from(
    (bits.match(/.{8}/gu) ?? []).map((byte) => Number.parseInt(byte, 2)),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const hmac = createHmac('sha1', key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, '0');
}

/**
 * Stands in for `passkey()`, whose package the authentication plugin does not install: its model as
 * `@better-auth/passkey` 1.7.21 declares it, merged with the field mapping the guide's snippet passes as `schema`, and
 * an endpoint that stores and finds a credential the way the plugin does, by `credentialID`.
 */
const passkeySchemaProbe = {
  id: 'test-passkey-schema',
  schema: mergeSchema(
    {
      passkey: {
        fields: {
          name: { type: 'string', required: false },
          publicKey: { type: 'string', required: true },
          userId: {
            type: 'string',
            references: { model: 'user', field: 'id' },
            required: true,
            index: true,
          },
          credentialID: { type: 'string', required: true, index: true },
          counter: { type: 'number', required: true },
          deviceType: { type: 'string', required: true },
          backedUp: { type: 'boolean', required: true },
          transports: { type: 'string', required: false },
          createdAt: { type: 'date', required: false },
          aaguid: { type: 'string', required: false },
        },
      },
    },
    { passkey: { fields: { credentialID: 'credentialId' } } },
  ),
  endpoints: {
    testPasskey: createAuthEndpoint(
      '/test/passkey',
      { method: 'POST' },
      async (context) => {
        const adapter = context.context.adapter;
        await adapter.create({
          model: 'passkey',
          data: {
            name: 'Laptop',
            publicKey: 'p'.repeat(400),
            userId: 'user-1',
            credentialID: 'c'.repeat(200),
            counter: 0,
            deviceType: 'multiDevice',
            backedUp: true,
            transports: 'internal,hybrid',
            createdAt: new Date(),
            aaguid: '08987058-cadc-4b81-b6e1-30de50dcbe96',
          },
        });
        return context.json(
          await adapter.findOne({
            model: 'passkey',
            where: [{ field: 'credentialID', value: 'c'.repeat(200) }],
          }),
        );
      },
    ),
  },
} satisfies BetterAuthPlugin;

describe('the migrations the two-factor and passkey guides hand over', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  it('are the ones this test runs', () => {
    for (const method of ['twoFactor', 'passkey'] as const)
      expect(readFileSync(new URL(files[method][1], directory), 'utf8')).toBe(
        guideMigration(method),
      );
  });

  it('give twoFactor() the tables it needs to turn on and check a one-time code', async () => {
    const fixture = await createAuthFixture(
      {
        emailAndPassword: { enabled: true },
        plugins: [twoFactor({ issuer: 'NocoBase' })],
      },
      undefined,
      guideMigrations,
    );
    fixtures.push(fixture);
    const { cookie } = await fixture.signUp();
    const post = (path: string, body: unknown) =>
      fixture.router.request(`/api/auth${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie,
          origin: 'http://localhost',
        },
        body: JSON.stringify(body),
      });

    const enabled = await post('/two-factor/enable', {
      password: 'correct horse battery staple',
    });
    expect(enabled.status).toBe(200);
    const { totpURI } = (await enabled.json()) as { totpURI: string };
    const secret = new URL(totpURI).searchParams.get('secret') ?? '';

    const verified = await post('/two-factor/verify-totp', {
      code: totp(secret),
    });
    expect(verified.status).toBe(200);
    const user = await fixture.connection.query
      .selectFrom('user')
      .select(['twoFactorEnabled'])
      .executeTakeFirstOrThrow();
    expect(Boolean(user.twoFactorEnabled)).toBe(true);
    expect(
      await fixture.connection.query
        .selectFrom('twoFactor')
        .select(['verified'])
        .execute(),
    ).toEqual([{ verified: expect.anything() }]);
  });

  it('give passkey() a table it reads and writes through Better Auth with the guide’s field mapping', async () => {
    const fixture = await createAuthFixture(
      { plugins: [passkeySchemaProbe] },
      undefined,
      guideMigrations,
    );
    fixtures.push(fixture);
    const response = await fixture.router.request('/api/auth/test/passkey', {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      credentialID: 'c'.repeat(200),
      publicKey: 'p'.repeat(400),
      counter: 0,
      backedUp: true,
    });
    expect(
      await fixture.connection.query
        .selectFrom('passkey')
        .select(['credentialId'])
        .execute(),
    ).toEqual([{ credentialId: 'c'.repeat(200) }]);
  });
});
