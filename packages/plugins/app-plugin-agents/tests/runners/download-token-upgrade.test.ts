/** Persisted pre-extraction records remain usable through the original Agents table and migrated schema. */
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';

describe('download tokens persisted before the distribution extraction', () => {
  let harness: Harness;
  beforeEach(async () => {
    harness = await createHarness();
  });
  afterEach(async () => {
    await harness.close();
  });
  const token = 'fgdl_pre_extraction_fixture';
  async function seed(
    values: {
      target?: string | null;
      downloads?: number;
      expiresAt?: string;
    } = {},
  ) {
    await harness.database
      .connection()
      .repository('agDownloadTokens')
      .createOne({
        values: {
          id: 'legacy-token',
          tokenHash: createHash('sha256').update(token, 'utf8').digest('hex'),
          createdById: 'person-before-upgrade',
          target: null,
          downloads: 0,
          createdAt: harness.clock.now().toISOString(),
          expiresAt: new Date(
            harness.clock.now().getTime() + 15 * 60_000,
          ).toISOString(),
          ...values,
        },
      });
  }
  async function row() {
    return harness.database
      .connection()
      .repository('agDownloadTokens')
      .findOne({ filter: { id: 'legacy-token' } });
  }
  it('accepts a live old hash, binds its first platform, and keeps the three-download limit', async () => {
    await seed();
    const tokens = harness.services.downloadTokens;
    await tokens.admit(token, {});
    await tokens.admit(token, { product: 'acme', target: 'linux-x64' });
    expect(await row()).toMatchObject({ target: 'linux-x64', downloads: 0 });
    await expect(
      tokens.admit(token, { target: 'darwin-arm64' }),
    ).rejects.toMatchObject({ code: 'DOWNLOAD_TOKEN_INVALID' });
    for (let count = 0; count < 3; count++)
      await tokens.admit(token, {
        product: 'acme',
        target: 'linux-x64',
        download: true,
      });
    await expect(tokens.admit(token, { download: true })).rejects.toMatchObject(
      { code: 'DOWNLOAD_TOKEN_INVALID' },
    );
    expect(await row()).toMatchObject({
      downloads: 3,
      createdById: 'person-before-upgrade',
    });
  });
  it('refuses an expired old record without replacing or changing it', async () => {
    await seed({ expiresAt: harness.clock.now().toISOString() });
    await expect(
      harness.services.downloadTokens.admit(token, {}),
    ).rejects.toMatchObject({ code: 'DOWNLOAD_TOKEN_INVALID' });
    expect(await row()).toMatchObject({ downloads: 0, target: null });
  });
  it('admits only one concurrent download against the final remaining credit', async () => {
    await seed({ target: 'linux-x64', downloads: 2 });
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        harness.services.downloadTokens.admit(token, {
          target: 'linux-x64',
          download: true,
        }),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(await row()).toMatchObject({ downloads: 3, target: 'linux-x64' });
  });
});
