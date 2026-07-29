/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { isVscError } from '../vsc-file/public-api';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import { uid } from '@nocobase/utils';

import { LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES } from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionCreateJobAcceptedResult,
  LightExtensionInspectSourceArchiveResult,
  LightExtensionRepoLifecycleStatus,
  LightExtensionTreeEntryInput,
  LightExtensionUpdateRepoInput,
} from '../../shared/types';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionCreateJobRunner } from '../services/LightExtensionCreateJobRunner';
import { LightExtensionCreateJobStore, toCreateJobSummary } from '../services/LightExtensionCreateJobStore';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LIGHT_EXTENSION_VALIDATION_LIMITS } from '../services/LightExtensionValidator';
import { isStrictUtf8Text, parseLightExtensionSourceArchive } from '../services/LightExtensionSourceArchive';
import { toLightExtensionSourceError } from '../services/errorContract';
import { createTypedResourceAction, getServiceContext, toRecord, type ResourceActionInput } from './resourceAction';

export const lightExtensionRepoActionNames = [
  'create',
  'list',
  'get',
  'updateMetadata',
  'changeLifecycle',
  'archive',
  'delete',
  'inspectSourceArchive',
] as const;

type LightExtensionRepoActionName = (typeof lightExtensionRepoActionNames)[number];

