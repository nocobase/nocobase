/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeRunJSSourceLocator, type RunJSSourcePermissionResult } from '@nocobase/plugin-vsc-file';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { LIGHT_EXTENSION_SUPPORTED_KINDS, type LightExtensionKind } from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionMoveSourceInput, LightExtensionWorkspacePreviewInput } from '../../shared/types';
import {
  type LightExtensionCompilePreviewInput,
  LightExtensionCompilePreviewService,
} from '../services/LightExtensionCompilePreviewService';
import { MoveSourceService, type MoveSourceServiceContext } from '../services/MoveSourceService';
import {
  createTypedResourceAction,
  getRequestMetadata,
  toRecord,
  type LightExtensionResourceContext,
  type ResourceActionInput,
} from './resourceAction';

export const lightExtensionActionNames = ['compilePreview', 'compileWorkspacePreview', 'moveSource'] as const;

type LightExtensionActionName = (typeof lightExtensionActionNames)[number];
type ResourceActionRunner = (
  service: LightExtensionActionServices,
  input: ResourceActionInput,
  currentUser: MoveSourceServiceContext,
) => Promise<unknown>;

interface LightExtensionActionServices {
  compilePreviewService: LightExtensionCompilePreviewService;
  moveSourceService?: MoveSourceService;
}

const resourceActionRunners: Record<LightExtensionActionName, ResourceActionRunner> = {
  compilePreview: (services, input, currentUser) =>
    services.compilePreviewService.compilePreview(normalizeCompilePreviewInput(input), currentUser),
  compileWorkspacePreview: (services, input, currentUser) =>
    services.compilePreviewService.compileWorkspacePreview(normalizeWorkspacePreviewInput(input), currentUser),
  moveSource: (services, input, currentUser) => {
    if (!services.moveSourceService) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Move source service is unavailable');
    }
    return services.moveSourceService.moveSource(normalizeMoveSourceInput(input), currentUser);
  },
};

export function createLightExtensionsResource(
  compilePreviewService: LightExtensionCompilePreviewService,
  moveSourceService?: MoveSourceService,
): ResourceOptions {
  const services = {
    compilePreviewService,
    moveSourceService,
  };

  return {
    name: 'lightExtensions',
    only: [...lightExtensionActionNames],
    actions: Object.fromEntries(
      lightExtensionActionNames.map((actionName) => [
        actionName,
        createLightExtensionAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionActionName, HandlerType>,
  };
}

function createLightExtensionAction(services: LightExtensionActionServices, run: ResourceActionRunner): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext: getMoveSourceServiceContext,
    getHttpStatus: readHttpStatus,
  });
}

function normalizeCompilePreviewInput(input: ResourceActionInput): LightExtensionCompilePreviewInput {
  return {
    repoId: requireRepoId(input),
    entryIds: optionalStringArray(input, 'entryIds'),
  };
}

function normalizeWorkspacePreviewInput(input: ResourceActionInput): LightExtensionWorkspacePreviewInput {
  return {
    repoId: requireRepoId(input),
    entryId: optionalNullableString(input, 'entryId'),
    kind: requireLightExtensionKind(input, 'kind'),
    entryPath: requireString(input, 'entryPath'),
    runtimeVersion: optionalString(input, 'runtimeVersion', 'runtimeVersion'),
    files: requireArray(input, 'files', normalizeWorkspacePreviewFile),
  };
}

function normalizeMoveSourceInput(input: ResourceActionInput): LightExtensionMoveSourceInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    expectedOwnerFingerprint: requireString(input, 'expectedOwnerFingerprint'),
    sourceRepoId: requireString(input, 'sourceRepoId'),
    sourceHeadCommitId: optionalNullableString(input, 'sourceHeadCommitId') ?? null,
    entryPath: requireString(input, 'entryPath'),
    version: requireString(input, 'version'),
    files: requireArray(input, 'files', normalizeMoveSourceFile),
    destination: normalizeMoveSourceDestination(input.destination),
    entryName: requireString(input, 'entryName'),
    entryTitle: optionalNullableString(input, 'entryTitle'),
  };
}

function getMoveSourceServiceContext(ctx: LightExtensionResourceContext): MoveSourceServiceContext {
  const metadata = getRequestMetadata(ctx);

  const serviceContext: MoveSourceServiceContext = {
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

function requireRepoId(input: ResourceActionInput): string {
  return requireString(
    {
      repoId: input.repoId || input.filterByTk,
    },
    'repoId',
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

function normalizeMoveSourceFile(value: unknown, index: number): LightExtensionMoveSourceInput['files'][number] {
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
): LightExtensionWorkspacePreviewInput['files'][number] {
  const file = toRecord(value);
  return {
    path: requireString(file, 'path', `files[${index}].path`),
    content: requireStringValue(file, 'content', `files[${index}].content`),
    language: optionalString(file, 'language', `files[${index}].language`),
    mode: optionalString(file, 'mode', `files[${index}].mode`),
  };
}

function requireLightExtensionKind(input: ResourceActionInput, key: string): LightExtensionKind {
  const value = requireString(input, key);
  if (!(LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(value)) {
    throw invalidInput(`${key} must be a supported light extension kind`);
  }
  return value as LightExtensionKind;
}

function normalizeMoveSourceDestination(value: unknown): LightExtensionMoveSourceInput['destination'] {
  const destination = toRecord(value);
  const type = requireString(destination, 'type', 'destination.type');
  if (type === 'existing') {
    return {
      type,
      repoId: requireString(destination, 'repoId', 'destination.repoId'),
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

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
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
