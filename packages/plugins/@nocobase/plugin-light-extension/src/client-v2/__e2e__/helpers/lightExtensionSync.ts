/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Page, Route } from '@playwright/test';

import type {
  LightExtensionSyncCreateFromGitInput,
  LightExtensionRepoRecord,
  LightExtensionSyncActionName,
  LightExtensionSyncPlan,
  LightExtensionSyncSourceSummary,
} from '../../../shared/types';
import { isRecord, readApiResponse, type RootApiSession } from './api';
import type { LightExtensionAcceptanceRepo } from './lightExtensionRepo';

export const LIGHT_EXTENSION_SYNC_TEST_AUTH_REF = '{{ $env.TEST_GITHUB_TOKEN }}';
export const LIGHT_EXTENSION_SYNC_TEST_AUTH_REF_DISPLAY = '{{ $env.TE*** }}';
export const LIGHT_EXTENSION_SYNC_FORBIDDEN_TOKEN = 'raw-token-value-must-not-appear';
export const LIGHT_EXTENSION_SYNC_PULL_DESCRIPTION = 'Pulled via Task 16';

type SyncError = {
  code: string;
  status: number;
  message: string;
};

type SyncCall = {
  action: LightExtensionSyncActionName;
  body: Record<string, unknown>;
};

export type LightExtensionSyncFacadeFixture = {
  install(): Promise<void>;
  setPlan(plan: LightExtensionSyncPlan): void;
  setError(action: LightExtensionSyncActionName, error?: SyncError): void;
  getPlanRequestCount(): number;
  getCalls(): SyncCall[];
  getCreatedRepoIds(): string[];
  getResponseBodies(): string[];
};

export function createLightExtensionSyncPlan(
  state: LightExtensionSyncPlan['state'],
  overrides: Partial<LightExtensionSyncPlan> = {},
): LightExtensionSyncPlan {
  return {
    state,
    action:
      state === 'remote-ahead' ? 'pull' : state === 'local-ahead' ? 'push' : state === 'diverged' ? 'conflict' : 'noop',
    reasonCode: null,
    canPull: state === 'remote-ahead',
    canPush: state === 'local-ahead',
    fingerprint: `task16-${state}`,
    remoteTargetVersion: state === 'unconfigured' ? null : 1,
    local: {
      headCommitId: 'local-task16',
      contentHash: state === 'remote-ahead' ? 'sha256:old-local' : 'sha256:content',
    },
    remote: {
      revision: state === 'unconfigured' ? null : 'remote-task16',
      contentHash: state === 'local-ahead' ? 'sha256:old-remote' : 'sha256:content',
      contentHashKnown: state !== 'unconfigured',
    },
    baseline: {
      remoteTargetVersion: state === 'unconfigured' ? null : 1,
      lastLocalCommitId: state === 'unconfigured' ? null : 'local-base',
      lastRemoteRevision: state === 'unconfigured' ? null : 'remote-base',
      lastSyncedContentHash: state === 'unconfigured' ? null : 'sha256:base',
    },
    ...overrides,
  };
}

