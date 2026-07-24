/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { APIClient } from '@nocobase/sdk';

import type { ApiClientLike, ApiRequestOptions } from '../api/lightExtensionEntriesRequests';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';
import {
  registerLightExtensionRuntimeAuthSession,
  registerLightExtensionRuntimeIdentity,
  type LightExtensionRuntimeIdentitySnapshot,
} from '../resolvers/LightExtensionRuntimeCacheRegistry';

const artifactHash = 'b'.repeat(64);
const sourceBinding = {
  type: 'light-extension-entry',
  repoId: 'repo_auth',
  entryId: 'entry_auth',
  kind: 'js-action',
} as const;
const input = { sourceMode: 'light-extension' as const, sourceBinding, settings: {} };

describe('Light Extension runtime cache auth sessions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('partitions shared modern and legacy resolvers by every observable auth identity component', async () => {
    const state: LightExtensionRuntimeIdentitySnapshot = {
      userId: 1,
      role: 'member',
      authenticator: 'basic',
      token: 'token-1',
      permissionSnapshot: {},
    };
    const { api, counts } = createApi();
    const dispose = registerLightExtensionRuntimeIdentity(api, () => state);
    const modernResolver = createLightExtensionRunJSResolver(api);
    const legacyResolver = createLightExtensionRunJSResolver(api);

    await modernResolver.resolve(input);
    await legacyResolver.resolve(input);
    expect(counts.post).toBe(1);

    state.userId = 2;
    await legacyResolver.resolve(input);
    state.role = 'admin';
    await modernResolver.resolve(input);
    state.authenticator = 'oidc';
    await legacyResolver.resolve(input);
    state.token = 'token-2';
    await modernResolver.resolve(input);
    state.permissionSnapshot = {};
    await legacyResolver.resolve(input);

    expect(counts.post).toBe(6);
    expect(counts.get).toBe(1);
    dispose();
  });

  it('uses the 30 second TTL for same-role ACL changes that are not locally observable', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const state: LightExtensionRuntimeIdentitySnapshot = {
      userId: 1,
      role: 'member',
      authenticator: 'basic',
      token: 'token-1',
      permissionSnapshot: {},
    };
    let denied = false;
    const { api, counts } = createApi(() => {
      if (denied) {
        throw Object.assign(new Error('permission denied'), { code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
      }
    });
    const dispose = registerLightExtensionRuntimeIdentity(api, () => state);
    const resolver = createLightExtensionRunJSResolver(api);

    await resolver.resolve(input);
    denied = true;
    vi.setSystemTime(29_999);
    await resolver.resolve(input);
    expect(counts.post).toBe(1);

    vi.setSystemTime(30_000);
    await expect(resolver.resolve(input)).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
    expect(counts.post).toBe(2);
    dispose();
  });

  it('keeps a newer identity registration when an old disposer runs', async () => {
    const { api, counts } = createApi();
    const disposeOld = registerLightExtensionRuntimeIdentity(api, () => ({ userId: 1, token: 'old' }));
    const resolver = createLightExtensionRunJSResolver(api);
    await resolver.resolve(input);

    const disposeCurrent = registerLightExtensionRuntimeIdentity(api, () => ({ userId: 2, token: 'current' }));
    await resolver.resolve(input);
    disposeOld();
    await resolver.resolve(input);

    expect(counts.post).toBe(2);
    disposeCurrent();
  });

  it('restores the previous identity registration when the newer registration disposes first', async () => {
    const { api, counts } = createApi();
    const disposeOld = registerLightExtensionRuntimeIdentity(api, () => ({ userId: 1, token: 'old' }));
    const resolver = createLightExtensionRunJSResolver(api);
    await resolver.resolve(input);

    const disposeCurrent = registerLightExtensionRuntimeIdentity(api, () => ({ userId: 2, token: 'current' }));
    await resolver.resolve(input);
    disposeCurrent();
    await resolver.resolve(input);

    expect(counts.post).toBe(3);
    disposeOld();
  });

  it('reads real Auth getters, app user and ACL snapshots across modern and legacy registrations', async () => {
    const eventBus = new EventTarget();
    const sdkApi = new APIClient({ storageType: 'memory' }) as APIClient & { app?: { eventBus: EventTarget } };
    sdkApi.app = { eventBus };
    sdkApi.auth.setRole('member');
    sdkApi.auth.setAuthenticator('basic');
    sdkApi.auth.setToken('token-1');
    const { api: requestApi, counts } = createApi();
    const api = Object.assign(requestApi, { auth: sdkApi.auth });
    const legacyApp = {
      eventBus,
      context: { user: { id: 1 }, acl: { data: { revision: 1 } } },
    };
    const modernApp = {
      eventBus,
      context: { user: { id: 2 }, acl: { data: { revision: 1 } } },
    };
    const disposeLegacy = registerLightExtensionRuntimeAuthSession(api, legacyApp);
    const resolver = createLightExtensionRunJSResolver(api);

    await resolver.resolve(input);
    const disposeModern = registerLightExtensionRuntimeAuthSession(api, modernApp);
    await resolver.resolve(input);
    disposeModern();
    await resolver.resolve(input);
    sdkApi.auth.setRole('admin');
    await resolver.resolve(input);
    sdkApi.auth.setAuthenticator('oidc');
    await resolver.resolve(input);
    sdkApi.auth.setToken('token-2');
    await resolver.resolve(input);
    legacyApp.context.user = { id: 3 };
    await resolver.resolve(input);
    legacyApp.context.acl.data = { revision: 2 };
    await resolver.resolve(input);

    expect(counts.post).toBe(8);
    disposeLegacy();
  });

  it('clears the current partition when the auth token event fires', async () => {
    const eventTarget = new EventTarget();
    const state: LightExtensionRuntimeIdentitySnapshot = { userId: 1, token: 'token-1' };
    const { api, counts } = createApi();
    const dispose = registerLightExtensionRuntimeIdentity(api, () => state, eventTarget);
    const resolver = createLightExtensionRunJSResolver(api);

    await resolver.resolve(input);
    state.token = 'token-2';
    eventTarget.dispatchEvent(new Event('auth:tokenChanged'));
    await resolver.resolve(input);

    expect(counts.post).toBe(2);
    dispose();
  });
});

function createApi(beforeResolve?: () => void) {
  const counts = { get: 0, post: 0 };
  const api: ApiClientLike = {
    async request<TResponse>(options: ApiRequestOptions): Promise<TResponse> {
      if (options.method === 'get') {
        counts.get += 1;
        return artifactResponse() as TResponse;
      }
      counts.post += 1;
      beforeResolve?.();
      return resolveResponse() as TResponse;
    },
  };
  return { api, counts };
}

function resolveResponse() {
  return {
    data: {
      data: {
        entryId: sourceBinding.entryId,
        entryPath: 'src/client/js-actions/auth/index.ts',
        artifactHash,
        artifactUrl: `/api/light-extension-runtime/artifacts/${artifactHash}`,
        runtimeCodeHash: 'runtime-auth',
        version: 'v2',
        settings: {},
        settingsHash: 'settings-auth',
      },
    },
  };
}

function artifactResponse() {
  return {
    data: {
      artifactHash,
      runtimeCodeHash: 'runtime-auth',
      code: 'return true;',
      version: 'v2',
      entryPath: 'src/client/js-actions/auth/index.ts',
      runtimeContract: 'light-extension.runtime-artifact.v1',
      byteSize: 16,
    },
  };
}
