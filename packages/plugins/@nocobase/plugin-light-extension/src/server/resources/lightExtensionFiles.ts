/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isVscError } from '@nocobase/plugin-vsc-file';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionFileChange } from '../../shared/types';
import type {
  LightExtensionGetFileInput,
  LightExtensionListCommitsInput,
  LightExtensionPullCommitInput,
  LightExtensionPullInput,
} from '../services/LightExtensionFileService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { toLightExtensionSourceError } from '../services/errorContract';
import { createTypedResourceAction, getServiceContext, toRecord, type ResourceActionInput } from './resourceAction';

export const lightExtensionFileActionNames = [
  'pull',
  'pullCommit',
  'getFile',
  'readArchivedSource',
  'saveSource',
  'listCommits',
] as const;

type LightExtensionFileActionName = (typeof lightExtensionFileActionNames)[number];

type ResourceActionRunner = (
  services: LightExtensionFileActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

interface LightExtensionFileActionServices {
  fileService: LightExtensionFileService;
  runtimeCompileService: LightExtensionRuntimeCompileService;
}

const resourceActionRunners: Record<LightExtensionFileActionName, ResourceActionRunner> = {
  pull: (services, input, currentUser) => services.fileService.pull(normalizePullInput(input), currentUser),
  pullCommit: (services, input, currentUser) =>
    services.fileService.pullCommit(normalizePullCommitInput(input), currentUser),
  getFile: (services, input, currentUser) => services.fileService.getFile(normalizeGetFileInput(input), currentUser),
  readArchivedSource: (services, input, currentUser) =>
    services.fileService.readArchivedSource(normalizeGetFileInput(input), currentUser),
  saveSource: (services, input, currentUser) =>
    services.runtimeCompileService.saveSource(
      {
        repoId: requireRepoId(input),
        message: requireString(input, 'message'),
        files: requireArray(input, 'files', normalizeFileChange),
      },
      currentUser,
    ),
  listCommits: (services, input, currentUser) =>
    services.fileService.listCommits(normalizeListCommitsInput(input), currentUser),
};

export function createLightExtensionFilesResource(
  fileService: LightExtensionFileService,
  runtimeCompileService: LightExtensionRuntimeCompileService,
): ResourceOptions {
  const services = {
    fileService,
    runtimeCompileService,
  };

  return {
    name: 'lightExtensionFiles',
    only: [...lightExtensionFileActionNames],
    actions: Object.fromEntries(
      lightExtensionFileActionNames.map((actionName) => [
        actionName,
        createLightExtensionFileAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionFileActionName, HandlerType>,
  };
}

function createLightExtensionFileAction(
  services: LightExtensionFileActionServices,
  run: ResourceActionRunner,
): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext,
    transformError: (error, input) =>
      isVscError(error) ? toLightExtensionSourceError(error, getOptionalRepoId(input)) : error,
  });
}

function normalizePullInput(input: ResourceActionInput): LightExtensionPullInput {
  return compactObject({
    repoId: requireRepoId(input),
    ref: optionalVscRef(input, 'ref'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizePullCommitInput(input: ResourceActionInput): LightExtensionPullCommitInput {
  return compactObject({
    repoId: requireRepoId(input),
    commitId: requireString(input, 'commitId'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizeGetFileInput(input: ResourceActionInput): LightExtensionGetFileInput {
  return compactObject({
    repoId: requireRepoId(input),
    ref: optionalVscRef(input, 'ref'),
    path: requireString(input, 'path'),
  });
}

function normalizeListCommitsInput(input: ResourceActionInput): LightExtensionListCommitsInput {
  return compactObject({
    repoId: requireRepoId(input),
    limit: optionalPositiveInteger(input, 'limit'),
    beforeSeq: optionalPositiveInteger(input, 'beforeSeq'),
  });
}

function normalizeFileChange(value: unknown, label: string): LightExtensionFileChange {
  const record = requireRecord(value, label);
  const operation = optionalFileOperation(record, 'operation', label);
  const normalized = compactObject({
    path: requireString(record, 'path', label),
    content: optionalString(record, 'content', label),
    blobHash: optionalString(record, 'blobHash', label),
    size: optionalNumber(record, 'size', label),
    language: optionalString(record, 'language', label),
    mode: optionalString(record, 'mode', label),
    operation,
  });

  assertFileChangeSource(normalized, label);

  return normalized;
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

function optionalPositiveInteger(input: ResourceActionInput, key: string, label = key): number | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw invalidInput(`${label} must be a positive integer`);
  }

  return value;
}

function optionalVscRef(input: ResourceActionInput, key: string, label = key): LightExtensionPullInput['ref'] {
  const value = optionalString(input, key, label);
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value !== 'head') {
    throw invalidInput(`${label} must be head`);
  }

  return value;
}

function optionalFileOperation(
  input: ResourceActionInput,
  key: string,
  label: string,
): LightExtensionFileChange['operation'] {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throw invalidInput(`${label}.${key} must be upsert or delete`);
}

function optionalIncludeContent(input: ResourceActionInput): LightExtensionPullInput['includeContent'] {
  const value = input.includeContent;
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === 'none' || value === 'selected' || value === 'all') {
    return value;
  }

  throw invalidInput('includeContent must be none, selected, or all');
}

function optionalStringArray(input: ResourceActionInput, key: string, label = key): string[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw invalidInput(`${label} must be an array of strings`);
  }

  return value;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] {
  const value = input[key];
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

function assertFileChangeSource(file: LightExtensionFileChange, label: string): void {
  if (file.operation === 'delete') {
    if (typeof file.content !== 'undefined' || typeof file.blobHash !== 'undefined') {
      throw invalidInput(`${label} delete operation must not include content or blobHash`);
    }

    return;
  }

  if (typeof file.content !== 'string' && !file.blobHash) {
    throw invalidInput(`${label} must include content or blobHash for upsert`);
  }
}