export function createLightExtensionSyncFacade(
  page: Page,
  repo: LightExtensionAcceptanceRepo,
  session: RootApiSession,
): LightExtensionSyncFacadeFixture {
  const source: LightExtensionSyncSourceSummary = {
    provider: 'github',
    config: {
      owner: 'nocobase',
      repository: 'task16-fixture',
      branch: 'main',
      subdirectory: 'light-extension',
    },
    status: 'active',
    remoteTargetVersion: 1,
    revision: 'remote-task16',
    credentialConfigured: true,
    authRefDisplay: LIGHT_EXTENSION_SYNC_TEST_AUTH_REF_DISPLAY,
    lastSyncedAt: '2026-07-16T00:00:00.000Z',
  };
  const repoRecord: LightExtensionRepoRecord = {
    id: repo.id,
    name: repo.name,
    normalizedName: repo.name,
    title: repo.title,
    lifecycleStatus: 'enabled',
    healthStatus: 'ready',
    headCommitId: repo.headCommitId,
    entryCount: Object.keys(repo.entries).length,
  };
  let currentSource: LightExtensionSyncSourceSummary | null = source;
  let plan = createLightExtensionSyncPlan('remote-ahead', {
    local: { headCommitId: repo.headCommitId, contentHash: 'sha256:old-local' },
  });
  let planRequests = 0;
  const errors = new Map<LightExtensionSyncActionName, SyncError>();
  const calls: SyncCall[] = [];
  const createdRepoIds: string[] = [];
  const responseBodies: string[] = [];

  const handleSync = async (route: Route) => {
    const action = getAction(route) as LightExtensionSyncActionName;
    const body = getBody(route);
    calls.push({ action, body });
    const error = errors.get(action);
    if (error) {
      const responseBody = JSON.stringify({ errors: [error] });
      responseBodies.push(responseBody);
      await route.fulfill({
        status: error.status,
        contentType: 'application/json',
        body: responseBody,
      });
      return;
    }

    if (action === 'get') {
      await fulfill(route, { repoId: repo.id, source: currentSource });
      return;
    }
    if (action === 'plan') {
      planRequests += 1;
      await fulfill(route, { repoId: repo.id, source: currentSource, plan });
      return;
    }
    if (action === 'testConnection') {
      await fulfill(route, {
        ok: true,
        provider: 'github',
        config: source.config,
        revision: source.revision,
        credentialConfigured: true,
        authRefDisplay: LIGHT_EXTENSION_SYNC_TEST_AUTH_REF_DISPLAY,
      });
      return;
    }
    if (action === 'disconnect') {
      currentSource = null;
      plan = createLightExtensionSyncPlan('unconfigured');
      await fulfill(route, { repoId: repo.id, source: null });
      return;
    }
    if (action === 'createFromGit') {
      const input = readCreateFromGitInput(body);
      const createResponse = await page.request.post('/api/lightExtensionRepos:create', {
        headers: session.headers,
        data: {
          name: input.name,
          title: input.title,
          description: input.description,
        },
      });
      const createdRepo = await readApiResponse<LightExtensionRepoRecord>(
        createResponse,
        'Create Task 16 GitHub-source repo',
      );
      createdRepoIds.push(createdRepo.id);
      const createdSource: LightExtensionSyncSourceSummary = {
        ...source,
        config: input.config,
        authRefDisplay: input.authRef ? LIGHT_EXTENSION_SYNC_TEST_AUTH_REF_DISPLAY : null,
        credentialConfigured: Boolean(input.authRef),
      };
      const createdPlan = createLightExtensionSyncPlan('in-sync', {
        local: { headCommitId: createdRepo.headCommitId, contentHash: 'sha256:created' },
        remote: { revision: createdSource.revision, contentHash: 'sha256:created', contentHashKnown: true },
      });
      await fulfill(route, { repo: createdRepo, source: createdSource, plan: createdPlan });
      return;
    }
    if (action === 'pull' || action === 'push') {
      const contentHash = action === 'pull' ? 'sha256:pulled' : 'sha256:pushed';
      if (action === 'pull') {
        const response = await page.request.post('/api/lightExtensionRepos:updateMetadata', {
          headers: session.headers,
          data: {
            repoId: repo.id,
            title: repo.title,
            description: LIGHT_EXTENSION_SYNC_PULL_DESCRIPTION,
          },
        });
        if (!response.ok()) {
          throw new Error(`Task 16 Pull metadata update failed with HTTP ${response.status()}`);
        }
        repoRecord.description = LIGHT_EXTENSION_SYNC_PULL_DESCRIPTION;
      }
      plan = createLightExtensionSyncPlan('in-sync', {
        fingerprint: `task16-${action}-complete`,
        local: { headCommitId: repo.headCommitId, contentHash },
        remote: { revision: source.revision, contentHash, contentHashKnown: true },
      });
      await fulfill(route, { repo: repoRecord, source, plan });
      return;
    }
    if (action === 'configure') {
      currentSource = source;
      plan = createLightExtensionSyncPlan('in-sync');
      await fulfill(route, { repoId: repo.id, source });
      return;
    }

    await fulfill(route, { repo: repoRecord, source, plan });
  };

  return {
    async install() {
      await page.route('**/api/environmentVariables*', async (route) => {
        await fulfill(route, [
          { name: 'TEST_GITHUB_TOKEN', type: 'secret' },
          { name: 'PUBLIC_TASK16_VALUE', type: 'default' },
        ]);
      });
      await page.route('**/api/lightExtensionSync:*', handleSync);
    },
    setPlan(nextPlan) {
      plan = nextPlan;
      currentSource = nextPlan.state === 'unconfigured' ? null : source;
    },
    setError(action, error) {
      if (error) {
        errors.set(action, error);
      } else {
        errors.delete(action);
      }
    },
    getPlanRequestCount() {
      return planRequests;
    },
    getCalls() {
      return [...calls];
    },
    getCreatedRepoIds() {
      return [...createdRepoIds];
    },
    getResponseBodies() {
      return [...responseBodies];
    },
  };
}

function readCreateFromGitInput(body: Record<string, unknown>): LightExtensionSyncCreateFromGitInput {
  if (
    body.provider !== 'github' ||
    !isRecord(body.config) ||
    typeof body.config.owner !== 'string' ||
    typeof body.config.repository !== 'string' ||
    typeof body.config.branch !== 'string' ||
    (body.config.subdirectory !== null && typeof body.config.subdirectory !== 'string') ||
    typeof body.name !== 'string'
  ) {
    throw new Error('Task 16 createFromGit request is invalid');
  }
  return {
    provider: body.provider,
    config: {
      owner: body.config.owner,
      repository: body.config.repository,
      branch: body.config.branch,
      subdirectory: body.config.subdirectory,
    },
    name: body.name,
    title: typeof body.title === 'string' || body.title === null ? body.title : undefined,
    description: typeof body.description === 'string' || body.description === null ? body.description : undefined,
    authRef: typeof body.authRef === 'string' ? body.authRef : undefined,
  };
}

function getAction(route: Route): string {
  return (new URL(route.request().url()).pathname.split(':').at(-1) || '').split('/').at(-1) || '';
}

function getBody(route: Route): Record<string, unknown> {
  const body: unknown = route.request().postDataJSON();
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}

async function fulfill(route: Route, data: unknown): Promise<void> {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
}
