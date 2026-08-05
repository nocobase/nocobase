/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeRunJSSourceLocator, type RunJSSourcePermissionResult } from '../vsc-file/public-api';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { JS_TEMPLATE_SUPPORTED_KINDS, type JsTemplateKind } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import { JS_TEMPLATE_SOURCE_BINDING_TYPE } from '../../shared/jsTemplateRunJSPersistence';
import type {
  SaveAsJsTemplateInput,
  DetachJsTemplateToInlineInput,
  JsTemplateWorkspacePreviewInput,
} from '../../shared/types';
import {
  type JsTemplateCompilePreviewInput,
  JsTemplateCompilePreviewService,
} from '../services/JsTemplateCompilePreviewService';
import { JsTemplateService } from '../services/JsTemplateService';
import type { JsTemplateServiceContext } from '../services/JsTemplateProjectService';
import { JsTemplateRuntimeService } from '../services/JsTemplateRuntimeService';
import { SaveAsJsTemplateService, type SaveAsJsTemplateServiceContext } from '../services/SaveAsJsTemplateService';
import { DetachJsTemplateToInlineService } from '../services/DetachJsTemplateToInlineService';
import {
  createTypedResourceAction,
  getServiceContext,
  getRequestMetadata,
  toRecord,
  type JsTemplateResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const jsTemplateActionNames = [
  'list',
  'listCatalog',
  'get',
  'listSelectable',
  'compilePreview',
  'compileWorkspacePreview',
  'saveAsJsTemplate',
  'detachToInline',
] as const;

type JsTemplateActionName = (typeof jsTemplateActionNames)[number];
type ResourceActionRunner = (
  service: JsTemplateActionServices,
  input: ResourceActionInput,
  currentUser: SaveAsJsTemplateServiceContext & JsTemplateServiceContext,
) => Promise<unknown>;

interface JsTemplateActionServices {
  templateService: JsTemplateService;
  runtimeService: JsTemplateRuntimeService;
  compilePreviewService: JsTemplateCompilePreviewService;
  saveAsJsTemplateService?: SaveAsJsTemplateService;
  detachToInlineService?: DetachJsTemplateToInlineService;
}

const resourceActionRunners: Record<JsTemplateActionName, ResourceActionRunner> = {
  list: (services, input, currentUser) => services.templateService.listTemplates(requireProjectId(input), currentUser),
  listCatalog: (services, _input, currentUser) => services.templateService.listCatalog(currentUser),
  get: (services, input, currentUser) => services.templateService.getTemplate(requireTemplateId(input), currentUser),
  listSelectable: (services, input, currentUser) =>
    services.runtimeService.listSelectableTemplates(
      {
        projectId: optionalString(input, 'projectId', 'projectId'),
        kind: optionalString(input, 'kind', 'kind'),
      },
      currentUser,
    ),
  compilePreview: (services, input, currentUser) =>
    services.compilePreviewService.compilePreview(normalizeCompilePreviewInput(input), currentUser),
  compileWorkspacePreview: (services, input, currentUser) =>
    services.compilePreviewService.compileWorkspacePreview(normalizeWorkspacePreviewInput(input), currentUser),
  saveAsJsTemplate: (services, input, currentUser) => {
    if (!services.saveAsJsTemplateService) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'Move source service is unavailable');
    }
    return services.saveAsJsTemplateService.saveAsJsTemplate(normalizeSaveAsJsTemplateInput(input), currentUser);
  },
  detachToInline: (services, input, currentUser) => {
    if (!services.detachToInlineService) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'Move to inline service is unavailable');
    }
    return services.detachToInlineService.detachToInline(normalizeDetachJsTemplateToInlineInput(input), currentUser);
  },
};

export function createJsTemplatesResource(
  templateService: JsTemplateService,
  runtimeService: JsTemplateRuntimeService,
  compilePreviewService: JsTemplateCompilePreviewService,
  saveAsJsTemplateService?: SaveAsJsTemplateService,
  detachToInlineService?: DetachJsTemplateToInlineService,
): ResourceOptions {
  const services = {
    templateService,
    runtimeService,
    compilePreviewService,
    saveAsJsTemplateService,
    detachToInlineService,
  };

  return {
    name: 'jsTemplates',
    only: [...jsTemplateActionNames],
    actions: Object.fromEntries(
      jsTemplateActionNames.map((actionName) => [
        actionName,
        createJsTemplateAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<JsTemplateActionName, HandlerType>,
  };
}

function createJsTemplateAction(services: JsTemplateActionServices, run: ResourceActionRunner): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext: getSaveAsJsTemplateServiceContext,
    getHttpStatus: readHttpStatus,
  });
}

