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
import type { RemoteSyncRuntime } from '../vsc-file/remotes';
import { RemoteSyncError } from '../vsc-file/remotes';
import type {
  VscFileRemoteRecord,
  VscRemoteProvider,
  VscRemoteSyncPlan,
} from '../../shared/vsc-file/remote-sync-types';
import { uid } from '@nocobase/utils';

import { JS_TEMPLATE_COLLECTIONS, type JsTemplateAclAction } from '../../constants';
import { JsTemplateError, isJsTemplateError, mapRemoteSyncErrorToJsTemplate } from '../../shared/errors';
import type {
  JsTemplateSyncConfigureResult,
  JsTemplateSyncCreateFromGitResult,
  JsTemplateSyncDisconnectResult,
  JsTemplateSyncGetResult,
  JsTemplateSyncOperationResult,
  JsTemplateSyncPlanResult,
  JsTemplateSyncSourceSummary,
  JsTemplateSyncTestConnectionResult,
} from '../../shared/types';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import { JsTemplateCreateJobStore, toCreateJobSummary } from '../services/JsTemplateCreateJobStore';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { JsTemplateRemotePullService } from '../services/JsTemplateRemotePullService';
import type { JsTemplateServiceContext } from '../services/JsTemplateProjectService';
import { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { normalizeGitRemoteConfigDraft } from '../vsc-file/remotes/providers/git/gitConfig';
import {
  createTypedResourceAction,
  getServiceContext,
  type JsTemplateResourceContext,
  type ResourceActionInput,
} from './resourceAction';

const remoteName = 'origin';
const redactedCredential = '[REDACTED]';
const secretAuthRefPattern = /^\{\{ \$env\.[A-Za-z_][A-Za-z0-9_]* \}\}$/;
const sensitiveCredentialKeyPattern = /(token|authorization|password|secret|credential|privatekey|authref)/i;
const credentialTransportKeyPattern = /(token|password|secret|credential|privatekey|authref)/i;

export const jsTemplateSyncActionNames = [
  'get',
  'configure',
  'disconnect',
  'testConnection',
  'plan',
  'pull',
  'push',
  'createFromGit',
] as const;

type JsTemplateSyncActionName = (typeof jsTemplateSyncActionNames)[number];

interface SyncActionServices {
  db: Database;
  auditService: JsTemplateAuditService;
  permissionService: JsTemplatePermissionService;
  projectService: JsTemplateProjectService;
  runtimeCompileService: JsTemplateCompileService;
  getRemoteSyncRuntime: () => RemoteSyncRuntime;
  createJobStore: JsTemplateCreateJobStore;
  createJobRunner: JsTemplateCreateJobRunner;
  applicationName: string;
}

type SyncActionRunner = (
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: JsTemplateServiceContext,
) => Promise<unknown>;

const actionPermissions: Record<JsTemplateSyncActionName, readonly JsTemplateAclAction[]> = {
  get: ['manageSyncSource', 'pullFromSyncSource', 'pushToSyncSource'],
  configure: ['manageSyncSource'],
  disconnect: ['manageSyncSource'],
  testConnection: ['manageSyncSource'],
  plan: ['manageSyncSource', 'pullFromSyncSource', 'pushToSyncSource'],
  pull: ['pullFromSyncSource'],
  push: ['pushToSyncSource'],
  createFromGit: ['create', 'manageSyncSource', 'pullFromSyncSource'],
};

const actionAllowedKeys: Record<JsTemplateSyncActionName, readonly string[]> = {
  get: ['projectId', 'filterByTk'],
  configure: ['projectId', 'filterByTk', 'provider', 'config', 'authRef'],
  disconnect: ['projectId', 'filterByTk'],
  testConnection: ['projectId', 'filterByTk', 'provider', 'config', 'authRef'],
  plan: ['projectId', 'filterByTk'],
  pull: [
    'projectId',
    'filterByTk',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ],
  push: [
    'projectId',
    'filterByTk',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ],
  createFromGit: ['provider', 'config', 'name', 'title', 'description', 'authRef'],
};

const actionRunners: Record<JsTemplateSyncActionName, SyncActionRunner> = {
  get: (services, input, ctx) => getSyncSource(services, input, ctx),
  configure: (services, input, ctx) => configureSyncSource(services, input, ctx),
  disconnect: (services, input, ctx) => disconnectSyncSource(services, input, ctx),
  testConnection: (services, input, ctx) => testConnection(services, input, ctx),
  plan: (services, input, ctx) => planSync(services, input, ctx),
  pull: (services, input, ctx) => pullSync(services, input, ctx),
  push: (services, input, ctx) => pushSync(services, input, ctx),
  createFromGit: (services, input, ctx) => createFromGit(services, input, ctx),
};

export function createJsTemplateSyncResource(services: SyncActionServices): ResourceOptions {
  return {
    name: 'jsTemplateSync',
    only: [...jsTemplateSyncActionNames],
    actions: Object.fromEntries(
      jsTemplateSyncActionNames.map((actionName) => [
        actionName,
        createSyncAction(services, actionName, actionRunners[actionName]),
      ]),
    ) as Record<JsTemplateSyncActionName, HandlerType>,
  };
}

function createSyncAction(
  services: SyncActionServices,
  actionName: JsTemplateSyncActionName,
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
      const projectId = requireProjectId(input);
      await assertScopedPermission(currentServices.db, ctx, projectId, actionPermissions[actionName]);
      return deepFreeze(await run(currentServices, input, ctx));
    },
    transformError: (error) => normalizeSyncError(error),
    getHttpStatus: () => (actionName === 'createFromGit' ? 202 : undefined),
  });
  return async (ctx, next) => {
    const resourceCtx = ctx as JsTemplateResourceContext;
    const params = toMutableRecord(resourceCtx.action?.params);
    const values = toMutableRecord(params.values);
    const invalidRootAuthRef =
      Object.hasOwn(values, 'authRef') && values.authRef !== null && !isSecretAuthRef(values.authRef);
    const rejectedTransportCredential = sanitizeUnsafeJsTemplateSyncTransport(resourceCtx);
    const rejectedBodyCredential = sanitizeRejectedBodyCredentials(resourceCtx);
    if (rejectedTransportCredential || rejectedBodyCredential) {
      values[invalidRootAuthRef ? '__rejectedAuthRefInput' : '__rejectedCredentialInput'] = true;
      params.values = values;
    }
    await action(ctx, next);
  };
}

