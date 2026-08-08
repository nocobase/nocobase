/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { isVscError } from '@nocobase/runjs-workspace/server';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import { uid } from '@nocobase/utils';

import { JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES } from '../../constants';
import { JS_TEMPLATE_SUPPORTED_KINDS, type JsTemplateKind } from '../../constants';
import type { JsTemplateCatalogAddTemplateInput } from '../../shared/catalogAuthoring';
import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplateCreateJobAcceptedResult,
  JsTemplateInspectSourceArchiveResult,
  JsTemplateProjectLifecycleStatus,
  JsTemplateTreeEntryInput,
  JsTemplateUpdateProjectInput,
} from '../../shared/types';
import type { JsTemplateServiceContext } from '../services/JsTemplateProjectService';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import { JsTemplateCreateJobStore, toCreateJobSummary } from '../services/JsTemplateCreateJobStore';
import { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateCatalogAuthoringService } from '../services/JsTemplateCatalogAuthoringService';
import { JS_TEMPLATE_VALIDATION_LIMITS } from '../services/JsTemplateValidator';
import { isStrictUtf8Text, parseJsTemplateSourceArchive } from '../services/JsTemplateSourceArchive';
import { toJsTemplateSourceError } from '../services/errorContract';
import { createTypedResourceAction, getServiceContext, toRecord, type ResourceActionInput } from './resourceAction';

export const jsTemplateProjectActionNames = [
  'create',
  'addTemplate',
  'list',
  'get',
  'updateMetadata',
  'changeLifecycle',
  'archive',
  'delete',
  'inspectSourceArchive',
] as const;

type JsTemplateProjectActionName = (typeof jsTemplateProjectActionNames)[number];

type ResourceActionRunner = (
  services: JsTemplateProjectActionServices,
  input: ResourceActionInput,
  currentUser: JsTemplateServiceContext,
) => Promise<unknown>;

interface JsTemplateProjectActionServices {
  db: Database;
  projectService: JsTemplateProjectService;
  runtimeCompileService: JsTemplateCompileService;
  catalogAuthoringService: JsTemplateCatalogAuthoringService;
  createJobStore: JsTemplateCreateJobStore;
  createJobRunner: JsTemplateCreateJobRunner;
  applicationName: string;
  auditService: JsTemplateAuditService;
}

const resourceActionRunners: Record<JsTemplateProjectActionName, ResourceActionRunner> = {
  create: (services, input, currentUser) => enqueueProjectCreation(services, input, currentUser),
  addTemplate: (services, input, currentUser) =>
    services.catalogAuthoringService.addTemplate(normalizeAddTemplateInput(input), currentUser),
  list: (services, _input, currentUser) => services.projectService.listProjects(currentUser),
  get: (services, input, currentUser) => services.projectService.getProject(requireProjectId(input), currentUser),
  updateMetadata: (services, input, currentUser) =>
    services.projectService.updateProject(normalizeUpdateInput(input), currentUser),
  changeLifecycle: (services, input, currentUser) =>
    services.projectService.changeLifecycle(
      {
        projectId: requireProjectId(input),
        lifecycleStatus: requireLifecycleStatus(input),
      },
      currentUser,
    ),
  archive: (services, input, currentUser) =>
    services.projectService.archiveProject(
      {
        projectId: requireProjectId(input),
      },
      currentUser,
    ),
  delete: (services, input, currentUser) =>
    services.projectService.deleteProject(
      {
        projectId: requireProjectId(input),
      },
      currentUser,
    ),
  inspectSourceArchive: (services, input, currentUser) => inspectSourceArchive(services, input, currentUser),
};

export function createJsTemplateProjectsResource(
  db: Database,
  projectService: JsTemplateProjectService,
  runtimeCompileService: JsTemplateCompileService,
  catalogAuthoringService: JsTemplateCatalogAuthoringService,
  createJobStore: JsTemplateCreateJobStore,
  createJobRunner: JsTemplateCreateJobRunner,
  applicationName: string,
  auditService: JsTemplateAuditService,
): ResourceOptions {
  const services = {
    db,
    projectService,
    runtimeCompileService,
    catalogAuthoringService,
    createJobStore,
    createJobRunner,
    applicationName,
    auditService,
  };
  return {
    name: 'jsTemplateProjects',
    only: [...jsTemplateProjectActionNames],
    actions: Object.fromEntries(
      jsTemplateProjectActionNames.map((actionName) => [
        actionName,
        createJsTemplateProjectAction(services, actionName, resourceActionRunners[actionName]),
      ]),
    ) as Record<JsTemplateProjectActionName, HandlerType>,
  };
}

function normalizeAddTemplateInput(input: ResourceActionInput): JsTemplateCatalogAddTemplateInput {
  assertOnlyAddTemplateKeys(input);
  const destination = requireRecord(input.destination, 'destination');
  if (destination.type !== 'existing' || Object.keys(destination).some((key) => !['type', 'projectId'].includes(key))) {
    throw invalidInput('destination must identify one existing Source Project');
  }
  return {
    destination: {
      type: 'existing',
      projectId: requireString(destination, 'projectId', 'destination.projectId'),
    },
    expectedHeadCommitId: requireNullableString(input, 'expectedHeadCommitId'),
    kind: requireJsTemplateKind(input),
    templateName: requireString(input, 'templateName'),
    title: requireString(input, 'title'),
    description: optionalNullableString(input, 'description'),
  };
}