function normalizeCompilePreviewInput(input: ResourceActionInput): JsTemplateCompilePreviewInput {
  return {
    projectId: requireProjectId(input),
    templateIds: optionalStringArray(input, 'templateIds'),
  };
}

function normalizeWorkspacePreviewInput(input: ResourceActionInput): JsTemplateWorkspacePreviewInput {
  return compactObject({
    projectId: requireProjectId(input),
    expectedHeadCommitId: optionalNullableString(input, 'expectedHeadCommitId'),
    templateId: optionalNullableString(input, 'templateId'),
    kind: optionalJsTemplateKind(input, 'kind'),
    entryPath: optionalString(input, 'entryPath', 'entryPath'),
    runtimeVersion: optionalString(input, 'runtimeVersion', 'runtimeVersion'),
    files: requireArray(input, 'files', normalizeWorkspacePreviewFile),
  });
}

function normalizeSaveAsJsTemplateInput(input: ResourceActionInput): SaveAsJsTemplateInput {
  return {
    idempotencyKey: optionalIdempotencyKey(input),
    locator: normalizeRunJSSourceLocator(input.locator),
    expectedOwnerFingerprint: requireString(input, 'expectedOwnerFingerprint'),
    sourceRepoId: requireString(input, 'sourceRepoId'),
    sourceHeadCommitId: optionalNullableString(input, 'sourceHeadCommitId') ?? null,
    entryPath: requireString(input, 'entryPath'),
    version: requireString(input, 'version'),
    files: requireArray(input, 'files', normalizeSaveAsJsTemplateFile),
    originBinding: normalizeSaveAsJsTemplateOriginBinding(input.originBinding),
    destination: normalizeSaveAsJsTemplateDestination(input.destination),
    templateName: requireString(input, 'templateName'),
    templateTitle: optionalNullableString(input, 'templateTitle'),
  };
}

function optionalIdempotencyKey(input: ResourceActionInput): string | undefined {
  const value = input.idempotencyKey;
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput('idempotencyKey must be a non-empty string');
  }
  const idempotencyKey = value.trim();
  if (idempotencyKey.length > 255) {
    throw invalidInput('idempotencyKey must be at most 255 characters');
  }
  return idempotencyKey;
}

function normalizeSaveAsJsTemplateOriginBinding(value: unknown): SaveAsJsTemplateInput['originBinding'] | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  const binding = toRecord(value);
  if (binding.type !== JS_TEMPLATE_SOURCE_BINDING_TYPE) {
    throw invalidInput('originBinding.type must be "js-template-entry"');
  }
  return {
    type: JS_TEMPLATE_SOURCE_BINDING_TYPE,
    projectId: requireString(binding, 'projectId', 'originBinding.projectId'),
    templateId: requireString(binding, 'templateId', 'originBinding.templateId'),
    kind: requireJsTemplateKind(binding, 'kind'),
  };
}

function normalizeDetachJsTemplateToInlineInput(input: ResourceActionInput): DetachJsTemplateToInlineInput {
  return {
    idempotencyKey: requireIdempotencyKey(input),
    locator: normalizeRunJSSourceLocator(input.locator),
    projectId: requireProjectId(input),
    templateId: requireString(input, 'templateId'),
    entryPath: requireString(input, 'entryPath'),
    kind: requireJsTemplateKind(input, 'kind'),
    version: requireString(input, 'version'),
    files: requireArray(input, 'files', normalizeSaveAsJsTemplateFile),
  };
}

function requireIdempotencyKey(input: ResourceActionInput): string {
  const idempotencyKey = optionalIdempotencyKey(input);
  if (!idempotencyKey) {
    throw invalidInput('idempotencyKey must be a non-empty string');
  }
  return idempotencyKey;
}

function getSaveAsJsTemplateServiceContext(ctx: JsTemplateResourceContext): SaveAsJsTemplateServiceContext {
  const metadata = getRequestMetadata(ctx);

  const serviceContext: SaveAsJsTemplateServiceContext = {
    ...getServiceContext(ctx),
    actorUserId: metadata.actorUserId,
    requestId: metadata.requestId,
    requestSource: metadata.requestSource,
    can: ctx.can,
    adapterContext: {
      userId: metadata.actorUserId,
      request: {
        requestId: metadata.requestId,
        requestSource: metadata.requestSource,
      },
      state: ctx.state,
      currentUser: ctx.auth?.user,
      timezone: ctx.timezone,
      can: (input) => normalizeAdapterPermission(ctx.can?.(input)),
    },
  };
  return serviceContext;
}