export function sanitizeUnsafeJsTemplateSyncTransport(ctx: JsTemplateResourceContext): boolean {
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
      const normalizedKey = normalizeCredentialKey(key);
      if (normalizedKey.toLowerCase() !== 'xcsrftoken' && credentialTransportKeyPattern.test(normalizedKey)) {
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

function sanitizeRejectedBodyCredentials(ctx: JsTemplateResourceContext): boolean {
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
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncCreateFromGitResult> {
  const provider = requireProvider(input.provider);
  const authRef = typeof input.authRef === 'undefined' ? null : requireNullableAuthRef(input.authRef);
  const config = normalizeGitRemoteConfigDraft(requireRecord(input.config, 'config'));
  const metadata = services.projectService.normalizeCreateMetadata({
    name: requireString(input.name, 'name'),
    title: optionalNullableString(input.title, 'title'),
    description: optionalNullableString(input.description, 'description'),
  });
  const targetProjectId = `jtp_${uid()}`;
  const job = await services.db.sequelize.transaction(async (transaction) => {
    await services.projectService.assertCreateNameAvailable(metadata.name, metadata.normalizedName, transaction);
    return services.createJobStore.enqueue(
      {
        applicationName: services.applicationName,
        targetProjectId,
        name: metadata.name,
        normalizedName: metadata.normalizedName,
        title: metadata.title,
        description: metadata.description,
        sourceType: 'git',
        payload: { sourceType: 'git', provider, config: { ...config }, authRef },
        actorUserId: ctx.actorUserId,
        requestId: ctx.requestId,
      },
      transaction,
    );
  });
  await services.createJobRunner.publish(job.id);
  try {
    await services.auditService.recordCreateJobEvent({
      jobId: job.id,
      targetProjectId: job.targetProjectId,
      sourceType: job.sourceType,
      action: 'createJobEnqueue',
      result: 'success',
      requestId: job.requestId,
      actorUserId: job.actorUserId,
    });
  } catch {
    // A durable creation job must not depend on audit persistence availability.
  }
  return toCreateJobSummary(job);
}

async function getSyncSource(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncGetResult> {
  const project = await services.projectService.getInternalProject(requireProjectId(input), ctx);
  const remote = await services.getRemoteSyncRuntime().getRemote(project.vscRepoId, remoteName);
  const activeRemote = remote?.status === 'active' ? remote : null;
  const revision = activeRemote ? await services.getRemoteSyncRuntime().getLatestMappedRevision(activeRemote.id) : null;
  return {
    projectId: project.id,
    source: activeRemote ? toSourceSummary(activeRemote, revision) : null,
  };
}

async function configureSyncSource(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncConfigureResult> {
  const project = await services.projectService.getInternalProject(requireProjectId(input), ctx);
  assertProjectNotArchived(project.lifecycleStatus);
  const provider = requireProvider(input.provider);
  const saved = await services.getRemoteSyncRuntime().getRemote(project.vscRepoId, remoteName);
  const authRef = typeof input.authRef === 'undefined' ? saved?.authRef ?? null : requireNullableAuthRef(input.authRef);
  return runSyncAudit(services, ctx, project.id, 'syncConfigure', async () => {
    const runtime = services.getRemoteSyncRuntime();
    const tested = await runtime.testTarget({ provider, config: requireRecord(input.config, 'config'), authRef });
    const remote = await runtime.configureRemote({
      repoId: project.vscRepoId,
      name: remoteName,
      provider,
      config: tested.config,
      authRef,
    });
    const revision = tested.snapshot.revision;
    return {
      result: {
        projectId: project.id,
        source: toSourceSummary(remote, revision),
      },
      audit: remoteAudit(remote),
    };
  });
}

async function disconnectSyncSource(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncDisconnectResult> {
  const project = await services.projectService.getInternalProject(requireProjectId(input), ctx);
  return runSyncAudit(services, ctx, project.id, 'syncDisconnect', async () => {
    const remote = await services.getRemoteSyncRuntime().getRemote(project.vscRepoId, remoteName);
    if (remote) {
      await services.getRemoteSyncRuntime().disconnectRemote(remote.id);
    }
    return {
      result: { projectId: project.id, source: null },
      audit: remote ? remoteAudit(remote) : {},
    };
  });
}

async function testConnection(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncTestConnectionResult> {
  const project = await services.projectService.getInternalProject(requireProjectId(input), ctx);
  assertProjectNotArchived(project.lifecycleStatus);
  const saved = await services.getRemoteSyncRuntime().getRemote(project.vscRepoId, remoteName);
  const provider = typeof input.provider === 'undefined' ? saved?.provider : requireProvider(input.provider);
  const config = typeof input.config === 'undefined' ? saved?.config : requireRecord(input.config, 'config');
  const authRef = typeof input.authRef === 'undefined' ? saved?.authRef ?? null : requireNullableAuthRef(input.authRef);
  if (!provider || !config) {
    throw invalidInput('provider and config are required when no sync source is configured');
  }

  return runSyncAudit(services, ctx, project.id, 'syncTestConnection', async () => {
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
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncPlanResult> {
  const project = await services.projectService.getInternalProject(requireProjectId(input), ctx);
  const remote = await services.getRemoteSyncRuntime().getRemote(project.vscRepoId, remoteName);
  const activeRemote = remote?.status === 'active' ? remote : null;
  return runSyncAudit(services, ctx, project.id, 'syncPlan', async () => {
    const plan = activeRemote
      ? await services.getRemoteSyncRuntime().planRemote(activeRemote.id)
      : await services.getRemoteSyncRuntime().planUnconfigured(project.vscRepoId);
    return {
      result: {
        projectId: project.id,
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
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncOperationResult> {
  const project = await services.projectService.getInternalProject(requireProjectId(input), ctx);
  assertProjectNotArchived(project.lifecycleStatus);
  const remote = await requireSavedRemote(services, project.vscRepoId);
  const execution = normalizeExecutionInput(input);
  return runSyncAudit(services, ctx, project.id, 'syncPull', async () => {
    const pullService = new JsTemplateRemotePullService(
      services.permissionService,
      services.projectService,
      services.runtimeCompileService,
      services.getRemoteSyncRuntime().getPullCoordinator(),
    );
    const pulled = await pullService.pull(
      {
        projectId: project.id,
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
        project: pulled.project,
        source: toSourceSummary(currentRemote, pulled.plan.remote.revision),
        plan: pulled.plan,
      },
      audit: {
        ...remoteAudit(currentRemote),
        localCommitId: pulled.project.headCommitId,
        state: pulled.plan.state,
        syncAction: pulled.plan.action,
      },
    };
  });
}

async function pushSync(
  services: SyncActionServices,
  input: ResourceActionInput,
  ctx: JsTemplateServiceContext,
): Promise<JsTemplateSyncOperationResult> {
  const project = await services.projectService.getInternalProject(requireProjectId(input), ctx);
  assertProjectNotArchived(project.lifecycleStatus);
  const remote = await requireSavedRemote(services, project.vscRepoId);
  const execution = normalizeExecutionInput(input);
  return runSyncAudit(services, ctx, project.id, 'syncPush', async () => {
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
          reason: 'push js-template source to remote',
          allowedActions: ['push'],
          actorUserId: ctx.actorUserId,
          jsTemplateProjectId: project.id,
          aclAction: 'pushToSyncSource',
          requestSource: ctx.requestSource || 'js-template-remote-push',
        }),
      },
    );
    const currentProject = await services.projectService.getProject(project.id, ctx);
    return {
      result: {
        project: currentProject,
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
    throw new JsTemplateError('JS_TEMPLATE_SYNC_CONFIG_INVALID', 'An active sync source is required', {
      details: { reasonCode: 'sync-source-not-configured' },
    });
  }
  return remote;
}

async function assertScopedPermission(
  db: Database,
  ctx: JsTemplateServiceContext,
  projectId: string,
  actions: readonly JsTemplateAclAction[],
): Promise<void> {
  if (!ctx.can) {
    throw permissionDenied(actions);
  }
  for (const action of actions) {
    const permission = await ctx.can({ resource: 'jsTemplate', action });
    if (await permissionIncludesProject(db, permission, projectId)) {
      return;
    }
  }
  throw permissionDenied(actions);
}

async function assertAllPermissions(
  ctx: JsTemplateServiceContext,
  actions: readonly JsTemplateAclAction[],
): Promise<void> {
  if (!ctx.can) {
    throw permissionDenied(actions);
  }
  for (const action of actions) {
    const permission = await ctx.can({ resource: 'jsTemplate', action });
    if (!permission) {
      throw permissionDenied(actions);
    }
  }
}

async function permissionIncludesProject(db: Database, permission: unknown, projectId: string): Promise<boolean> {
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
  const record = await db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
    filter: {
      $and: [{ id: projectId }, filter],
    },
    fields: ['id'],
  });
  return Boolean(record);
}

function permissionDenied(actions: readonly JsTemplateAclAction[]): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'JS Template sync permission is required', {
    details: { actions: [...actions] },
  });
}

async function runSyncAudit<TResult>(
  services: SyncActionServices,
  ctx: JsTemplateServiceContext,
  projectId: string,
  action: Parameters<JsTemplateAuditService['recordSyncEvent']>[0]['action'],
  run: () => Promise<{
    result: TResult;
    audit: Omit<
      Parameters<JsTemplateAuditService['recordSyncEvent']>[0],
      'projectId' | 'action' | 'result' | 'requestId' | 'actorUserId' | 'message'
    >;
  }>,
): Promise<TResult> {
  const requestId = ctx.requestId || `${action}:${projectId}`;
  try {
    const completed = await run();
    await services.auditService.recordSyncEvent({
      projectId,
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
        projectId,
        action,
        result: 'blocked',
        requestId,
        actorUserId: ctx.actorUserId,
        reasonCode: isJsTemplateError(safeError) ? safeError.code : 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
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
    return mapRemoteSyncErrorToJsTemplate(error);
  }
  if (isJsTemplateError(error)) {
    return error;
  }
  return new JsTemplateError('JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE', 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE', {
    details: { reasonCode: 'sync-operation-failed' },
  });
}

function toSourceSummary(remote: VscFileRemoteRecord, revision: string | null = null): JsTemplateSyncSourceSummary {
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

function requireProjectId(input: ResourceActionInput): string {
  return requireString(input.projectId || input.filterByTk, 'projectId');
}

function requireProvider(value: unknown): VscRemoteProvider {
  if (value !== 'git') {
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
  if (input.__rejectedAuthRefInput === true) {
    throw new JsTemplateError(
      'JS_TEMPLATE_SYNC_AUTH_REF_INVALID',
      'Remote credential must reference a Secret environment variable',
      { details: { reasonCode: 'secret-variable-required' } },
    );
  }
  const allowed = new Set([...allowedKeys, 'resourceName', 'actionName']);
  const unexpected = Object.keys(input).filter((key) => typeof input[key] !== 'undefined' && !allowed.has(key));
  if (unexpected.length) {
    throw invalidInput(`Unexpected sync input field: ${unexpected.sort()[0]}`);
  }
}

function assertProjectNotArchived(status: string): void {
  if (status === 'archived') {
    throw new JsTemplateError('JS_TEMPLATE_PROJECT_ARCHIVED', 'Archived JS Template projects cannot synchronize');
  }
}

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message);
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
