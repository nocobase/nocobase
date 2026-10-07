/**
 * Rotating the secrets keys: what the plugin seals under one key is reported and resealed under the next by its
 * secrets stores, and stays readable through the services.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { createAgents } from '../server/composition.js';
import { createAgentsSecretsStores } from '../server/secrets-stores.js';
import { createHarness, testSecrets, type Harness } from './harness.js';

const v1 = { version: 1, key: 'a'.repeat(64) };
const v2 = { version: 2, key: 'c'.repeat(64) };

describe('agents secrets stores', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  it('reseals variables and model service keys under a new key', async () => {
    h = await createHarness({ secrets: testSecrets([v1]) });
    const target = { scope: 'agent' as const, scopeId: 'a1' };
    await h.services.variables.set(target, 'TOKEN', 'variable-value', 'admin');
    await h.services.online.services.create({
      title: 'Team',
      provider: 'openai',
      apiKey: 'provider-key',
      models: [{ value: 'model' }],
    });

    const rotated = testSecrets([v2, v1]);
    const stores = createAgentsSecretsStores(() => h!.database.connection());
    const context = { secrets: rotated, batchSize: 10, dryRun: false };
    expect(
      await Promise.all(stores.map((store) => store.status(context))),
    ).toEqual([
      { total: 1, byVersion: { '1': 1 }, needsReseal: 1 },
      { total: 1, byVersion: { '1': 1 }, needsReseal: 1 },
    ]);
    for (const store of stores)
      expect(await store.reseal(context)).toEqual({ resealed: 1, failed: 0 });

    // Readable with the new key alone.
    const after = createAgents({
      database: h.database,
      idGenerator: { generateString: () => 'x' },
      secrets: testSecrets([v2]),
      onError: () => undefined,
    });
    expect(await after.variables.reveal(target, 'admin')).toEqual([
      expect.objectContaining({ name: 'TOKEN', value: 'variable-value' }),
    ]);
    expect(
      (
        await after.online.services.connectionFor({
          modelService: 'team',
          model: 'model',
        })
      ).apiKey,
    ).toBe('provider-key');
  });
});
