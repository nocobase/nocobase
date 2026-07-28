/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CodeAuthoringChange,
  CodeAuthoringFile,
  CodeAuthoringSearchMatch,
  CodeAuthoringSurface,
} from '@nocobase/client-v2';

import type { FrontendToolInvokeResult, FrontendToolManifest } from '../../../common/frontend-tools';
import { WORKSPACE_AUTHORING_TOOL_NAMES, type WorkspaceAuthoringToolName } from '../../../common/workspace-authoring';

export { WORKSPACE_AUTHORING_TOOL_NAMES } from '../../../common/workspace-authoring';
export type { WorkspaceAuthoringToolName } from '../../../common/workspace-authoring';

type WorkspaceAuthoringApplication = {
  aiManager: {
    authoringSurfaces: {
      get: (surfaceId: string) => CodeAuthoringSurface | undefined;
    };
  };
};

const MAX_PATHS = 20;
const MAX_PATH_LENGTH = 512;
const MAX_QUERY_LENGTH = 512;
const MAX_SEARCH_RESULTS = 50;
const MAX_SEARCH_CONTEXT_LENGTH = 400;
const MAX_FILE_CONTENT_LENGTH = 100_000;
const MAX_TOTAL_READ_CONTENT_LENGTH = 200_000;
const MAX_SEARCH_PREVIEW_LENGTH = 1_000;

const noArgsSchema = { type: 'object', properties: {}, additionalProperties: false };
const pathArraySchema = {
  type: 'array',
  items: { type: 'string', minLength: 1, maxLength: MAX_PATH_LENGTH },
  minItems: 1,
  maxItems: MAX_PATHS,
  uniqueItems: true,
};
const changeSchema = {
  oneOf: [
    {
      type: 'object',
      required: ['type', 'path', 'content'],
      properties: {
        type: { const: 'create' },
        path: { type: 'string', minLength: 1, maxLength: MAX_PATH_LENGTH },
        content: { type: 'string' },
        language: { type: 'string' },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: ['type', 'path', 'baseHash', 'content'],
      properties: {
        type: { const: 'update' },
        path: { type: 'string', minLength: 1, maxLength: MAX_PATH_LENGTH },
        baseHash: { type: 'string', minLength: 1 },
        content: { type: 'string' },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: ['type', 'path', 'baseHash'],
      properties: {
        type: { const: 'delete' },
        path: { type: 'string', minLength: 1, maxLength: MAX_PATH_LENGTH },
        baseHash: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
  ],
};

const definitions: Array<Omit<FrontendToolManifest, 'id' | 'blockUid'>> = [
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.describe,
    title: 'Describe workspace',
    description:
      'Inspect the current code workspace, file list, cached editor diagnostics, and snapshot id. Start here. This tool does not validate the draft and must not be used to claim that compilation passed.',
    permission: 'ALLOW',
    inputSchema: noArgsSchema,
  },
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.readFiles,
    title: 'Read workspace files',
    description: 'Read selected source or virtual files from the current workspace.',
    permission: 'ALLOW',
    inputSchema: {
      type: 'object',
      required: ['paths'],
      properties: { paths: pathArraySchema },
      additionalProperties: false,
    },
  },
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.search,
    title: 'Search workspace',
    description: 'Search readable files in the current workspace.',
    permission: 'ALLOW',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', minLength: 1, maxLength: MAX_QUERY_LENGTH },
        paths: pathArraySchema,
        limit: { type: 'integer', minimum: 1, maximum: MAX_SEARCH_RESULTS },
        contextLength: { type: 'integer', minimum: 1, maximum: MAX_SEARCH_CONTEXT_LENGTH },
      },
      additionalProperties: false,
    },
  },
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.prepareChanges,
    title: 'Prepare workspace changes',
    description: 'Prepare an atomic multi-file create, update, or delete plan without changing the draft.',
    permission: 'ALLOW',
    inputSchema: {
      type: 'object',
      required: ['baseSnapshotId', 'changes'],
      properties: {
        baseSnapshotId: { type: 'string', minLength: 1 },
        changes: { type: 'array', items: changeSchema, minItems: 1, maxItems: MAX_PATHS },
      },
      additionalProperties: false,
    },
  },
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges,
    title: 'Apply prepared workspace changes',
    description: 'Apply the latest prepared plan to the local draft without saving it.',
    permission: 'ASK',
    inputSchema: {
      type: 'object',
      required: ['planId'],
      properties: { planId: { type: 'string', minLength: 1 } },
      additionalProperties: false,
    },
  },
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.validateDraft,
    title: 'Validate workspace draft',
    description:
      'Run authoritative TypeScript and workspace validation on the complete current draft without executing or saving it. Only claim compilation success when this tool returns validationPassed: true. TypeScript suppression directives such as @ts-nocheck, @ts-ignore, and @ts-expect-error are forbidden; fix the underlying error. Use when the user reports editor errors and after applying fixes.',
    permission: 'ALLOW',
    inputSchema: noArgsSchema,
  },
];

