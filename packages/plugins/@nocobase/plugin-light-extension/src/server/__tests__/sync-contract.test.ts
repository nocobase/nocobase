/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  LIGHT_EXTENSION_SYNC_ERROR_CODE_BY_REMOTE_CODE,
  mapRemoteSyncErrorToLightExtension,
} from '../../shared/errors';
import type {
  LightExtensionSyncConfigureInput,
  LightExtensionSyncCreateFromGitInput,
  LightExtensionSyncDisconnectInput,
  LightExtensionSyncGetInput,
  LightExtensionSyncPlan,
  LightExtensionSyncPlanInput,
  LightExtensionSyncPlanResult,
  LightExtensionSyncPullInput,
  LightExtensionSyncPushInput,
  LightExtensionSyncSourceSummary,
  LightExtensionSyncState,
  LightExtensionSyncTestConnectionInput,
  LightExtensionSyncActionName,
} from '../../shared/types';

type ForbiddenCredentialKey = 'token' | 'accessToken' | 'encryptedToken';

type HasForbiddenCredentialKey<T> = Extract<keyof T, ForbiddenCredentialKey> extends never ? false : true;

type HasAuthRef<T> = 'authRef' extends keyof T ? true : false;

describe('light-extension remote sync facade contract', () => {
  const config = {
    owner: 'nocobase',
    repository: 'light-extensions',
    branch: 'main',
    subdirectory: 'extensions/sales',
  };

  const source: LightExtensionSyncSourceSummary = {
    provider: 'github',
    config,
    status: 'active',
    remoteTargetVersion: 3,
    revision: 'abc123',
    credentialConfigured: true,
    authRefDisplay: '{{ $env.GITHUB_SYNC_SECRET }}',
    lastSyncedAt: '2026-07-16T00:00:00.000Z',
  };

  const plan = {
    state: 'local-ahead',
    action: 'push',
    reasonCode: null,
    canPull: false,
    canPush: true,
    fingerprint: 'plan:v1:example',
    remoteTargetVersion: 3,
    local: {
      headCommitId: 'commit_local',
      contentHash: 'sha256:local',
    },
    remote: {
      revision: 'abc123',
      contentHash: 'sha256:remote',
      contentHashKnown: true,
    },
    baseline: {
      remoteTargetVersion: 3,
      lastLocalCommitId: 'commit_base',
      lastRemoteRevision: 'abc122',
      lastSyncedContentHash: 'sha256:base',
    },
  } satisfies LightExtensionSyncPlan;

  it('freezes the public facade action names', () => {
    const actionNames: LightExtensionSyncActionName[] = [
      'get',
      'configure',
      'disconnect',
      'testConnection',
      'plan',
      'pull',
      'push',
      'createFromGit',
    ];

    expect(actionNames).toEqual([
      'get',
      'configure',
      'disconnect',
      'testConnection',
      'plan',
      'pull',
      'push',
      'createFromGit',
    ]);
  });

  it('uses the provider-neutral planner states and represents initial ambiguity as a stable reason', () => {
    const states: LightExtensionSyncState[] = [
      'unconfigured',
      'in-sync',
      'local-ahead',
      'remote-ahead',
      'diverged',
      'error',
    ];
    const ambiguousPlan: LightExtensionSyncPlan = {
      ...plan,
      state: 'diverged',
      action: 'conflict',
      reasonCode: 'initial-ambiguous',
      canPull: false,
      canPush: false,
    };

    expect(states).toEqual(['unconfigured', 'in-sync', 'local-ahead', 'remote-ahead', 'diverged', 'error']);
    expect(ambiguousPlan).toMatchObject({
      reasonCode: 'initial-ambiguous',
      canPull: false,
      canPush: false,
    });
  });

  it('freezes all facade action inputs around the public light-extension repo id', () => {
    const inputs = {
      get: { repoId: 'ler_sales' } satisfies LightExtensionSyncGetInput,
      configure: {
        repoId: 'ler_sales',
        provider: 'github',
        config,
        authRef: '{{ $env.GITHUB_SYNC_SECRET }}',
      } satisfies LightExtensionSyncConfigureInput,
      disconnect: { repoId: 'ler_sales' } satisfies LightExtensionSyncDisconnectInput,
      testConnection: {
        repoId: 'ler_sales',
        provider: 'github',
        config,
        authRef: '{{ $env.GITHUB_SYNC_SECRET }}',
      } satisfies LightExtensionSyncTestConnectionInput,
      plan: { repoId: 'ler_sales' } satisfies LightExtensionSyncPlanInput,
      pull: {
        repoId: 'ler_sales',
        expectedHeadCommitId: 'commit_local',
        expectedRemoteRevision: 'abc123',
        expectedRemoteTargetVersion: 3,
        planFingerprint: plan.fingerprint,
      } satisfies LightExtensionSyncPullInput,
      push: {
        repoId: 'ler_sales',
        expectedHeadCommitId: 'commit_local',
        expectedRemoteRevision: 'abc123',
        expectedRemoteTargetVersion: 3,
        planFingerprint: plan.fingerprint,
      } satisfies LightExtensionSyncPushInput,
      createFromGit: {
        name: 'sales',
        title: 'Sales',
        description: 'Sales light extensions',
        provider: 'github',
        config,
        authRef: '{{ $env.GITHUB_SYNC_SECRET }}',
      } satisfies LightExtensionSyncCreateFromGitInput,
    };

    expect(
      Object.values(inputs)
        .filter((input) => 'repoId' in input)
        .every((input) => input.repoId === 'ler_sales'),
    ).toBe(true);
    expect(JSON.stringify(inputs)).not.toContain('vscRepoId');
    expect(inputs.createFromGit).not.toHaveProperty('zipBase64');
    expect(inputs.createFromGit).not.toHaveProperty('initialFiles');
  });

  it('allows authRef only on configure, testConnection, and createFromGit requests', () => {
    const authRefContract: {
      get: HasAuthRef<LightExtensionSyncGetInput>;
      configure: HasAuthRef<LightExtensionSyncConfigureInput>;
      disconnect: HasAuthRef<LightExtensionSyncDisconnectInput>;
      testConnection: HasAuthRef<LightExtensionSyncTestConnectionInput>;
      plan: HasAuthRef<LightExtensionSyncPlanInput>;
      pull: HasAuthRef<LightExtensionSyncPullInput>;
      push: HasAuthRef<LightExtensionSyncPushInput>;
      createFromGit: HasAuthRef<LightExtensionSyncCreateFromGitInput>;
    } = {
      get: false,
      configure: true,
      disconnect: false,
      testConnection: true,
      plan: false,
      pull: false,
      push: false,
      createFromGit: true,
    };

    expect(authRefContract).toEqual({
      get: false,
      configure: true,
      disconnect: false,
      testConnection: true,
      plan: false,
      pull: false,
      push: false,
      createFromGit: true,
    });
  });

  it('keeps public DTOs free of raw credential fields and internal repository ids', () => {
    const noRawCredentials: {
      configure: HasForbiddenCredentialKey<LightExtensionSyncConfigureInput>;
      testConnection: HasForbiddenCredentialKey<LightExtensionSyncTestConnectionInput>;
      createFromGit: HasForbiddenCredentialKey<LightExtensionSyncCreateFromGitInput>;
      source: HasForbiddenCredentialKey<LightExtensionSyncSourceSummary>;
    } = {
      configure: false,
      testConnection: false,
      createFromGit: false,
      source: false,
    };
    const result: LightExtensionSyncPlanResult = {
      repoId: 'ler_sales',
      source,
      plan,
    };

    expect(noRawCredentials).toEqual({
      configure: false,
      testConnection: false,
      createFromGit: false,
      source: false,
    });
    expect(JSON.stringify(result)).not.toMatch(/(?:accessToken|encryptedToken|"token")/iu);
    expect(JSON.stringify(result)).not.toContain('vscRepoId');
    expect(result.source).toMatchObject({ credentialConfigured: true });
  });

  it('freezes optimistic concurrency fields for Pull and Push', () => {
    const pull: LightExtensionSyncPullInput = {
      repoId: 'ler_sales',
      expectedHeadCommitId: plan.local.headCommitId,
      expectedRemoteRevision: plan.remote.revision,
      expectedRemoteTargetVersion: plan.remoteTargetVersion,
      planFingerprint: plan.fingerprint,
    };
    const push: LightExtensionSyncPushInput = { ...pull };

    expect(pull).toEqual(push);
    expect(Object.keys(pull).sort()).toEqual(
      [
        'expectedHeadCommitId',
        'expectedRemoteRevision',
        'expectedRemoteTargetVersion',
        'planFingerprint',
        'repoId',
      ].sort(),
    );
  });

  it('maps provider-neutral errors to stable facade codes and statuses', () => {
    const expected = {
      UNSUPPORTED_PROVIDER: ['LIGHT_EXTENSION_SYNC_UNSUPPORTED_PROVIDER', 422],
      CREDENTIAL_UNAVAILABLE: ['LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE', 422],
      AUTH_FAILED: ['LIGHT_EXTENSION_SYNC_AUTH_FAILED', 422],
      REMOTE_NOT_FOUND: ['LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND', 404],
      RATE_LIMITED: ['LIGHT_EXTENSION_SYNC_RATE_LIMITED', 429],
      REMOTE_CHANGED: ['LIGHT_EXTENSION_SYNC_REMOTE_CHANGED', 409],
      DIVERGED: ['LIGHT_EXTENSION_SYNC_DIVERGED', 409],
      BUSY: ['LIGHT_EXTENSION_SYNC_BUSY', 409],
      UNSAFE_CONTENT: ['LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT', 422],
      REMOTE_UNAVAILABLE: ['LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', 502],
      PERMISSION_DENIED: ['LIGHT_EXTENSION_PERMISSION_DENIED', 403],
      REPO_ARCHIVED: ['LIGHT_EXTENSION_REPO_ARCHIVED', 409],
      LOCAL_OUTDATED: ['LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED', 409],
      CONFIG_INVALID: ['LIGHT_EXTENSION_SYNC_CONFIG_INVALID', 422],
      AUTH_REF_INVALID: ['LIGHT_EXTENSION_SYNC_AUTH_REF_INVALID', 422],
    } as const;

    expect(LIGHT_EXTENSION_SYNC_ERROR_CODE_BY_REMOTE_CODE).toEqual(
      Object.fromEntries(Object.entries(expected).map(([remoteCode, [facadeCode]]) => [remoteCode, facadeCode])),
    );

    for (const [remoteCode, [facadeCode, status]] of Object.entries(expected)) {
      const error = mapRemoteSyncErrorToLightExtension({
        code: remoteCode as keyof typeof expected,
        message: `Safe ${remoteCode}`,
      });
      expect(error).toMatchObject({ code: facadeCode, status });
      if (remoteCode === 'AUTH_FAILED') {
        expect(error.status).not.toBe(401);
      }
    }
  });

  it('does not copy provider causes, transport objects, configs, or credential-like details', () => {
    const error = mapRemoteSyncErrorToLightExtension({
      code: 'RATE_LIMITED',
      message: 'Provider request is rate limited',
      details: {
        provider: 'github',
        retryAfterSeconds: 60,
        token: 'raw-secret',
        config: { owner: 'nocobase' },
        request: { headers: { authorization: 'raw-secret' } },
        response: { body: 'raw-provider-body' },
        cause: new Error('raw-provider-error'),
      },
    });
    const serialized = JSON.stringify(error.toResponseBody());

    expect(error.details).toEqual({
      sourceCode: 'RATE_LIMITED',
      provider: 'github',
      retryAfterSeconds: 60,
    });
    expect(serialized).not.toMatch(/raw-secret|raw-provider|authorization|"(?:request|response|cause|config|token)"/iu);
  });
});