function assertOnlyAddTemplateKeys(input: ResourceActionInput): void {
  const allowed = new Set([
    'resourceName',
    'actionName',
    'destination',
    'expectedHeadCommitId',
    'kind',
    'templateName',
    'title',
    'description',
  ]);
  if (Object.keys(input).some((key) => typeof input[key] !== 'undefined' && !allowed.has(key))) {
    throw invalidInput('Request contains unsupported fields');
  }
}

function requireJsTemplateKind(input: ResourceActionInput): JsTemplateKind {
  const value = requireString(input, 'kind');
  if (!(JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(value)) {
    throw invalidInput('kind is invalid');
  }
  return value as JsTemplateKind;
}

function createJsTemplateProjectAction(
  services: JsTemplateProjectActionServices,
  actionName: JsTemplateProjectActionName,
  run: ResourceActionRunner,
): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext,
    transformError: (error, input) =>
      isVscError(error) ? toJsTemplateSourceError(error, getOptionalProjectId(input)) : error,
    getHttpStatus: () => (actionName === 'create' ? 202 : undefined),
  });
}

async function enqueueProjectCreation(
  services: JsTemplateProjectActionServices,
  input: ResourceActionInput,
  currentUser: JsTemplateServiceContext,
): Promise<JsTemplateCreateJobAcceptedResult> {
  assertOnlyCreateKeys(input);
  const createInput = normalizeCreateJobInput(input);
  const metadata = services.projectService.normalizeCreateMetadata(createInput);
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

async function inspectSourceArchive(
  services: JsTemplateProjectActionServices,
  input: ResourceActionInput,
  currentUser: JsTemplateServiceContext,
): Promise<JsTemplateInspectSourceArchiveResult> {
  const project = await services.projectService.getProject(requireProjectId(input), currentUser);
  if (project.lifecycleStatus === 'archived') {
    throw new JsTemplateError(
      'JS_TEMPLATE_PROJECT_ARCHIVED',
      'Archived JS Template projects cannot import source archives',
      {
        details: {
          projectId: project.id,
          lifecycleStatus: project.lifecycleStatus,
        },
      },
    );
  }

  const files = await parseJsTemplateSourceArchive(
    requireString(input, 'zipBase64'),
    services.projectService.getValidator(),
  );
  return { files };
}

function normalizeCreateJobInput(input: ResourceActionInput): {
  sourceType: 'starter' | 'zip';
  name: string;
  title?: string | null;
  description?: string | null;
  payload:
    | { sourceType: 'starter'; message: string; initialFiles?: JsTemplateTreeEntryInput[] }
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
    optionalString(input, 'message') || (zipBase64 ? 'Import JS Template source' : 'Initial JS Template source');
  return {
    name: requireString(input, 'name'),
    title: optionalNullableString(input, 'title'),
    description: optionalNullableString(input, 'description'),
    sourceType: zipBase64 ? 'zip' : 'starter',
    payload: zipBase64
      ? { sourceType: 'zip', zipBase64, message }
      : {
          sourceType: 'starter',
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
  if (compressedBytes > JS_TEMPLATE_VALIDATION_LIMITS.maxZipBytes) {
    throw invalidInput('Source ZIP exceeds the compressed size limit');
  }
}

function normalizeUpdateInput(input: ResourceActionInput): JsTemplateUpdateProjectInput {
  return {
    projectId: requireProjectId(input),
    title: requireString(input, 'title'),
    description: optionalNullableString(input, 'description'),
  };
}

function normalizeTreeEntryInput(value: unknown, label: string): JsTemplateTreeEntryInput {
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

function assertTextSourceFiles(files: JsTemplateTreeEntryInput[]): void {
  for (const file of files) {
    if (typeof file.content === 'string' && !isStrictUtf8Text(file.content)) {
      throw invalidInput(`Source file must be UTF-8 text without NUL bytes: ${file.path}`);
    }
  }
}

function requireProjectId(input: ResourceActionInput): string {
  return requireString(
    {
      projectId: input.projectId || input.filterByTk,
    },
    'projectId',
  );
}

function getOptionalProjectId(input: ResourceActionInput): string | undefined {
  const value = input.projectId || input.filterByTk;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requireString(input: ResourceActionInput, key: string, label = key): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required`);
  }

  return value.trim();
}

function requireLifecycleStatus(input: ResourceActionInput): JsTemplateProjectLifecycleStatus {
  const value = requireString(input, 'lifecycleStatus');
  if (!(JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES as readonly string[]).includes(value)) {
    throw invalidInput('lifecycleStatus is invalid');
  }
  return value as JsTemplateProjectLifecycleStatus;
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

function requireNullableString(input: ResourceActionInput, key: string, label = key): string | null {
  if (!Object.hasOwn(input, key)) {
    throw invalidInput(`${label} is required`);
  }
  if (input[key] === null) {
    return null;
  }
  return requireString(input, key, label);
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

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message);
}

function assertUpsertHasSource(file: JsTemplateTreeEntryInput, label: string): void {
  if (typeof file.content !== 'string' && !file.blobHash) {
    throw invalidInput(`${label} must include content or blobHash`);
  }
}
