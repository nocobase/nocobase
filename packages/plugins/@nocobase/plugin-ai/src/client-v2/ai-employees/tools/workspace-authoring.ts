/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CodeAuthoringCapabilities,
  CodeAuthoringChange,
  CodeAuthoringFile,
  CodeAuthoringSearchMatch,
  CodeAuthoringSurface,
} from '@nocobase/client-v2';

import type { FrontendToolInvokeResult, FrontendToolManifest } from '../../../common/frontend-tools';
import type { FrontendToolRegistry, FrontendToolRegistration } from '../../manager/frontend-tool-registry';

export const WORKSPACE_AUTHORING_TOOL_NAMES = {
  describe: 'workspaceDescribe',
  listFiles: 'workspaceListFiles',
  readFiles: 'workspaceReadFiles',
  search: 'workspaceSearch',
  prepareChanges: 'workspacePrepareChanges',
  applyPreparedChanges: 'workspaceApplyPreparedChanges',
  validateDraft: 'workspaceValidateDraft',
} as const;

export type WorkspaceAuthoringToolName =
  (typeof WORKSPACE_AUTHORING_TOOL_NAMES)[keyof typeof WORKSPACE_AUTHORING_TOOL_NAMES];

type WorkspaceAuthoringApplication = {
  aiManager: {
    authoringSurfaces: {
      get: (surfaceId: string) => CodeAuthoringSurface | undefined;
    };
  };
};

type WorkspaceCapability = keyof Pick<
  CodeAuthoringCapabilities,
  'describe' | 'listFiles' | 'readFiles' | 'search' | 'prepareChanges' | 'applyPreparedChanges' | 'validateDraft'
>;

type WorkspaceToolErrorContent = {
  code: string;
  message: string;
  surfaceId: string;
  tool: WorkspaceAuthoringToolName;
  details?: unknown;
};

const MAX_PATHS = 20;
const MAX_PATH_LENGTH = 512;
const MAX_QUERY_LENGTH = 512;
const MAX_SEARCH_RESULTS = 50;
const MAX_SEARCH_CONTEXT_LENGTH = 400;
const MAX_FILE_CONTENT_LENGTH = 100_000;
const MAX_TOTAL_READ_CONTENT_LENGTH = 200_000;
const MAX_SEARCH_PREVIEW_LENGTH = 1_000;

const noArgsSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

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
      required: ['type', 'path', 'baseHash', 'patch'],
      properties: {
        type: { const: 'patch' },
        path: { type: 'string', minLength: 1, maxLength: MAX_PATH_LENGTH },
        baseHash: { type: 'string', minLength: 1 },
        patch: { type: 'string' },
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

const toolDefinitions: Array<
  Omit<FrontendToolRegistration, 'execute'> & {
    name: WorkspaceAuthoringToolName;
    capability: WorkspaceCapability;
  }
> = [
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.describe,
    title: 'Describe workspace',
    description:
      'Describe the bound code workspace, including the latest snapshot, files, diagnostics, and capabilities.',
    permission: 'ALLOW',
    capability: 'describe',
    inputSchema: noArgsSchema,
  },
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.listFiles,
    title: 'List workspace files',
    description: 'List readable source and virtual files in the bound code workspace.',
    permission: 'ALLOW',
    capability: 'listFiles',
    inputSchema: noArgsSchema,
  },
  {
    name: WORKSPACE_AUTHORING_TOOL_NAMES.readFiles,
    title: 'Read workspace files',
    description: 'Read selected files from the bound code workspace using the surface read policy.',
    permission: 'ALLOW',
    capability: 'readFiles',
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
    description: 'Search readable files in the bound code workspace.',
    permission: 'ALLOW',
    capability: 'search',
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
    description: 'Prepare an exact multi-file change plan without modifying the local draft.',
    permission: 'ALLOW',
    capability: 'prepareChanges',
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
    description: 'Apply one previously prepared workspace plan to the local draft. This does not save the workspace.',
    permission: 'ASK',
    capability: 'applyPreparedChanges',
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
    description: 'Validate the complete current workspace draft without executing or saving it.',
    permission: 'ALLOW',
    capability: 'validateDraft',
    inputSchema: noArgsSchema,
  },
];

export async function registerWorkspaceAuthoringTools(
  app: WorkspaceAuthoringApplication,
  registry: FrontendToolRegistry,
  surfaceId: string,
): Promise<FrontendToolManifest[]> {
  const boundSurface = app.aiManager.authoringSurfaces.get(surfaceId);
  if (!boundSurface) {
    registry.clear(surfaceId);
    return [];
  }

  let snapshot: Awaited<ReturnType<CodeAuthoringSurface['getSnapshot']>>;
  try {
    snapshot = await boundSurface.getSnapshot();
  } catch {
    registry.clear(surfaceId);
    return [];
  }
  if (snapshot.surfaceId !== surfaceId || app.aiManager.authoringSurfaces.get(surfaceId) !== boundSurface) {
    registry.clear(surfaceId);
    return [];
  }

  registry.clear(surfaceId);
  return toolDefinitions
    .filter((definition) => snapshot.capabilities[definition.capability])
    .map((definition) =>
      registry.register(surfaceId, {
        ...definition,
        execute: async (args) =>
          executeWorkspaceTool(app, boundSurface, surfaceId, definition.name, definition.capability, args),
      }),
    );
}

