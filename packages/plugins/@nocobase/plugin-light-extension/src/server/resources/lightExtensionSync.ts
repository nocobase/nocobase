/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import type {
  RemoteSyncRuntime,
  VscFileRemoteRecord,
  VscRemoteProvider,
  VscRemoteSyncPlan,
} from '../vsc-file/public-api';
import { RemoteSyncError } from '../vsc-file/public-api';
import { randomUUID } from 'crypto';

import type { LightExtensionAclAction } from '../../constants';
import { LightExtensionError, isLightExtensionError, mapRemoteSyncErrorToLightExtension } from '../../shared/errors';
import type {
  LightExtensionSyncConfigureResult,
  LightExtensionSyncCreateFromGitResult,
  LightExtensionSyncDisconnectResult,
  LightExtensionSyncGetResult,
  LightExtensionSyncOperationResult,
  LightExtensionSyncPlanResult,
  LightExtensionSyncSourceSummary,
  LightExtensionSyncTestConnectionResult,
} from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionCreateFromRemoteService } from '../services/LightExtensionCreateFromRemoteService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRemotePullService } from '../services/LightExtensionRemotePullService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import {
  createTypedResourceAction,
  getServiceContext,
  type LightExtensionResourceContext,
  type ResourceActionInput,
} from './resourceAction';

const remoteName = 'origin';
const redactedCredential = '[REDACTED]';
const secretAuthRefPattern = /^\{\{ \$env\.[A-Za-z_][A-Za-z0-9_]* \}\}$/;
const sensitiveCredentialKeyPattern = /(token|authorization|password|secret|credential|privatekey|authref)/i;
const credentialTransportKeyPattern = /(token|password|secret|credential|privatekey|authref)/i;

export const lightExtensionSyncActionNames = [
  'get',
  'configure',
  'disconnect',
  'testConnection',
  'plan',
  'pull',
  'push',
  'createFromGit',
] as const;

type LightExtensionSyncActionName = (typeof lightExtensionSyncActionNames)[number];

interface SyncActionServices {
  db: Database;
  auditService: LightExtensionAuditService;
  permissionService: LightExtensionPermissionService;
  repoService: LightExtensionRepoService;
  runtimeCompileService: LightExtensionRuntimeCompileService;
  getRemoteSyncRuntime: () => RemoteSyncRuntime;
}

type SyncActionRunner = (
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
) => Promise<unknown>;

const actionPermissions: Record<LightExtensionSyncActionName, readonly LightExtensionAclAction[]> = {
  get: ['manageSyncSource', 'pullFromSyncSource', 'pushToSyncSource'],
  configure: ['manageSyncSource'],
  disconnect: ['manageSyncSource'],
  testConnection: ['manageSyncSource'],
  plan: ['manageSyncSource', 'pullFromSyncSource', 'pushToSyncSource'],
  pull: ['pullFromSyncSource'],
  push: ['pushToSyncSource'],
  createFromGit: ['create', 'manageSyncSource', 'pullFromSyncSource'],
};

const actionAllowedKeys: Record<LightExtensionSyncActionName, readonly string[]> = {
  get: ['repoId', 'filterByTk'],
  configure: ['repoId', 'filterByTk', 'provider', 'config', 'authRef'],
  disconnect: ['repoId', 'filterByTk'],
  testConnection: ['repoId', 'filterByTk', 'provider', 'config', 'authRef'],
  plan: ['repoId', 'filterByTk'],
  pull: [
    'repoId',
    'filterByTk',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ],
  push: [
    'repoId',
    'filterByTk',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ],
  createFromGit: ['provider', 'config', 'name', 'title', 'description', 'authRef'],
};

const actionRunners: Record<LightExtensionSyncActionName, SyncActionRunner> = {
  get: (services, input, ctx) => getSyncSource(services, input, ctx),
  configure: (services, input, ctx) => configureSyncSource(services, input, ctx),
  disconnect: (services, input, ctx) => disconnectSyncSource(services, input, ctx),
  testConnection: (services, input, ctx) => testConnection(services, input, ctx),
  plan: (services, input, ctx) => planSync(services, input, ctx),
  pull: (services, input, ctx) => pullSync(services, input, ctx),
  push: (services, input, ctx) => pushSync(services, input, ctx),
  createFromGit: (services, input, ctx) => createFromGit(services, input, ctx),
};