function requireTemplateId(input: ResourceActionInput): string {
  return requireString(
    {
      templateId: input.templateId || input.filterByTk,
    },
    'templateId',
  );
}

function requireProjectId(input: ResourceActionInput): string {
  return requireString(
    {
      projectId: input.projectId || input.filterByTk,
    },
    'projectId',
  );
}

function requireString(input: ResourceActionInput, key: string, label = key): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required`);
  }

  return value.trim();
}

function optionalNullableString(input: ResourceActionInput, key: string): string | null | undefined {
  const value = input[key];
  if (value === null) {
    return null;
  }
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${key} must be a string or null`);
  }
  return value.trim() || null;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, index: number) => T,
): T[] {
  const value = input[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw invalidInput(`${key} must be a non-empty array`);
  }
  return value.map(normalize);
}

function normalizeSaveAsJsTemplateFile(value: unknown, index: number): SaveAsJsTemplateInput['files'][number] {
  const file = toRecord(value);
  return {
    path: requireString(file, 'path', `files[${index}].path`),
    content: requireStringValue(file, 'content', `files[${index}].content`),
    language: optionalString(file, 'language', `files[${index}].language`),
    mode: optionalString(file, 'mode', `files[${index}].mode`),
  };
}

function normalizeWorkspacePreviewFile(
  value: unknown,
  index: number,
): JsTemplateWorkspacePreviewInput['files'][number] {
  const file = toRecord(value);
  return {
    path: requireString(file, 'path', `files[${index}].path`),
    content: requireStringValue(file, 'content', `files[${index}].content`),
    language: optionalString(file, 'language', `files[${index}].language`),
    mode: optionalString(file, 'mode', `files[${index}].mode`),
  };
}

function requireJsTemplateKind(input: ResourceActionInput, key: string): JsTemplateKind {
  const value = requireString(input, key);
  if (!(JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(value)) {
    throw invalidInput(`${key} must be a supported JS Template kind`);
  }
  return value as JsTemplateKind;
}

function optionalJsTemplateKind(input: ResourceActionInput, key: string): JsTemplateKind | undefined {
  if (typeof input[key] === 'undefined') {
    return undefined;
  }
  return requireJsTemplateKind(input, key);
}

function normalizeSaveAsJsTemplateDestination(value: unknown): SaveAsJsTemplateInput['destination'] {
  const destination = toRecord(value);
  const type = requireString(destination, 'type', 'destination.type');
  if (type === 'existing') {
    return {
      type,
      projectId: requireString(destination, 'projectId', 'destination.projectId'),
    };
  }
  if (type === 'new') {
    return {
      type,
      name: requireString(destination, 'name', 'destination.name'),
      title: optionalNullableString(destination, 'title'),
      description: optionalNullableString(destination, 'description'),
    };
  }
  throw invalidInput('destination.type must be "existing" or "new"');
}

function requireStringValue(input: ResourceActionInput, key: string, label: string): string {
  const value = input[key];
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string`);
  }
  return value;
}

function optionalString(input: ResourceActionInput, key: string, label: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string`);
  }
  return value;
}

function optionalBoolean(input: ResourceActionInput, key: string): boolean | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw invalidInput(`${key} must be a boolean`);
  }
  return value;
}

function optionalStringArray(input: ResourceActionInput, key: string): string[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw invalidInput(`${key} must be an array of strings`);
  }

  return value.map((item) => item.trim());
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined')) as T;
}

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message);
}

function normalizeAdapterPermission(value: unknown): RunJSSourcePermissionResult | null {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof (value as PromiseLike<unknown>).then === 'function'
  ) {
    return null;
  }
  const permission = value as { params?: unknown };
  if (!permission.params || typeof permission.params !== 'object' || Array.isArray(permission.params)) {
    return {};
  }
  return { params: permission.params as RunJSSourcePermissionResult['params'] };
}

function readHttpStatus(value: unknown): 200 | 207 | 422 | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const status = (value as { httpStatus?: unknown }).httpStatus;
  return status === 200 || status === 207 || status === 422 ? status : undefined;
}
