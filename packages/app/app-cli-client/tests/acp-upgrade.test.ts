// `acp start` refused for its bridge protocol: it updates the CLI as `update` does, then exits non-zero so the service
// manager starts it again on the new version; when no update helps it still exits non-zero, never 0.
import path from 'node:path';

import { Config } from '@oclif/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BridgeUpgradeRequired } from '@nocobase/acp-bridge';
import { BRIDGE_PROTOCOL_VERSION } from '@nocobase/acp-bridge/protocol';

import type { CliUpdateResult } from '../src/update.ts';
import { removeDir, tempDir, TEST_CLI } from './helpers.ts';

const bridge = vi.hoisted(() => ({
  runBridge: vi.fn<() => Promise<void>>(),
}));
const updates = vi.hoisted(() => ({
  updateCli: vi.fn<() => Promise<CliUpdateResult>>(),
}));

vi.mock('@nocobase/acp-bridge', async (original) => ({
  ...(await original<typeof import('@nocobase/acp-bridge')>()),
  runBridge: bridge.runBridge,
}));
vi.mock('../src/dynamic/session.ts', async (original) => ({
  ...(await original<typeof import('../src/dynamic/session.ts')>()),
  currentSession: () =>
    Promise.resolve({
      kind: 'user',
      server: 'https://acme.example.com',
      headers: {},
      manifestPath: '/api/cli/manifest',
      cacheKey: 'user',
    }),
}));
vi.mock('../src/update.ts', async (original) => ({
  ...(await original<typeof import('../src/update.ts')>()),
  updateCli: updates.updateCli,
  updateEnvironment: () => ({ bin: 'acme', running: '1.0.0' }),
}));

const { acpCommands, updateRefusedBridge } = await import('../src/acp.ts');
const { configureAppCli } = await import('../src/config.ts');

const older = (protocol?: number) =>
  new BridgeUpgradeRequired('The application refused this bridge.', protocol);

const result = (latest: string): CliUpdateResult => ({
  current: '1.0.0',
  latest,
  updated: latest !== '1.0.0',
});

describe('updateRefusedBridge', () => {
  it('updates a bridge older than the application, and says why not otherwise', async () => {
    const update = vi.fn(() => Promise.resolve(result('1.1.0')));
    await expect(
      updateRefusedBridge({
        bin: 'acme',
        refusal: older(BRIDGE_PROTOCOL_VERSION + 1),
        update,
      }),
    ).resolves.toEqual({ updated: true, version: '1.1.0' });
    // An application that does not say which protocol it speaks may be the newer side too.
    await expect(
      updateRefusedBridge({ bin: 'acme', refusal: older(), update }),
    ).resolves.toEqual({ updated: true, version: '1.1.0' });
    expect(update).toHaveBeenCalledTimes(2);

    const newer = await updateRefusedBridge({
      bin: 'acme',
      refusal: older(BRIDGE_PROTOCOL_VERSION - 1),
      update,
    });
    expect(newer).toMatchObject({ updated: false });
    expect(update).toHaveBeenCalledTimes(2);
    expect(newer.updated || newer.reason).toMatch(
      /application has to be updated/u,
    );

    await expect(
      updateRefusedBridge({ bin: 'acme', refusal: older(), update: undefined }),
    ).resolves.toMatchObject({
      updated: false,
      reason: expect.stringMatching(/does not update itself/u),
    });
    await expect(
      updateRefusedBridge({
        bin: 'acme',
        refusal: older(BRIDGE_PROTOCOL_VERSION + 1),
        update: () => Promise.resolve(result('1.0.0')),
      }),
    ).resolves.toMatchObject({
      updated: false,
      reason: expect.stringMatching(/newest the application serves/u),
    });
    await expect(
      updateRefusedBridge({
        bin: 'acme',
        refusal: older(),
        update: () => Promise.reject(new Error('download failed.')),
      }),
    ).resolves.toMatchObject({
      updated: false,
      reason: expect.stringMatching(/Could not update acme: download failed/u),
    });
  });
});

describe('acp start refused for its protocol', () => {
  let home: string;
  let config: Config;
  beforeEach(async () => {
    home = tempDir();
    vi.stubEnv('ACME_HOME', home);
    configureAppCli(TEST_CLI);
    config = await Config.load(path.resolve(import.meta.dirname, '..'));
    bridge.runBridge.mockRejectedValue(older(BRIDGE_PROTOCOL_VERSION + 1));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    removeDir(home);
  });

  const start = async (args: string[]): Promise<number | undefined> => {
    const Start = acpCommands(TEST_CLI)['acp:start']!;
    process.exitCode = undefined;
    try {
      await Start.run(args, config);
      return 0;
    } catch (error) {
      return (error as { oclif?: { exit?: number } }).oclif?.exit;
    } finally {
      process.exitCode = undefined;
    }
  };

  it('updates, then exits non-zero for the service to start the new version', async () => {
    updates.updateCli.mockResolvedValue(result('1.1.0'));
    const exit = await start(['--service']);
    expect(updates.updateCli).toHaveBeenCalledOnce();
    expect(exit).toBeGreaterThan(0);
  });

  it('exits non-zero when the update fails or does not help', async () => {
    updates.updateCli.mockRejectedValue(new Error('offline'));
    expect(await start([])).toBeGreaterThan(0);
    updates.updateCli.mockResolvedValue(result('1.0.0'));
    expect(await start([])).toBeGreaterThan(0);
    // The service waits before exiting, until it is stopped.
    updates.updateCli.mockResolvedValue(result('1.0.0'));
    const exited = start(['--service']);
    await vi.waitFor(() => expect(updates.updateCli).toHaveBeenCalledTimes(3));
    await new Promise((resolve) => setTimeout(resolve, 20));
    process.emit('SIGTERM');
    expect(await exited).toBeGreaterThan(0);
  });
});