export function createLightExtensionSyncResource(services: SyncActionServices): ResourceOptions {
  return {
    name: 'lightExtensionSync',
    only: [...lightExtensionSyncActionNames],
    actions: Object.fromEntries(
      lightExtensionSyncActionNames.map((actionName) => [
        actionName,
        createSyncAction(services, actionName, actionRunners[actionName]),
      ]),
    ) as Record<LightExtensionSyncActionName, HandlerType>,
  };
}

function createSyncAction(
  services: SyncActionServices,
  actionName: LightExtensionSyncActionName,
  run: SyncActionRunner,
): HandlerType {
  const action = createTypedResourceAction({
    services,
    getServiceContext: (ctx) => ({ ...getServiceContext(ctx), can: ctx.can }),
    run: async (currentServices, input, ctx) => {
      assertOnlyKeys(input, actionAllowedKeys[actionName]);
      if (actionName === 'createFromGit') {
        await assertAllPermissions(ctx, actionPermissions.createFromGit);
        return deepFreeze(await run(currentServices, input, ctx));
      }
      const repoId = requireRepoId(input);
      await assertScopedPermission(currentServices.db, ctx, repoId, actionPermissions[actionName]);
      return deepFreeze(await run(currentServices, input, ctx));
    },
    transformError: (error) => normalizeSyncError(error),
  });
  return async (ctx, next) => {
    const resourceCtx = ctx as LightExtensionResourceContext;
    if (sanitizeUnsafeLightExtensionSyncTransport(resourceCtx) || sanitizeRejectedBodyCredentials(resourceCtx)) {
      const params = toMutableRecord(resourceCtx.action?.params);
      const values = toMutableRecord(params.values);
      values.__rejectedCredentialInput = true;
      params.values = values;
    }
    await action(ctx, next);
  };
}

export function sanitizeUnsafeLightExtensionSyncTransport(ctx: LightExtensionResourceContext): boolean {
  let rejected = false;
  const params = toMutableRecord(ctx.action?.params);
  for (const key of Object.keys(params)) {
    if (key !== 'values' && sensitiveCredentialKeyPattern.test(normalizeCredentialKey(key))) {
      params[key] = redactedCredential;
      rejected = true;
    }
  }

  const headers = ctx.request?.headers || ctx.request?.header;
  if (headers) {
    for (const key of Object.keys(headers)) {
      if (credentialTransportKeyPattern.test(normalizeCredentialKey(key))) {
        headers[key] = redactedCredential;
        rejected = true;
      }
    }
  }

  const requestPath = ctx.request?.path;
  if (requestPath && credentialTransportKeyPattern.test(requestPath)) {
    ctx.request.path = redactedCredential;
    rejected = true;
  }
  return rejected;
}

function sanitizeRejectedBodyCredentials(ctx: LightExtensionResourceContext): boolean {
  const params = toMutableRecord(ctx.action?.params);
  const values = toMutableRecord(params.values);
  const seen = new WeakSet<object>();

  const sanitize = (value: unknown, root: boolean): boolean => {
    if (!value || typeof value !== 'object') {
      return false;
    }
    if (seen.has(value)) {
      return true;
    }
    seen.add(value);
    if (Array.isArray(value)) {
      return value.reduce((rejected, item) => sanitize(item, false) || rejected, false);
    }

    let rejected = false;
    for (const [key, child] of Object.entries(value)) {
      const normalizedKey = normalizeCredentialKey(key);
      const invalidAuthRef = key === 'authRef' && (!root || (child !== null && !isSecretAuthRef(child)));
      if (invalidAuthRef || (key !== 'authRef' && sensitiveCredentialKeyPattern.test(normalizedKey))) {
        value[key] = redactedCredential;
        rejected = true;
      } else {
        rejected = sanitize(child, false) || rejected;
      }
    }
    return rejected;
  };

  return sanitize(values, true);
}