type ResourceActionRunner = (
  services: LightExtensionRepoActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

interface LightExtensionRepoActionServices {
  db: Database;
  repoService: LightExtensionRepoService;
  runtimeCompileService: LightExtensionRuntimeCompileService;
  createJobStore: LightExtensionCreateJobStore;
  createJobRunner: LightExtensionCreateJobRunner;
  applicationName: string;
  auditService: LightExtensionAuditService;
}

const resourceActionRunners: Record<LightExtensionRepoActionName, ResourceActionRunner> = {
  create: (services, input, currentUser) => enqueueRepoCreation(services, input, currentUser),
  list: (services, _input, currentUser) => services.repoService.listRepos(currentUser),
  get: (services, input, currentUser) => services.repoService.getRepo(requireRepoId(input), currentUser),
  updateMetadata: (services, input, currentUser) =>
    services.repoService.updateRepo(normalizeUpdateInput(input), currentUser),
  changeLifecycle: (services, input, currentUser) =>
    services.repoService.changeLifecycle(
      {
        repoId: requireRepoId(input),
        lifecycleStatus: requireLifecycleStatus(input),
      },
      currentUser,
    ),
  archive: (services, input, currentUser) =>
    services.repoService.archiveRepo(
      {
        repoId: requireRepoId(input),
      },
      currentUser,
    ),
  delete: (services, input, currentUser) =>
    services.repoService.deleteRepo(
      {
        repoId: requireRepoId(input),
      },
      currentUser,
    ),
  inspectSourceArchive: (services, input, currentUser) => inspectSourceArchive(services, input, currentUser),
};

export function createLightExtensionReposResource(
  db: Database,
  repoService: LightExtensionRepoService,
  runtimeCompileService: LightExtensionRuntimeCompileService,
  createJobStore: LightExtensionCreateJobStore,
  createJobRunner: LightExtensionCreateJobRunner,
  applicationName: string,
  auditService: LightExtensionAuditService,
): ResourceOptions {
  const services = {
    db,
    repoService,
    runtimeCompileService,
    createJobStore,
    createJobRunner,
    applicationName,
    auditService,
  };
  return {
    name: 'lightExtensionRepos',
    only: [...lightExtensionRepoActionNames],
    actions: Object.fromEntries(
      lightExtensionRepoActionNames.map((actionName) => [
        actionName,
        createLightExtensionRepoAction(services, actionName, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionRepoActionName, HandlerType>,
  };
}

function createLightExtensionRepoAction(
  services: LightExtensionRepoActionServices,
  actionName: LightExtensionRepoActionName,
  run: ResourceActionRunner,
): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext,
    transformError: (error, input) =>
      isVscError(error) ? toLightExtensionSourceError(error, getOptionalRepoId(input)) : error,
    getHttpStatus: () => (actionName === 'create' ? 202 : undefined),
  });
}

async function enqueueRepoCreation(
  services: LightExtensionRepoActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
): Promise<LightExtensionCreateJobAcceptedResult> {
  assertOnlyCreateKeys(input);
  const createInput = normalizeCreateJobInput(input);
  const metadata = services.repoService.normalizeCreateMetadata(createInput);
  const targetRepoId = `ler_${uid()}`;
  const job = await services.db.sequelize.transaction(async (transaction) => {
    await services.repoService.assertCreateNameAvailable(metadata.name, metadata.normalizedName, transaction);
    return services.createJobStore.enqueue(
      {
        applicationName: services.applicationName,
        targetRepoId,
        name: metadata.name,
        normalizedName: metadata.normalizedName,
        title: metadata.title,
        description: metadata.description,
        sourceType: createInput.sourceType,
        payload: createInput.payload,
        actorUserId: currentUser.actorUserId,
        requestId: currentUser.requestId,
      },
      transaction,
    );
  });
  await services.createJobRunner.publish(job.id);
  try {
    await services.auditService.recordCreateJobEvent({
      jobId: job.id,
      targetRepoId: job.targetRepoId,
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

async function inspectSourceArchive(
  services: LightExtensionRepoActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
): Promise<LightExtensionInspectSourceArchiveResult> {
  const repo = await services.repoService.getRepo(requireRepoId(input), currentUser);
  if (repo.lifecycleStatus === 'archived') {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_REPO_ARCHIVED',
      'Archived light extension repositories cannot import source archives',
      {
        details: {
          repoId: repo.id,
          lifecycleStatus: repo.lifecycleStatus,
        },
      },
    );
  }

  const files = await parseLightExtensionSourceArchive(
    requireString(input, 'zipBase64'),
    services.repoService.getValidator(),
  );
  return { files };
}

function normalizeCreateJobInput(input: ResourceActionInput): {
  sourceType: 'template' | 'zip';
  name: string;
  title?: string | null;
  description?: string | null;
  payload:
    | { sourceType: 'template'; message: string; initialFiles?: LightExtensionTreeEntryInput[] }
    | { sourceType: 'zip'; message: string; zipBase64: string };
} {
  const zipBase64 = optionalString(input, 'zipBase64');
  const suppliedInitialFiles = optionalArray(input, 'initialFiles', normalizeTreeEntryInput);
  if (Object.hasOwn(input, 'zipBase64') && !zipBase64) {
    throw invalidInput('zipBase64 is required when supplied');
  }
  if (zipBase64 && suppliedInitialFiles) {
    throw invalidInput('zipBase64 and initialFiles cannot be used together');
  }
  if (zipBase64) {
    assertLightweightZipInput(zipBase64);
  }
  assertTextSourceFiles(suppliedInitialFiles || []);
  const message =
    optionalString(input, 'message') ||
    (zipBase64 ? 'Import light extension source' : 'Initial light extension source');
  return {
    name: requireString(input, 'name'),
    title: optionalNullableString(input, 'title'),
    description: optionalNullableString(input, 'description'),
    sourceType: zipBase64 ? 'zip' : 'template',
    payload: zipBase64
      ? { sourceType: 'zip', zipBase64, message }
      : {
          sourceType: 'template',
          message,
          ...(suppliedInitialFiles ? { initialFiles: suppliedInitialFiles } : {}),
        },
  };
}

function assertOnlyCreateKeys(input: ResourceActionInput): void {
  const allowed = new Set([
    'resourceName',
    'actionName',
    'name',
    'title',
    'description',
    'zipBase64',
    'initialFiles',
    'message',
  ]);
  if (Object.keys(input).some((key) => typeof input[key] !== 'undefined' && !allowed.has(key))) {
    throw invalidInput('Request contains unsupported fields');
  }
}

function assertLightweightZipInput(zipBase64: string): void {
  if (!zipBase64 || zipBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(zipBase64)) {
    throw invalidInput('zipBase64 must be valid base64');
  }
  const compressedBytes = Buffer.from(zipBase64, 'base64').byteLength;
  if (compressedBytes > LIGHT_EXTENSION_VALIDATION_LIMITS.maxZipBytes) {
    throw invalidInput('Source ZIP exceeds the compressed size limit');
  }
}

function normalizeUpdateInput(input: ResourceActionInput): LightExtensionUpdateRepoInput {
  return {
    repoId: requireRepoId(input),
    title: requireString(input, 'title'),
    description: optionalNullableString(input, 'description'),
  };
}

function normalizeTreeEntryInput(value: unknown, label: string): LightExtensionTreeEntryInput {
  const record = requireRecord(value, label);
  const normalized = compactObject({
    path: requireString(record, 'path', label),
    content: optionalString(record, 'content', label),
    blobHash: optionalString(record, 'blobHash', label),
    size: optionalNumber(record, 'size', label),
    language: optionalString(record, 'language', label),
    mode: optionalString(record, 'mode', label),
  });

  assertUpsertHasSource(normalized, label);

  return normalized;
}

function assertTextSourceFiles(files: LightExtensionTreeEntryInput[]): void {
  for (const file of files) {
    if (typeof file.content === 'string' && !isStrictUtf8Text(file.content)) {
      throw invalidInput(`Source file must be UTF-8 text without NUL bytes: ${file.path}`);
    }
  }
}

function requireRepoId(input: ResourceActionInput): string {
  return requireString(
    {
      repoId: input.repoId || input.filterByTk,
    },
    'repoId',
  );
}

function getOptionalRepoId(input: ResourceActionInput): string | undefined {
  const value = input.repoId || input.filterByTk;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requireString(input: ResourceActionInput, key: string, label = key): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required`);
  }

  return value.trim();
}

function requireLifecycleStatus(input: ResourceActionInput): LightExtensionRepoLifecycleStatus {
  const value = requireString(input, 'lifecycleStatus');
  if (!(LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES as readonly string[]).includes(value)) {
    throw invalidInput('lifecycleStatus is invalid');
  }
  return value as LightExtensionRepoLifecycleStatus;
}

function optionalString(input: ResourceActionInput, key: string, label = key): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string`);
  }

  return value;
}

function optionalNullableString(input: ResourceActionInput, key: string, label = key): string | null | undefined {
  if (input[key] === null) {
    return null;
  }

  return optionalString(input, key, label);
}

function optionalNumber(input: ResourceActionInput, key: string, label = key): number | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalidInput(`${label} must be a number`);
  }

  return value;
}

function optionalArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw invalidInput(`${key} must be an array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function requireRecord(value: unknown, label: string): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput(`${label} must be an object`);
  }

  return value as ResourceActionInput;
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined')) as T;
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}

function assertUpsertHasSource(file: LightExtensionTreeEntryInput, label: string): void {
  if (typeof file.content !== 'string' && !file.blobHash) {
    throw invalidInput(`${label} must include content or blobHash`);
  }
}