export function getWorkspaceAuthoringToolManifests(surfaceId: string): FrontendToolManifest[] {
  return definitions.map((definition) => ({
    ...definition,
    id: `${surfaceId}:${definition.name}`,
    blockUid: surfaceId,
  }));
}

export function parseWorkspaceAuthoringToolId(
  toolId: string,
): { surfaceId: string; toolName: WorkspaceAuthoringToolName } | undefined {
  for (const toolName of Object.values(WORKSPACE_AUTHORING_TOOL_NAMES)) {
    const suffix = `:${toolName}`;
    if (toolId.endsWith(suffix)) {
      const surfaceId = toolId.slice(0, -suffix.length);
      return surfaceId ? { surfaceId, toolName } : undefined;
    }
  }
  return undefined;
}

export async function executeWorkspaceAuthoringTool(
  app: WorkspaceAuthoringApplication,
  toolId: string,
  args: unknown,
): Promise<FrontendToolInvokeResult | undefined> {
  const parsed = parseWorkspaceAuthoringToolId(toolId);
  if (!parsed) {
    return undefined;
  }
  const surface = app.aiManager.authoringSurfaces.get(parsed.surfaceId);
  if (!surface) {
    return toolError(parsed.surfaceId, parsed.toolName, 'WORKSPACE_SURFACE_UNAVAILABLE', 'Workspace is unavailable.');
  }

  try {
    const content = await invokeWorkspaceTool(surface, parsed.toolName, args);
    if (
      parsed.toolName !== WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges &&
      app.aiManager.authoringSurfaces.get(parsed.surfaceId) !== surface
    ) {
      return toolError(parsed.surfaceId, parsed.toolName, 'WORKSPACE_SURFACE_UNAVAILABLE', 'Workspace is unavailable.');
    }
    return { status: 'success', content };
  } catch (error) {
    return toolError(
      parsed.surfaceId,
      parsed.toolName,
      getErrorCode(error),
      error instanceof Error ? error.message : 'Workspace tool execution failed.',
      getErrorDetails(error),
    );
  }
}

async function invokeWorkspaceTool(surface: CodeAuthoringSurface, toolName: WorkspaceAuthoringToolName, args: unknown) {
  switch (toolName) {
    case WORKSPACE_AUTHORING_TOOL_NAMES.describe: {
      const snapshot = await surface.getSnapshot();
      const { diagnostics, ...workspace } = snapshot;
      return {
        ...workspace,
        cachedDiagnostics: diagnostics,
        validationPassed: null,
        validationRequired: true,
      };
    }
    case WORKSPACE_AUTHORING_TOOL_NAMES.readFiles:
      return limitReadFiles(surface.id, await surface.read(requirePaths(args)));
    case WORKSPACE_AUTHORING_TOOL_NAMES.search:
      return limitSearchMatches(surface.id, await surface.search(requireSearchOptions(args)));
    case WORKSPACE_AUTHORING_TOOL_NAMES.prepareChanges:
      return surface.prepareChanges(requirePrepareInput(args));
    case WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges:
      return surface.applyPreparedChanges(requireStringProperty(args, 'planId'));
    case WORKSPACE_AUTHORING_TOOL_NAMES.validateDraft:
      return surface.validateDraft();
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Workspace tool arguments must be an object.');
  }
  return value as Record<string, unknown>;
}

function requireStringProperty(value: unknown, key: string): string {
  const result = requireRecord(value)[key];
  if (typeof result !== 'string' || !result.trim()) {
    throw new Error(`Workspace tool argument is required: ${key}`);
  }
  return result;
}

function requirePaths(value: unknown): string[] {
  const paths = requireRecord(value).paths;
  if (!Array.isArray(paths) || !paths.length || paths.length > MAX_PATHS) {
    throw new Error(`Workspace file paths must contain between 1 and ${MAX_PATHS} items.`);
  }
  const normalized = paths.map((path) => {
    if (typeof path !== 'string' || !path.trim() || path.length > MAX_PATH_LENGTH) {
      throw new Error('Workspace file path is invalid.');
    }
    return path;
  });
  if (new Set(normalized).size !== normalized.length) {
    throw new Error('Workspace file paths must be unique.');
  }
  return normalized;
}

