/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isVscError } from '@nocobase/runjs-workspace/server';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateFileChange } from '../../shared/types';
import type {
  JsTemplateDiffCommitsInput,
  JsTemplateGetFileInput,
  JsTemplateListCommitsInput,
  JsTemplatePullCommitInput,
  JsTemplatePullInput,
} from '../services/JsTemplateFileService';
import { JsTemplateFileService } from '../services/JsTemplateFileService';
import type { JsTemplateServiceContext } from '../services/JsTemplateProjectService';
import { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { isStrictUtf8Text } from '../services/JsTemplateSourceArchive';
import { toJsTemplateSourceError } from '../services/errorContract';
import { createTypedResourceAction, getServiceContext, toRecord, type ResourceActionInput } from './resourceAction';

export const jsTemplateFileActionNames = [
  'pull',
  'pullCommit',
  'getFile',
  'readArchivedSource',
  'saveSource',
  'listCommits',
  'diff',
] as const;

type JsTemplateFileActionName = (typeof jsTemplateFileActionNames)[number];

type ResourceActionRunner = (
  services: JsTemplateFileActionServices,
  input: ResourceActionInput,
  currentUser: JsTemplateServiceContext,
) => Promise<unknown>;

interface JsTemplateFileActionServices {
  fileService: JsTemplateFileService;
  runtimeCompileService: JsTemplateCompileService;
}

const resourceActionRunners: Record<JsTemplateFileActionName, ResourceActionRunner> = {
  pull: (services, input, currentUser) => services.fileService.pull(normalizePullInput(input), currentUser),
  pullCommit: (services, input, currentUser) =>
    services.fileService.pullCommit(normalizePullCommitInput(input), currentUser),
  getFile: (services, input, currentUser) => services.fileService.getFile(normalizeGetFileInput(input), currentUser),
  readArchivedSource: (services, input, currentUser) =>
    services.fileService.readArchivedSource(normalizeGetFileInput(input), currentUser),
  saveSource: (services, input, currentUser) => saveSource(services, input, currentUser),
  listCommits: (services, input, currentUser) =>
    services.fileService.listCommits(normalizeListCommitsInput(input), currentUser),
  diff: (services, input, currentUser) =>
    services.fileService.diffCommits(normalizeDiffCommitsInput(input), currentUser),
};

export function createJsTemplateFilesResource(
  fileService: JsTemplateFileService,
  runtimeCompileService: JsTemplateCompileService,
): ResourceOptions {
  const services = {
    fileService,
    runtimeCompileService,
  };

  return {
    name: 'jsTemplateFiles',
    only: [...jsTemplateFileActionNames],
    actions: Object.fromEntries(
      jsTemplateFileActionNames.map((actionName) => [
        actionName,
        createJsTemplateFileAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<JsTemplateFileActionName, HandlerType>,
  };
}

function createJsTemplateFileAction(services: JsTemplateFileActionServices, run: ResourceActionRunner): HandlerType {
  return createTypedResourceAction({
    services,
    run,
    getServiceContext,
    transformError: (error, input) =>
      isVscError(error) ? toJsTemplateSourceError(error, getOptionalProjectId(input)) : error,
  });
}

function normalizePullInput(input: ResourceActionInput): JsTemplatePullInput {
  return compactObject({
    projectId: requireProjectId(input),
    ref: optionalVscRef(input, 'ref'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizePullCommitInput(input: ResourceActionInput): JsTemplatePullCommitInput {
  return compactObject({
    projectId: requireProjectId(input),
    commitId: requireString(input, 'commitId'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizeGetFileInput(input: ResourceActionInput): JsTemplateGetFileInput {
  return compactObject({
    projectId: requireProjectId(input),
    ref: optionalVscRef(input, 'ref'),
    path: requireString(input, 'path'),
  });
}

function normalizeListCommitsInput(input: ResourceActionInput): JsTemplateListCommitsInput {
  return compactObject({
    projectId: requireProjectId(input),
    limit: optionalPositiveInteger(input, 'limit'),
    beforeSeq: optionalPositiveInteger(input, 'beforeSeq'),
  });
}

function normalizeDiffCommitsInput(input: ResourceActionInput): JsTemplateDiffCommitsInput {
  return {
    projectId: requireProjectId(input),
    fromCommitId: requireString(input, 'fromCommitId'),
    toCommitId: requireString(input, 'toCommitId'),
  };
}

function normalizeFileChange(value: unknown, label: string): JsTemplateFileChange {
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

async function saveSource(
  services: JsTemplateFileActionServices,
  input: ResourceActionInput,
  currentUser: JsTemplateServiceContext,
) {
  const projectId = requireProjectId(input);
  const expectedHeadCommitId = requireNullableString(input, 'expectedHeadCommitId');
  const files = requireArray(input, 'files', normalizeFileChange);
  for (const file of files) {
    if (typeof file.content === 'string' && !isStrictUtf8Text(file.content)) {
      throw invalidInput(`Source file must be UTF-8 text without NUL bytes: ${file.path}`);
    }
  }
  return services.runtimeCompileService.saveSource(
    {
      projectId,
      expectedHeadCommitId,
      message: requireString(input, 'message'),
      files,
    },
    currentUser,
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

function requireNullableString(input: ResourceActionInput, key: string, label = key): string | null {
  if (!Object.prototype.hasOwnProperty.call(input, key)) {
    throw invalidInput(`${label} is required`);
  }
  const value = input[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} must be a string or null`);
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

function optionalVscRef(input: ResourceActionInput, key: string, label = key): JsTemplatePullInput['ref'] {
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
): JsTemplateFileChange['operation'] {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throw invalidInput(`${label}.${key} must be upsert or delete`);
}

function optionalIncludeContent(input: ResourceActionInput): JsTemplatePullInput['includeContent'] {
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

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message);
}

function assertFileChangeSource(file: JsTemplateFileChange, label: string): void {
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
