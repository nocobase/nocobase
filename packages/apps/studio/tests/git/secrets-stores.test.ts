// @vitest-environment node
/**
 * Rotating the secrets keys: a connection's credentials and kept installation tokens, a person's token and a
 * repository's webhook secret are resealed under the next key by the git secrets stores, and stay readable with it alone.
 */
import { createSecretsService } from '@nocobase/app-server/secrets';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createGitConnections } from '../../server/git/connections.js';
import { createInstallationTokens } from '../../server/git/installation-tokens.js';
import { createGitProviders } from '../../server/git/providers.js';
import {
  createGitSecrets,
  createGitSecretsStores,
  GIT_SECRET_PURPOSES,
} from '../../server/git/sealing.js';
import { updateRepo } from '../../server/git/store.js';
import {
  createBridgeHarness,
  TEST_SECRETS,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { API, connectedRepo, tokenConnection } from './helpers.js';

const v1 = { version: 1, key: 'e'.repeat(64) };
const v2 = { version: 2, key: 'f'.repeat(64) };

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

describe('git secrets stores', () => {
  it('reseal connections, people’s tokens and webhook secrets under a new key', async () => {
    const connection = await tokenConnection(h);
    h.github.tokens.add('github_pat_bob');
    h.github.users.set('github_pat_bob', {
      id: 2,
      login: 'bob-gh',
      name: 'Bob',
      email: 'bob@acme.dev',
    });
    await h.gitConnections.usePersonalToken(
      'bob',
      connection.id,
      'github_pat_bob',
    );
    const repo = await connectedRepo(h, 'acme/shop', connection);
    await updateRepo(h.projects.tx.read(), repo.id, {
      webhookSecretSealed: createGitSecrets(TEST_SECRETS).seal(
        'whsec-0123456789abcdef',
        GIT_SECRET_PURPOSES.repoWebhookSecret,
        [repo.id],
      ),
    });

    // An installation token the connection keeps.
    const kept = createInstallationTokens({
      conn: () => h.projects.tx.read(),
      secrets: createGitSecrets(TEST_SECRETS),
      now: () => new Date(),
    });
    await kept
      .of(connection.id)
      .set('99', 'ghs_kept|…', new Date(Date.now() + 600_000));

    const stores = createGitSecretsStores(() => h.projects.tx.read());
    const context = {
      secrets: createSecretsService({ keys: [v2, v1] }),
      batchSize: 10,
      dryRun: false,
    };
    expect(
      await Promise.all(stores.map((store) => store.status(context))),
    ).toEqual([
      { total: 1, byVersion: { '1': 1 }, needsReseal: 1 },
      { total: 1, byVersion: { '1': 1 }, needsReseal: 1 },
      { total: 1, byVersion: { '1': 1 }, needsReseal: 1 },
      { total: 1, byVersion: { '1': 1 }, needsReseal: 1 },
    ]);
    for (const store of stores)
      expect(await store.reseal(context)).toEqual({ resealed: 1, failed: 0 });

    const after = createGitConnections({
      conn: () => h.projects.tx.read(),
      providers: createGitProviders([h.github.platform]),
      secrets: createGitSecrets(createSecretsService({ keys: [v2] })),
    });
    expect(
      await after.connectionAuth({
        connectionId: connection.id,
        apiBaseUrl: API,
      }),
    ).toMatchObject({ as: 'connection', auth: { token: 'ghp_read' } });
    expect(
      await after.actingAuth(
        { connectionId: connection.id, apiBaseUrl: API },
        'bob',
      ),
    ).toMatchObject({ as: 'user', auth: { token: 'github_pat_bob' } });
    expect(
      await createInstallationTokens({
        conn: () => h.projects.tx.read(),
        secrets: createGitSecrets(createSecretsService({ keys: [v2] })),
        now: () => new Date(),
      })
        .of(connection.id)
        .get('99'),
    ).toBe('ghs_kept|…');
  });
});
