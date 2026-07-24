/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import type { VscRemoteProvider } from '../../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError, type RemoteSyncAdapter } from '../RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from '../RemoteSyncAdapterRegistry';
import { DeterministicRemoteAdapter } from '../testing/DeterministicRemoteAdapter';

const validConfig = {
  owner: 'nocobase',
  repository: 'nocobase',
  branch: 'main',
  subdirectory: null,
};

function captureRemoteSyncError(callback: () => unknown): RemoteSyncError {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(RemoteSyncError);
    return error as RemoteSyncError;
  }
  throw new Error('Expected callback to throw RemoteSyncError');
}

describe('RemoteSyncAdapterRegistry', () => {
  it('registers, gets, requires, lists, and unregisters an adapter', () => {
    const registry = new RemoteSyncAdapterRegistry();
    const adapter = new DeterministicRemoteAdapter({ title: 'GitHub deterministic' });
    const unregister = registry.register(adapter);

    expect(registry.get('github')).toBe(adapter);
    expect(registry.require('github')).toBe(adapter);
    expect(registry.list()).toEqual([
      {
        provider: 'github',
        title: 'GitHub deterministic',
        capabilities: { probe: true, fetch: true, publish: true, readOnly: false },
      },
    ]);
    expect(registry.list()[0]).not.toHaveProperty('adapter');
    expect(registry.list()[0]).not.toHaveProperty('credentialResolver');

    unregister();
    expect(registry.get('github')).toBeNull();
  });

  it('rejects empty, unknown, missing, and conflicting providers', () => {
    const registry = new RemoteSyncAdapterRegistry();
    const adapter = new DeterministicRemoteAdapter();
    registry.register(adapter);

    const emptyProviderAdapter = {
      ...adapter,
      provider: '',
    } as unknown as RemoteSyncAdapter;

    expect(captureRemoteSyncError(() => registry.register(emptyProviderAdapter))).toMatchObject({
      code: 'UNSUPPORTED_PROVIDER',
    });
    expect(captureRemoteSyncError(() => registry.require('gitlab' as VscRemoteProvider))).toMatchObject({
      code: 'UNSUPPORTED_PROVIDER',
    });
    expect(captureRemoteSyncError(() => new RemoteSyncAdapterRegistry().require('github'))).toMatchObject({
      code: 'UNSUPPORTED_PROVIDER',
    });
    expect(captureRemoteSyncError(() => registry.register(new DeterministicRemoteAdapter()))).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'provider-already-registered' },
    });
  });

  it('allows idempotent registration of the same instance and keeps unregister identity-safe', () => {
    const registry = new RemoteSyncAdapterRegistry();
    const first = new DeterministicRemoteAdapter({ title: 'First' });
    const unregisterFirst = registry.register(first);
    const unregisterSame = registry.register(first);

    unregisterFirst();
    const second = new DeterministicRemoteAdapter({ title: 'Second' });
    const unregisterSecond = registry.register(second);

    unregisterFirst();
    unregisterSame();
    expect(registry.get('github')).toBe(second);

    unregisterSecond();
    expect(registry.get('github')).toBeNull();
  });

  it('returns detached list capabilities instead of adapter instances', () => {
    const registry = new RemoteSyncAdapterRegistry();
    const adapter = new DeterministicRemoteAdapter();
    registry.register(adapter);

    const summary = registry.list()[0];
    summary.capabilities.publish = false;

    expect(adapter.capabilities.publish).toBe(true);
  });

  it('normalizes config through the registered adapter parser', () => {
    const registry = new RemoteSyncAdapterRegistry();
    registry.register(new DeterministicRemoteAdapter());

    expect(registry.normalizeConfig('github', validConfig)).toEqual(validConfig);
    expect(
      captureRemoteSyncError(() => registry.normalizeConfig('github', { ...validConfig, token: 'must-not-pass' })),
    ).toMatchObject({ code: 'CONFIG_INVALID' });
  });

  it('fails closed when an adapter parser is missing, throws raw errors, or returns a different config', () => {
    const createAdapter = (normalizeConfig: RemoteSyncAdapter['normalizeConfig'] | undefined): RemoteSyncAdapter =>
      ({
        provider: 'github',
        title: 'Malformed adapter',
        capabilities: { probe: true, fetch: true, publish: true, readOnly: false },
        normalizeConfig,
        probe: async () => ({ revision: null, metadata: {} }),
        fetchSnapshot: async () => ({ revision: null, contentHash: 'sha256:empty', files: [], metadata: {} }),
        publishSnapshot: async () => ({ revision: 'revision', contentHash: 'sha256:empty', metadata: {} }),
      }) as unknown as RemoteSyncAdapter;

    const missingParserRegistry = new RemoteSyncAdapterRegistry();
    missingParserRegistry.register(createAdapter(undefined));
    expect(captureRemoteSyncError(() => missingParserRegistry.normalizeConfig('github', validConfig))).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'config-parser-unavailable' },
    });

    const rawErrorRegistry = new RemoteSyncAdapterRegistry();
    rawErrorRegistry.register(
      createAdapter(() => {
        throw new Error('raw parser failure');
      }),
    );
    expect(captureRemoteSyncError(() => rawErrorRegistry.normalizeConfig('github', validConfig))).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'config-parser-failed' },
    });

    let normalizeCall = 0;
    const differentConfigRegistry = new RemoteSyncAdapterRegistry();
    differentConfigRegistry.register(
      createAdapter(() => ({ ...validConfig, branch: normalizeCall++ === 0 ? 'develop' : 'release' })),
    );
    expect(captureRemoteSyncError(() => differentConfigRegistry.normalizeConfig('github', validConfig))).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'non-canonical-config' },
    });

    const unsafeConfigRegistry = new RemoteSyncAdapterRegistry();
    unsafeConfigRegistry.register(
      createAdapter(() => ({ ...validConfig, accessToken: 'raw-secret' }) as unknown as typeof validConfig),
    );
    expect(captureRemoteSyncError(() => unsafeConfigRegistry.normalizeConfig('github', validConfig))).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'sensitive-config-key' },
    });
  });

  it('preserves safe RemoteSyncError failures from an adapter parser', () => {
    const registry = new RemoteSyncAdapterRegistry();
    const expected = new RemoteSyncError('CONFIG_INVALID', 'adapter-safe-error');
    const adapter = new DeterministicRemoteAdapter();
    adapter.normalizeConfig = () => {
      throw expected;
    };
    registry.register(adapter);

    expect(captureRemoteSyncError(() => registry.normalizeConfig('github', validConfig))).toBe(expected);
  });
});
