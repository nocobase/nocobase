/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { VscError, isVscError } from '../../shared/errors';
import {
  buildRunJSFilesHash,
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSSourceAdapterContext,
  type RunJSSourcePermissionResult,
  type RunJSRuntimeArtifact,
  type RunJSSourcePermissionCheck,
  type RunJSSourceOpenResult,
  type RunJSSourcePublishInput,
  type RunJSSourcePublishResult,
} from '../../shared/runjs-source-types';
import type { VscFileChange, VscRepositoryIdentity, VscRepositoryRecord } from '../../shared/types';
import type { VscPermissionHookRegistry, VscPermissionRequestMetadata } from '../permissions';
import { VscFileService } from '../services/VscFileService';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';

export const runJSSourceActionNames = ['open', 'publish'] as const;

type RunJSSourceActionName = (typeof runJSSourceActionNames)[number];

type ResourceActionInput = Record<string, unknown>;

type RunJSSourceResourceContext = Context & {
  action?: {
    params?: unknown;
    resourceName?: string;
    actionName?: string;
  };
  auth?: {
    user?: unknown;
  };
  request?: {
    path?: string;
    method?: string;
    header?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  };
  dataSource?: {
    name?: unknown;
  };
  state?: Record<string, unknown>;
  can?: (options: RunJSSourcePermissionCheck) => unknown;
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type RunJSSourceActionRunner = (
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  input: ResourceActionInput,
  ctx: RunJSSourceResourceContext,
) => Promise<unknown>;

const actionRunners: Record<RunJSSourceActionName, RunJSSourceActionRunner> = {
  open: async (_db, registry, _permissionHooks, input, ctx): Promise<RunJSSourceOpenResult> => {
    const locator = normalizeRunJSSourceLocator(input.locator);
    const adapter = registry.require(locator.kind);
    const adapterCtx = createAdapterContext(ctx);

    await adapter.assertCanRead({ locator, ctx: adapterCtx });
    const legacy = await adapter.readLegacy({ locator, ctx: adapterCtx });

    return {
      locator,
      locatorKind: locator.kind,
      repositoryIdentity: buildRunJSSourceRepositoryIdentity(locator),
      legacy,
      ownerFingerprint: legacy.ownerFingerprint,
    };
  },
  publish: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourcePublishResult> => {
    const publishInput = normalizePublishInput(input);
    const adapter = registry.require(publishInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const request = adapterCtx.request;
      const userId = adapterCtx.userId;

      await adapter.assertCanWrite({ locator: publishInput.locator, ctx: adapterCtx });

      await assertCurrentOwnerFingerprint(adapter, publishInput.locator, adapterCtx, publishInput.baseOwnerFingerprint);

      const repositoryIdentity = buildRunJSSourceRepositoryIdentity(publishInput.locator);
      const serviceCtx = {
        authorId: userId,
        request,
        transaction,
      };
      const repository = publishInput.repoId
        ? await service.getRepository({ repoId: publishInput.repoId }, serviceCtx)
        : (
            await service.ensureRepository(
              {
                ...repositoryIdentity,
                authorId: userId,
                metadata: {
                  sourceKind: publishInput.locator.kind,
                },
              },
              serviceCtx,
            )
          ).repository;
      assertRepositoryMatchesIdentity(repository, repositoryIdentity, publishInput.locator.kind);
      const artifact = buildRuntimeArtifact(publishInput);
      artifact.metadata = {
        ...artifact.metadata,
        repoId: repository.id,
      };
      const pushResult = await service.push(
        {
          repoId: repository.id,
          baseCommitId: publishInput.baseCommitId,
          message: publishInput.message,
          files: publishInput.files,
          draftId: publishInput.draftId,
          authorId: userId,
          metadata: {
            sourceKind: publishInput.locator.kind,
            ownerFingerprint: publishInput.baseOwnerFingerprint,
            filesHash: artifact.filesHash,
          },
        },
        serviceCtx,
      );
      const published = await service.updateRef(
        {
          repoId: repository.id,
          name: 'published',
          targetCommitId: pushResult.commit.id,
          basePublishedCommitId: publishInput.basePublishedCommitId,
        },
        serviceCtx,
      );
      await assertCurrentOwnerFingerprint(adapter, publishInput.locator, adapterCtx, publishInput.baseOwnerFingerprint);
      const writeResult = await adapter.writePublished({
        locator: publishInput.locator,
        artifact,
        commitId: pushResult.commit.id,
        baseOwnerFingerprint: publishInput.baseOwnerFingerprint,
        ctx: adapterCtx,
      });
      const nextOwnerFingerprint =
        writeResult.ownerFingerprint ||
        (await adapter.getFingerprint({
          locator: publishInput.locator,
          ctx: adapterCtx,
        }));

      return {
        locator: publishInput.locator,
        locatorKind: publishInput.locator.kind,
        repository: published.repository,
        commit: pushResult.commit,
        publishedRef: published.ref,
        artifact: {
          entryPath: artifact.entryPath || null,
          filesHash: artifact.filesHash,
          runtimeCodeHash: buildRunJSRuntimeCodeHash(artifact.code),
          diagnostics: artifact.diagnostics,
        },
        ownerFingerprint: nextOwnerFingerprint,
        writeResult: {
          ...writeResult,
          ownerFingerprint: nextOwnerFingerprint,
        },
      };
    });
  },
};