async function createFromGit(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncCreateFromGitResult> {
  const requestId = ctx.requestId || `syncCreateFromGit:${randomUUID()}`;
  let provider: VscRemoteProvider | undefined;
  try {
    provider = requireProvider(input.provider);
    const authRef = typeof input.authRef === 'undefined' ? null : requireNullableAuthRef(input.authRef);
    const createService = new LightExtensionCreateFromRemoteService(
      services.db,
      services.auditService,
      services.repoService,
      services.runtimeCompileService,
      services.getRemoteSyncRuntime,
    );
    const created = await createService.create(
      {
        provider,
        config: requireRecord(input.config, 'config'),
        authRef,
        name: requireString(input.name, 'name'),
        title: optionalNullableString(input.title, 'title'),
        description: optionalNullableString(input.description, 'description'),
      },
      { ...ctx, requestId },
    );
    return {
      repo: created.repo,
      source: toSourceSummary(created.remote, created.revision),
      plan: created.plan,
    };
  } catch (error) {
    const safeError = normalizeSyncError(error);
    try {
      await services.auditService.recordSyncEvent({
        action: 'syncCreateFromGit',
        result: 'blocked',
        requestId,
        actorUserId: ctx.actorUserId,
        provider,
        reasonCode: isLightExtensionError(safeError) ? safeError.code : 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE',
        message: 'syncCreateFromGit failed',
      });
    } catch {
      // The safe create error contract must not depend on audit persistence availability.
    }
    throw safeError;
  }
}

async function getSyncSource(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncGetResult> {
  const repo = await services.repoService.getInternalRepo(requireRepoId(input), ctx);
  const remote = await services.getRemoteSyncRuntime().getRemote(repo.vscRepoId, remoteName);
  const activeRemote = remote?.status === 'active' ? remote : null;
  const revision = activeRemote ? await services.getRemoteSyncRuntime().getLatestMappedRevision(activeRemote.id) : null;
  return {
    repoId: repo.id,
    source: activeRemote ? toSourceSummary(activeRemote, revision) : null,
  };
}

async function configureSyncSource(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncConfigureResult> {
  const repo = await services.repoService.getInternalRepo(requireRepoId(input), ctx);
  assertRepoNotArchived(repo.lifecycleStatus);
  const provider = requireProvider(input.provider);
  const saved = await services.getRemoteSyncRuntime().getRemote(repo.vscRepoId, remoteName);
  const authRef = typeof input.authRef === 'undefined' ? saved?.authRef ?? null : requireNullableAuthRef(input.authRef);
  return runSyncAudit(services, ctx, repo.id, 'syncConfigure', async () => {
    const runtime = services.getRemoteSyncRuntime();
    const normalizedConfig = runtime.normalizeConfig(provider, requireRecord(input.config, 'config'));
    const tested = normalizedConfig.branch
      ? null
      : await runtime.testTarget({ provider, config: normalizedConfig, authRef });
    const remote = await services.getRemoteSyncRuntime().configureRemote({
      repoId: repo.vscRepoId,
      name: remoteName,
      provider,
      config: tested?.config ?? normalizedConfig,
      authRef,
    });
    const revision = tested?.snapshot.revision ?? (await runtime.getLatestMappedRevision(remote.id));
    return {
      result: {
        repoId: repo.id,
        source: toSourceSummary(remote, revision),
      },
      audit: remoteAudit(remote),
    };
  });
}

async function disconnectSyncSource(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncDisconnectResult> {
  const repo = await services.repoService.getInternalRepo(requireRepoId(input), ctx);
  return runSyncAudit(services, ctx, repo.id, 'syncDisconnect', async () => {
    const remote = await services.getRemoteSyncRuntime().getRemote(repo.vscRepoId, remoteName);
    if (remote) {
      await services.getRemoteSyncRuntime().disconnectRemote(remote.id);
    }
    return {
      result: { repoId: repo.id, source: null },
      audit: remote ? remoteAudit(remote) : {},
    };
  });
}

async function testConnection(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncTestConnectionResult> {
  const repo = await services.repoService.getInternalRepo(requireRepoId(input), ctx);
  assertRepoNotArchived(repo.lifecycleStatus);
  const saved = await services.getRemoteSyncRuntime().getRemote(repo.vscRepoId, remoteName);
  const provider = typeof input.provider === 'undefined' ? saved?.provider : requireProvider(input.provider);
  const config = typeof input.config === 'undefined' ? saved?.config : requireRecord(input.config, 'config');
  const authRef = typeof input.authRef === 'undefined' ? saved?.authRef ?? null : requireNullableAuthRef(input.authRef);
  if (!provider || !config) {
    throw invalidInput('provider and config are required when no sync source is configured');
  }

  return runSyncAudit(services, ctx, repo.id, 'syncTestConnection', async () => {
    const tested = await services.getRemoteSyncRuntime().testTarget({ provider, config, authRef });
    return {
      result: {
        ok: true,
        provider: tested.provider,
        config: tested.config,
        revision: tested.snapshot.revision,
        credentialConfigured: authRef !== null,
        authRefDisplay: toAuthRefDisplay(authRef),
      },
      audit: {
        provider: tested.provider,
        remoteRevision: tested.snapshot.revision,
      },
    };
  });
}

async function planSync(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncPlanResult> {
  const repo = await services.repoService.getInternalRepo(requireRepoId(input), ctx);
  const remote = await services.getRemoteSyncRuntime().getRemote(repo.vscRepoId, remoteName);
  const activeRemote = remote?.status === 'active' ? remote : null;
  return runSyncAudit(services, ctx, repo.id, 'syncPlan', async () => {
    const plan = activeRemote
      ? await services.getRemoteSyncRuntime().planRemote(activeRemote.id)
      : await services.getRemoteSyncRuntime().planUnconfigured(repo.vscRepoId);
    return {
      result: {
        repoId: repo.id,
        source: activeRemote ? toSourceSummary(activeRemote, plan.remote.revision) : null,
        plan,
      },
      audit: planAudit(activeRemote, plan),
    };
  });
}

async function pullSync(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncOperationResult> {
  const repo = await services.repoService.getInternalRepo(requireRepoId(input), ctx);
  assertRepoNotArchived(repo.lifecycleStatus);
  const remote = await requireSavedRemote(services, repo.vscRepoId);
  const execution = normalizeExecutionInput(input);
  return runSyncAudit(services, ctx, repo.id, 'syncPull', async () => {
    const pullService = new LightExtensionRemotePullService(
      services.permissionService,
      services.repoService,
      services.runtimeCompileService,
      services.getRemoteSyncRuntime().getPullCoordinator(),
    );
    const pulled = await pullService.pull(
      {
        repoId: repo.id,
        remoteId: remote.id,
        expectedLocalCommitId: execution.expectedHeadCommitId,
        expectedRemoteRevision: execution.expectedRemoteRevision,
        expectedRemoteTargetVersion: execution.expectedRemoteTargetVersion,
        planFingerprint: execution.planFingerprint,
      },
      ctx,
    );
    const currentRemote = await services.getRemoteSyncRuntime().getRemoteById(remote.id);
    return {
      result: {
        repo: pulled.repo,
        source: toSourceSummary(currentRemote, pulled.plan.remote.revision),
        plan: pulled.plan,
      },
      audit: {
        ...remoteAudit(currentRemote),
        localCommitId: pulled.repo.headCommitId,
        state: pulled.plan.state,
        syncAction: pulled.plan.action,
      },
    };
  });
}

async function pushSync(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: LightExtensionServiceContext,
): Promise<LightExtensionSyncOperationResult> {
  const repo = await services.repoService.getInternalRepo(requireRepoId(input), ctx);
  assertRepoNotArchived(repo.lifecycleStatus);
  const remote = await requireSavedRemote(services, repo.vscRepoId);
  const execution = normalizeExecutionInput(input);
  return runSyncAudit(services, ctx, repo.id, 'syncPush', async () => {
    const requestId = ctx.requestId || `remote-push:${remote.id}`;
    const pushed = await services.getRemoteSyncRuntime().push(
      {
        remoteId: remote.id,
        expectedLocalCommitId: execution.expectedHeadCommitId,
        expectedRemoteRevision: execution.expectedRemoteRevision,
        expectedRemoteTargetVersion: execution.expectedRemoteTargetVersion,
        planFingerprint: execution.planFingerprint,
      },
      {
        authorId: ctx.actorUserId,
        request: services.permissionService.createInternalVscRequestContext({
          requestId,
          reason: 'push light-extension source to remote',
          allowedActions: ['push'],
          actorUserId: ctx.actorUserId,
          lightExtensionRepoId: repo.id,
          aclAction: 'pushToSyncSource',
          requestSource: ctx.requestSource || 'light-extension-remote-push',
        }),
      },
    );
    const currentRepo = await services.repoService.getRepo(repo.id, ctx);
    return {
      result: {
        repo: currentRepo,
        source: toSourceSummary(pushed.remote, pushed.job.resultRemoteRevision),
        plan: pushed.plan,
      },
      audit: {
        ...remoteAudit(pushed.remote),
        localCommitId: pushed.job.resultLocalCommitId,
        remoteRevision: pushed.job.resultRemoteRevision,
        state: pushed.plan.state,
        syncAction: pushed.plan.action,
      },
    };
  });
}

async function requireSavedRemote(services: SyncActionServices, vscRepoId: string): Promise<VscFileRemoteRecord> {
  const remote = await services.getRemoteSyncRuntime().getRemote(vscRepoId, remoteName);
  if (!remote || remote.status !== 'active') {
    throw new LightExtensionError('LIGHT_EXTENSION_SYNC_CONFIG_INVALID', 'An active sync source is required', {
      details: { reasonCode: 'sync-source-not-configured' },
    });
  }
  return remote;
}

async function assertScopedPermission(
  db: Database,
  ctx: LightExtensionServiceContext,
  repoId: string,
  actions: readonly LightExtensionAclAction[],
): Promise<void> {
  if (!ctx.can) {
    throw permissionDenied(actions);
  }
  for (const action of actions) {
    const permission = await ctx.can({ resource: 'lightExtension', action });
    if (await permissionIncludesRepo(db, permission, repoId)) {
      return;
    }
  }
  throw permissionDenied(actions);
}

async function assertAllPermissions(
  ctx: LightExtensionServiceContext,
  actions: readonly LightExtensionAclAction[],
): Promise<void> {
  if (!ctx.can) {
    throw permissionDenied(actions);
  }
  for (const action of actions) {
    const permission = await ctx.can({ resource: 'lightExtension', action });
    if (!permission) {
      throw permissionDenied(actions);
    }
  }
}

async function permissionIncludesRepo(db: Database, permission: unknown, repoId: string): Promise<boolean> {
  if (!permission) {
    return false;
  }
  if (permission === true) {
    return true;
  }
  if (typeof permission !== 'object' || Array.isArray(permission)) {
    return false;
  }
  const params = (permission as { params?: unknown }).params;
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return true;
  }
  const filter = (params as { filter?: unknown }).filter;
  if (!filter) {
    return true;
  }
  const record = await db.getRepository('lightExtensionRepos').findOne({
    filter: {
      $and: [{ id: repoId }, filter],
    },
    fields: ['id'],
  });
  return Boolean(record);
}

function permissionDenied(actions: readonly LightExtensionAclAction[]): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_PERMISSION_DENIED', 'Light extension sync permission is required', {
    details: { actions: [...actions] },
  });
}

async function runSyncAudit<TResult>(
  services: SyncActionServices,
  ctx: LightExtensionServiceContext,
  repoId: string,
  action: Parameters<LightExtensionAuditService['recordSyncEvent']>[0]['action'],
  run: () => Promise<{
    result: TResult;
    audit: Omit<
      Parameters<LightExtensionAuditService['recordSyncEvent']>[0],
      'repoId' | 'action' | 'result' | 'requestId' | 'actorUserId' | 'message'
    >;
  }>,
): Promise<TResult> {
  const requestId = ctx.requestId || `${action}:${repoId}`;
  try {
    const completed = await run();
    await services.auditService.recordSyncEvent({
      repoId,
      action,
      result: 'success',
      requestId,
      actorUserId: ctx.actorUserId,
      message: `${action} succeeded`,
      ...completed.audit,
    });
    return completed.result;
  } catch (error) {
    const safeError = normalizeSyncError(error);
    try {
      await services.auditService.recordSyncEvent({
        repoId,
        action,
        result: 'blocked',
        requestId,
        actorUserId: ctx.actorUserId,
        reasonCode: isLightExtensionError(safeError) ? safeError.code : 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE',
        message: `${action} failed`,
      });
    } catch {
      // A sync failure and its safe error contract must not depend on audit persistence availability.
    }
    throw safeError;
  }
}

function normalizeSyncError(error: unknown): unknown {
  if (error instanceof RemoteSyncError) {
    return mapRemoteSyncErrorToLightExtension(error);
  }
  if (isLightExtensionError(error)) {
    return error;
  }
  return new LightExtensionError('LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', {
    details: { reasonCode: 'sync-operation-failed' },
  });
}

function toSourceSummary(remote: VscFileRemoteRecord, revision: string | null = null): LightExtensionSyncSourceSummary {
  return {
    provider: remote.provider,
    config: { ...remote.config },
    status: remote.status,
    remoteTargetVersion: remote.version,
    revision,
    credentialConfigured: remote.authRef !== null,
    authRefDisplay: toAuthRefDisplay(remote.authRef),
    lastSyncedAt: remote.lastSyncedAt,
  };
}

function remoteAudit(remote: VscFileRemoteRecord) {
  return {
    provider: remote.provider,
    remoteTargetVersion: remote.version,
  };
}

function planAudit(remote: VscFileRemoteRecord | null, plan: VscRemoteSyncPlan) {
  return {
    provider: remote?.provider,
    remoteTargetVersion: plan.remoteTargetVersion ?? undefined,
    remoteRevision: plan.remote.revision,
    localCommitId: plan.local.headCommitId,
    state: plan.state,
    syncAction: plan.action,
  };
}

function toAuthRefDisplay(authRef: string | null): string | null {
  return authRef ? '********' : null;
}

function normalizeExecutionInput(input: ResourceActionInput) {
  return {
    expectedHeadCommitId: requireNullableString(input.expectedHeadCommitId, 'expectedHeadCommitId'),
    expectedRemoteRevision: requireNullableString(input.expectedRemoteRevision, 'expectedRemoteRevision'),
    expectedRemoteTargetVersion: requirePositiveInteger(
      input.expectedRemoteTargetVersion,
      'expectedRemoteTargetVersion',
    ),
    planFingerprint: requireString(input.planFingerprint, 'planFingerprint'),
  };
}

function requireRepoId(input: ResourceActionInput): string {
  return requireString(input.repoId || input.filterByTk, 'repoId');
}

function requireProvider(value: unknown): VscRemoteProvider {
  if (value !== 'github') {
    throw invalidInput('provider is invalid');
  }
  return value;
}

function requireNullableAuthRef(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (!isSecretAuthRef(value)) {
    throw invalidInput('authRef must reference a Secret environment variable');
  }
  return value;
}

function isSecretAuthRef(value: unknown): value is string {
  return typeof value === 'string' && secretAuthRefPattern.test(value);
}

function normalizeCredentialKey(key: string): string {
  return key.replace(/[^A-Za-z0-9]/g, '');
}

function toMutableRecord(value: unknown): ResourceActionInput {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ResourceActionInput) : {};
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required`);
  }
  return value.trim();
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  return requireString(value, label);
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw invalidInput(`${label} must be a positive integer`);
  }
  return value as number;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function optionalNullableString(value: unknown, label: string): string | null | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string or null`);
  }
  const normalized = value.trim();
  return normalized || null;
}

function assertOnlyKeys(input: ResourceActionInput, allowedKeys: readonly string[]): void {
  const allowed = new Set([...allowedKeys, 'resourceName', 'actionName']);
  const unexpected = Object.keys(input).filter((key) => typeof input[key] !== 'undefined' && !allowed.has(key));
  if (unexpected.length) {
    throw invalidInput(`Unexpected sync input field: ${unexpected.sort()[0]}`);
  }
}

function assertRepoNotArchived(status: string): void {
  if (status === 'archived') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', 'Archived repositories cannot synchronize');
  }
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}