async function executeWorkspaceTool(
  app: WorkspaceAuthoringApplication,
  boundSurface: CodeAuthoringSurface,
  surfaceId: string,
  toolName: WorkspaceAuthoringToolName,
  capability: WorkspaceCapability,
  args: unknown,
): Promise<FrontendToolInvokeResult> {
  const currentSurface = app.aiManager.authoringSurfaces.get(surfaceId);
  if (!currentSurface || currentSurface !== boundSurface) {
    return toolError(surfaceId, toolName, 'WORKSPACE_SURFACE_UNAVAILABLE', 'The bound workspace is unavailable.');
  }

  try {
    const snapshot = await currentSurface.getSnapshot();
    if (snapshot.surfaceId !== surfaceId) {
      return toolError(surfaceId, toolName, 'WORKSPACE_SURFACE_MISMATCH', 'The bound workspace identity changed.');
    }
    if (!snapshot.capabilities[capability]) {
      return toolError(
        surfaceId,
        toolName,
        'WORKSPACE_CAPABILITY_UNAVAILABLE',
        snapshot.capabilities.unavailableReason || `Workspace capability is unavailable: ${capability}`,
      );
    }

    const content = await invokeWorkspaceTool(currentSurface, snapshot, toolName, args);
    return { status: 'success', content };
  } catch (error) {
    return toolError(
      surfaceId,
      toolName,
      getErrorCode(error),
      error instanceof Error ? error.message : 'Workspace tool execution failed.',
      getErrorDetails(error),
    );
  }
}

async function invokeWorkspaceTool(
  surface: CodeAuthoringSurface,
  snapshot: Awaited<ReturnType<CodeAuthoringSurface['getSnapshot']>>,
  toolName: WorkspaceAuthoringToolName,
  args: unknown,
): Promise<unknown> {
  switch (toolName) {
    case WORKSPACE_AUTHORING_TOOL_NAMES.describe:
      return snapshot;
    case WORKSPACE_AUTHORING_TOOL_NAMES.listFiles:
      return { surfaceId: surface.id, files: await surface.list() };
    case WORKSPACE_AUTHORING_TOOL_NAMES.readFiles: {
      const paths = requirePaths(args);
      const files = await surface.read(paths);
      return limitReadFiles(surface.id, files);
    }
    case WORKSPACE_AUTHORING_TOOL_NAMES.search: {
      const options = requireSearchOptions(args);
      const matches = await surface.search(options);
      return limitSearchMatches(surface.id, matches);
    }
    case WORKSPACE_AUTHORING_TOOL_NAMES.prepareChanges: {
      const input = requirePrepareInput(args);
      return surface.prepareChanges(input);
    }
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
  const input = requireRecord(value);
  const result = input[key];
  if (typeof result !== 'string' || !result.trim()) {
    throw new Error(`Workspace tool argument is required: ${key}`);
  }
  return result;
}

function requirePaths(value: unknown): string[] {
  const input = requireRecord(value);
  if (!Array.isArray(input.paths) || !input.paths.length || input.paths.length > MAX_PATHS) {
    throw new Error(`Workspace file paths must contain between 1 and ${MAX_PATHS} items.`);
  }
  const paths = input.paths.map((path) => {
    if (typeof path !== 'string' || !path.trim() || path.length > MAX_PATH_LENGTH) {
      throw new Error('Workspace file path is invalid.');
    }
    return path;
  });
  if (new Set(paths).size !== paths.length) {
    throw new Error('Workspace file paths must be unique.');
  }
  return paths;
}

function requireSearchOptions(value: unknown): Parameters<CodeAuthoringSurface['search']>[0] {
  const input = requireRecord(value);
  const query = input.query;
  if (typeof query !== 'string' || !query || query.length > MAX_QUERY_LENGTH) {
    throw new Error('Workspace search query is invalid.');
  }
  const paths = input.paths === undefined ? undefined : requirePaths({ paths: input.paths });
  return {
    query,
    ...(paths ? { paths } : {}),
    ...(input.limit === undefined ? {} : { limit: requireBoundedInteger(input.limit, 1, MAX_SEARCH_RESULTS, 'limit') }),
    ...(input.contextLength === undefined
      ? {}
      : {
          contextLength: requireBoundedInteger(input.contextLength, 1, MAX_SEARCH_CONTEXT_LENGTH, 'contextLength'),
        }),
  };
}

function requirePrepareInput(value: unknown): Parameters<CodeAuthoringSurface['prepareChanges']>[0] {
  const input = requireRecord(value);
  const baseSnapshotId = requireStringProperty(input, 'baseSnapshotId');
  if (!Array.isArray(input.changes) || !input.changes.length || input.changes.length > MAX_PATHS) {
    throw new Error(`Workspace changes must contain between 1 and ${MAX_PATHS} items.`);
  }
  return {
    baseSnapshotId,
    changes: input.changes as CodeAuthoringChange[],
  };
}

function requireBoundedInteger(value: unknown, minimum: number, maximum: number, name: string): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`Workspace search ${name} must be between ${minimum} and ${maximum}.`);
  }
  return value as number;
}

function limitReadFiles(surfaceId: string, files: CodeAuthoringFile[]) {
  let remaining = MAX_TOTAL_READ_CONTENT_LENGTH;
  let truncated = false;
  const limitedFiles = files.map((file) => {
    const maximum = Math.min(MAX_FILE_CONTENT_LENGTH, Math.max(0, remaining));
    const content = file.content.slice(0, maximum);
    remaining -= content.length;
    if (content.length !== file.content.length) {
      truncated = true;
    }
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
      matches.length > limitedMatches.length ||
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
  const content: WorkspaceToolErrorContent = {
    code,
    message,
    surfaceId,
    tool,
    ...(details === undefined ? {} : { details }),
  };
  return { status: 'error', content };
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return 'WORKSPACE_TOOL_ERROR';
}

function getErrorDetails(error: unknown): unknown {
  if (error && typeof error === 'object' && 'details' in error) {
    return error.details;
  }
  return undefined;
}