async function assertCurrentOwnerFingerprint(
  adapter: ReturnType<RunJSSourceAdapterRegistry['require']>,
  locator: RunJSSourcePublishInput['locator'],
  ctx: RunJSSourceAdapterContext,
  baseOwnerFingerprint: string,
): Promise<void> {
  const currentFingerprint = await adapter.getFingerprint({
    locator,
    ctx,
  });
  if (currentFingerprint === baseOwnerFingerprint) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS source owner was changed by another writer', {
    details: {
      expected: currentFingerprint,
      received: baseOwnerFingerprint,
      kind: locator.kind,
    },
  });
}

export function createRunJSSourcesResource(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks?: VscPermissionHookRegistry,
): ResourceOptions {
  return {
    name: 'runJSSources',
    only: [...runJSSourceActionNames],
    actions: Object.fromEntries(
      runJSSourceActionNames.map((actionName) => [
        actionName,
        createRunJSSourceAction(db, registry, permissionHooks, actionRunners[actionName]),
      ]),
    ) as Record<RunJSSourceActionName, HandlerType>,
  };
}

function createRunJSSourceAction(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  run: RunJSSourceActionRunner,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as RunJSSourceResourceContext;

    try {
      resourceCtx.body = await run(db, registry, permissionHooks, getActionInput(resourceCtx), resourceCtx);
      await next();
    } catch (error) {
      if (!isVscError(error)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = error.status;
      resourceCtx.body = error.toResponseBody();
    }
  };
}