function requireSearchOptions(value: unknown): Parameters<CodeAuthoringSurface['search']>[0] {
  const input = requireRecord(value);
  if (typeof input.query !== 'string' || !input.query || input.query.length > MAX_QUERY_LENGTH) {
    throw new Error('Workspace search query is invalid.');
  }
  return {
    query: input.query,
    ...(input.paths === undefined ? {} : { paths: requirePaths({ paths: input.paths }) }),
    ...(input.limit === undefined ? {} : { limit: requireInteger(input.limit, 1, MAX_SEARCH_RESULTS, 'limit') }),
    ...(input.contextLength === undefined
      ? {}
      : { contextLength: requireInteger(input.contextLength, 1, MAX_SEARCH_CONTEXT_LENGTH, 'contextLength') }),
  };
}

function requirePrepareInput(value: unknown): Parameters<CodeAuthoringSurface['prepareChanges']>[0] {
  const input = requireRecord(value);
  if (!Array.isArray(input.changes) || !input.changes.length || input.changes.length > MAX_PATHS) {
    throw new Error(`Workspace changes must contain between 1 and ${MAX_PATHS} items.`);
  }
  return {
    baseSnapshotId: requireStringProperty(input, 'baseSnapshotId'),
    changes: input.changes.map(requireChange),
  };
}

function requireChange(value: unknown, index: number): CodeAuthoringChange {
  const input = requireRecord(value);
  const path = requireStringProperty(input, 'path');
  if (path.length > MAX_PATH_LENGTH) {
    throw new Error(`Workspace change path is too long at index ${index}.`);
  }
  if (input.type === 'create') {
    return {
      type: 'create',
      path,
      content: requireStringValue(input.content, 'content', index, true),
      ...(input.language === undefined
        ? {}
        : { language: requireStringValue(input.language, 'language', index, true) }),
    };
  }
  if (input.type === 'update') {
    return {
      type: 'update',
      path,
      baseHash: requireStringValue(input.baseHash, 'baseHash', index),
      content: requireStringValue(input.content, 'content', index, true),
    };
  }
  if (input.type === 'delete') {
    return { type: 'delete', path, baseHash: requireStringValue(input.baseHash, 'baseHash', index) };
  }
  throw new Error(`Workspace change type is invalid at index ${index}.`);
}

function requireStringValue(value: unknown, property: string, index: number, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    throw new Error(`Workspace change ${property} is invalid at index ${index}.`);
  }
  return value;
}

function requireInteger(value: unknown, minimum: number, maximum: number, name: string): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`Workspace search ${name} must be between ${minimum} and ${maximum}.`);
  }
  return value as number;
}

function limitReadFiles(surfaceId: string, files: CodeAuthoringFile[]) {
  let remaining = MAX_TOTAL_READ_CONTENT_LENGTH;
  let truncated = false;
  const limitedFiles = files.map((file) => {
    const content = file.content.slice(0, Math.min(MAX_FILE_CONTENT_LENGTH, Math.max(0, remaining)));
    remaining -= content.length;
    truncated ||= content.length !== file.content.length;
    return { ...file, content };
  });
  return { surfaceId, files: limitedFiles, truncated };
}

function limitSearchMatches(surfaceId: string, matches: CodeAuthoringSearchMatch[]) {
  const limitedMatches = matches.slice(0, MAX_SEARCH_RESULTS).map((match) => ({
    ...match,
    preview: match.preview.slice(0, MAX_SEARCH_PREVIEW_LENGTH),
  }));
  return {
    surfaceId,
    matches: limitedMatches,
    truncated:
      matches.length !== limitedMatches.length ||
      limitedMatches.some((match, index) => match.preview.length !== matches[index]?.preview.length),
  };
}

function toolError(
  surfaceId: string,
  tool: WorkspaceAuthoringToolName,
  code: string,
  message: string,
  details?: unknown,
): FrontendToolInvokeResult {
  return {
    status: 'error',
    content: { code, message, surfaceId, tool, ...(details === undefined ? {} : { details }) },
  };
}

function getErrorCode(error: unknown): string {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : 'WORKSPACE_TOOL_ERROR';
}

function getErrorDetails(error: unknown): unknown {
  return error && typeof error === 'object' && 'details' in error ? error.details : undefined;
}
