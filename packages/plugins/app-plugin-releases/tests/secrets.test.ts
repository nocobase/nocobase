/**
 * Credentials sealed with the application's secrets service, and the secrets an App's `config.yml` gets.
 */
import { createSecretsService } from '@nocobase/app-server/secrets';
import { afterEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { createReleasesSecretsStores } from '../server/secrets-stores.js';
import { ensureConfigSecrets } from '../server/services/config-file.js';
import { decryptText } from '../server/services/secrets.js';
import {
  createArtifact,
  createHarness,
  streamOf,
  type Harness,
} from './harness.js';

const v1 = { version: 1, key: '1'.repeat(64) };
const v2 = { version: 2, key: '2'.repeat(64) };

describe('credentials', () => {
  let harness: Harness | undefined;
  afterEach(async () => {
    await harness?.close();
    harness = undefined;
  });

  it('are resealed under a new key by the plugin’s secrets stores', async () => {
    harness = await createHarness({
      secrets: createSecretsService({ keys: [v1] }),
    });
    const admin = await harness.as('admin', 'admin');
    await harness.services.environments.create(admin, {
      id: 'remote',
      name: 'Remote',
      driver: 'fake',
      secret: { token: 'environment-token' },
    });
    await harness.services.registries.create(admin, {
      id: 'ghcr',
      name: 'GHCR',
      url: 'ghcr.io/',
      namespace: 'acme',
      pullUsername: 'bot',
      secretChanges: { pullPassword: 'registry-password' },
    });

    // Variables, and what a deployment keeps of its variables and its first administrator.
    await harness.services.environments.setVariable(admin, 'remote', 'REGION', {
      value: 'eu',
    });
    await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'remote',
    });
    await harness.services.releases.setAppVariable(admin, 'shop', 'TOKEN', {
      value: 'a',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0', {
      variables: {
        schemaVersion: 1,
        variables: [
          {
            name: 'INITIAL_ADMIN_PASSWORD',
            path: 'users.initialAdmin.password',
            secret: true,
            required: false,
            firstStartOnly: true,
            generate: 'password',
          },
        ],
      },
    });
    const release = await harness.services.releases.uploadRelease(
      admin,
      'shop',
      { stream: streamOf(artifact.bytes) },
    );
    await harness.services.releases.waitForDeployment(
      (
        await harness.services.releases.deploy(admin, 'shop', {
          releaseId: release.id,
        })
      ).id,
    );

    const rotated = createSecretsService({ keys: [v2, v1] });
    const stores = createReleasesSecretsStores(() =>
      harness!.database.connection(),
    );
    const context = { secrets: rotated, batchSize: 10, dryRun: false };
    const sealed: Record<string, number> = {
      '@nocobase/app-plugin-releases/environments': 1,
      '@nocobase/app-plugin-releases/registries': 1,
      '@nocobase/app-plugin-releases/environment-variables': 1,
      '@nocobase/app-plugin-releases/app-variables': 1,
      '@nocobase/app-plugin-releases/deployments': 2,
    };
    expect(stores.map((store) => store.name)).toEqual(Object.keys(sealed));
    for (const store of stores) {
      const count = sealed[store.name];
      expect(await store.status(context)).toMatchObject({ needsReseal: count });
      expect(await store.reseal(context)).toEqual({
        resealed: count,
        failed: 0,
      });
    }

    const current = createSecretsService({ keys: [v2] });
    const row = async (table: string, id: string) =>
      String(
        (
          await harness!.database
            .connection()
            .query.selectFrom(table)
            .select('secret')
            .where('id', '=', id)
            .executeTakeFirst()
        )?.secret,
      );
    expect(
      JSON.parse(
        decryptText(
          await row('relEnvironments', 'remote'),
          ['remote'],
          current,
          'environment-credentials',
        ),
      ),
    ).toEqual({ token: 'environment-token' });
    expect(
      JSON.parse(
        decryptText(
          await row('relRegistries', 'ghcr'),
          ['ghcr'],
          current,
          'registry-credentials',
        ),
      ),
    ).toEqual({ pullPassword: 'registry-password' });
  });

  it('cannot be stored without secrets keys', async () => {
    harness = await createHarness({
      secrets: createSecretsService({ keys: [] }),
    });
    const admin = await harness.as('admin', 'admin');
    await expect(
      harness.services.environments.create(admin, {
        id: 'remote',
        name: 'Remote',
        driver: 'fake',
        secret: { token: 'x' },
      }),
    ).rejects.toMatchObject({
      reason: 'SECRETS_NOT_CONFIGURED',
      status: 'UNAVAILABLE',
    });
  });
});

describe('ensureConfigSecrets', () => {
  const read = (content: string) => parseYaml(content) as Record<string, any>;

  it('generates secrets.keys beside auth and session secrets', () => {
    const config = read(ensureConfigSecrets('app:\n  title: Shop\n'));
    expect(config.secrets.keys).toEqual([
      { version: 1, key: expect.stringMatching(/^[0-9a-f]{64}$/u) },
    ]);
    expect(config.auth.secret).toEqual(expect.any(String));
    expect(config.session.secret).toEqual(expect.any(String));
  });

  it('replaces the placeholder and keeps what the App already uses', () => {
    const previous = `secrets:\n  keys:\n    - version: 3\n      key: "${v2.key}"\nauth:\n  secret: old-auth-secret-0123456789-abcdefghij\n`;
    const config = read(
      ensureConfigSecrets(
        'secrets:\n  keys:\n    - version: 1\n      key: replace-with-a-unique-secret\n',
        previous,
      ),
    );
    expect(config.secrets.keys).toEqual([{ version: 3, key: v2.key }]);
    expect(config.auth.secret).toBe('old-auth-secret-0123456789-abcdefghij');
  });

  it('leaves keys the operator wrote for the runtime to judge', () => {
    const content = 'secrets:\n  keys:\n    - version: 1\n      key: short\n';
    expect(read(ensureConfigSecrets(content)).secrets).toEqual({
      keys: [{ version: 1, key: 'short' }],
    });
  });
});