function normalizePublishInput(input: ResourceActionInput): RunJSSourcePublishInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    basePublishedCommitId: requireNullableString(input, 'basePublishedCommitId'),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    message: requireCommitMessage(input.message),
    files: requireArray(input, 'files', normalizeFileChange),
    artifact: optionalRuntimeArtifact(input.artifact),
    draftId: optionalString(input, 'draftId'),
    entryPath: optionalString(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

function createAdapterContext(ctx: RunJSSourceResourceContext, transaction?: unknown): RunJSSourceAdapterContext {
  return {
    userId: getCurrentUserId(ctx),
    request: getRequestMetadata(ctx),
    state: getCurrentState(ctx),
    currentUser: getCurrentUser(ctx),
    timezone: getRequestTimezone(ctx),
    transaction,
    can: (input) => normalizePermissionResult(ctx.can?.(input)),
  };
}

function assertRepositoryMatchesIdentity(
  repository: VscRepositoryRecord,
  identity: VscRepositoryIdentity,
  sourceKind: string,
): void {
  if (
    repository.ownerType === identity.ownerType &&
    repository.ownerId === identity.ownerId &&
    repository.name === identity.name
  ) {
    return;
  }

  throw new VscError('PERMISSION_DENIED', 'RunJS source repository does not match the requested locator', {
    details: {
      repoId: repository.id,
      sourceKind,
    },
  });
}

function buildRuntimeArtifact(input: RunJSSourcePublishInput): RunJSRuntimeArtifact {
  const entryPath = input.entryPath || input.artifact?.entryPath || selectEntryPath(input.files);
  const code = input.artifact?.code ?? readFileContent(input.files, entryPath) ?? readFirstFileContent(input.files);

  return {
    code,
    version: input.artifact?.version || input.version || 'v2',
    sourceMap: input.artifact?.sourceMap,
    diagnostics: input.artifact?.diagnostics || [],
    filesHash: input.artifact?.filesHash || buildRunJSFilesHash(input.files),
    entryPath,
    metadata: input.artifact?.metadata,
  };
}

function selectEntryPath(files: VscFileChange[]): string {
  return files.find((file) => file.path === 'src/main.tsx')?.path || files[0]?.path || 'src/main.tsx';
}

function readFileContent(files: VscFileChange[], path: string): string | null {
  return files.find((file) => file.path === path && typeof file.content === 'string')?.content ?? null;
}

function readFirstFileContent(files: VscFileChange[]): string {
  return files.find((file) => typeof file.content === 'string')?.content || '';
}

function getActionInput(ctx: RunJSSourceResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function getCurrentUserId(ctx: RunJSSourceResourceContext): string | null {
  const user = getCurrentUser(ctx);
  if (!user || typeof user !== 'object') {
    return null;
  }

  const userWithId = user as { id?: unknown };
  if (typeof userWithId.id === 'string' || typeof userWithId.id === 'number') {
    return String(userWithId.id);
  }

  const get = (user as { get?: (key: string) => unknown }).get;
  if (typeof get !== 'function') {
    return null;
  }

  const id = get('id');
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

function getCurrentUser(ctx: RunJSSourceResourceContext): unknown {
  const state = toRecord(ctx.state);
  return state.currentUser || ctx.auth?.user;
}

function getCurrentState(ctx: RunJSSourceResourceContext): Record<string, unknown> {
  return toRecord(ctx.state);
}

function getRequestMetadata(ctx: RunJSSourceResourceContext): Record<string, unknown> & VscPermissionRequestMetadata {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return compactObject({
    resourceName: ctx.action?.resourceName,
    actionName: ctx.action?.actionName,
    path: ctx.request?.path,
    method: ctx.request?.method,
    requestSource: getHeader(headers, 'x-request-source'),
    locale: getHeader(headers, 'x-locale'),
    timezone: getHeader(headers, 'x-timezone'),
    dataSource: getHeader(headers, 'x-data-source') || toStringValue(ctx.dataSource?.name),
  }) as Record<string, unknown> & VscPermissionRequestMetadata;
}

function getRequestTimezone(ctx: RunJSSourceResourceContext): string | undefined {
  const headers = ctx.request?.headers || ctx.request?.header || {};
  return getHeader(headers, 'x-timezone');
}

function normalizePermissionResult(value: unknown): RunJSSourcePermissionResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const input = value as { params?: unknown };
  if (!input.params || typeof input.params !== 'object' || Array.isArray(input.params)) {
    return {};
  }

  return {
    params: input.params as RunJSSourcePermissionResult['params'],
  };
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toRecord(value: unknown): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ResourceActionInput;
}

function requireString(input: ResourceActionInput, key: string): string {
  const value = input[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" is invalid`);
}

function optionalString(input: ResourceActionInput, key: string): string | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" is invalid`);
}

function requireNullableString(input: ResourceActionInput, key: string): string | null {
  const value = input[key];
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a string or null`);
}

function requireCommitMessage(value: unknown): string {
  if (typeof value !== 'string') {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS publish commit message is required');
  }
  const message = value.trim();
  if (message.length < 3 || message.length > 200) {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS publish commit message must be 3-200 characters');
  }

  return message;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] {
  const value = input[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a non-empty array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function normalizeFileChange(value: unknown, label: string): VscFileChange {
  const input = requireRecord(value, label);

  return compactObject({
    path: requireString(input, 'path'),
    operation: optionalFileOperation(input, 'operation', label),
    content: optionalString(input, 'content'),
    blobHash: optionalString(input, 'blobHash'),
    size: optionalNumber(input, 'size'),
    language: optionalString(input, 'language'),
    mode: optionalString(input, 'mode'),
  }) as VscFileChange;
}

function optionalFileOperation(
  input: ResourceActionInput,
  key: string,
  label: string,
): VscFileChange['operation'] | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}.${key}" is invalid`);
}

function optionalRuntimeArtifact(value: unknown): Partial<RunJSRuntimeArtifact> | undefined {
  if (value === undefined) {
    return undefined;
  }
  const input = requireRecord(value, 'artifact');
  const diagnosticsValue = input.diagnostics;

  return compactObject({
    code: optionalString(input, 'code'),
    version: optionalString(input, 'version'),
    sourceMap: optionalString(input, 'sourceMap'),
    diagnostics: Array.isArray(diagnosticsValue) ? diagnosticsValue : undefined,
    filesHash: optionalString(input, 'filesHash'),
    entryPath: optionalString(input, 'entryPath'),
    metadata: optionalRecord(input, 'metadata'),
  }) as Partial<RunJSRuntimeArtifact>;
}

function requireRecord(value: unknown, label: string): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}" must be an object`);
  }

  return value as ResourceActionInput;
}

function optionalNumber(input: ResourceActionInput, key: string): number | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a number`);
}

function optionalRecord(input: ResourceActionInput, key: string): Record<string, unknown> | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be an object`);
}

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return undefined;
}
