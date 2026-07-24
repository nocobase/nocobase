/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import { constants as fsConstants, promises as fs } from 'node:fs';
import { dirname, extname, join, posix, relative, resolve } from 'node:path';
import { getCurrentEnvName, getEnv } from './auth-store.js';
import { translateCli } from './cli-locale.js';

export const LIGHT_EXTENSION_STATE_VERSION = 1;
export const LIGHT_EXTENSION_STATE_PATH = '.nocobase/light-extension-state.json';
export const LIGHT_EXTENSION_BASELINE_PATH = '.nocobase/light-extension-baseline';

export const LIGHT_EXTENSION_EXIT_CODES = {
  general: 1,
  rejected: 2,
  conflict: 3,
  forbidden: 4,
} as const;

const SUPPORTED_KINDS = new Set(['js-block', 'js-page']);
const TOP_LEVEL_GENERATED_DIRECTORIES = new Set([
  '.cache',
  '.next',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'temp',
  'tmp',
]);
export interface LightExtensionDiagnostic {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  kind?: string;
  entryName?: string;
  details?: Record<string, unknown>;
}

export interface LightExtensionWorkspaceCheckResult {
  accepted: boolean;
  httpStatus: 200 | 207 | 422;
  diagnostics: LightExtensionDiagnostic[];
  failureCode?: string;
  artifact?: Record<string, unknown>;
  entries?: Array<Record<string, unknown>>;
}

export interface LightExtensionEntryRecord {
  id: string;
  repoId: string;
  target: 'client';
  kind: 'js-block' | 'js-page';
  entryName: string;
  entryPath: string;
  descriptorPath: string;
}

export interface LightExtensionRepoRecord {
  id: string;
  name: string;
  lifecycleStatus: string;
  headCommitId: string | null;
}

export interface LightExtensionPulledFile {
  path: string;
  blobHash: string;
  size: number;
  language: string;
  mode: string;
  content?: string;
  encoding?: 'utf8' | 'base64';
}

export interface LightExtensionPullResult {
  repo: LightExtensionRepoRecord;
  commit: { id: string; treeHash: string } | null;
  tree: { hash: string; entryCount: number; byteSize: number } | null;
  unchanged: boolean;
  files?: LightExtensionPulledFile[];
}

export interface LightExtensionSaveResult {
  repo: LightExtensionRepoRecord;
  commit: { id: string; treeHash: string };
  tree: { hash: string; entryCount: number; byteSize: number };
  compile: {
    status: 'success' | 'skipped';
    entries: Array<Record<string, unknown>>;
  };
  diagnostics: LightExtensionDiagnostic[];
}

export interface LightExtensionWorkspaceFile {
  path: string;
  content: string;
  encoding: 'utf8';
  language: string;
  mode: string;
}

export interface LightExtensionWorkspaceFileState {
  hash: string;
  language: string;
  mode: string;
}

export interface LightExtensionWorkspaceState {
  version: 1;
  app: {
    apiBaseUrl: string;
  };
  env: {
    name: string;
  };
  repo: {
    id: string;
    name: string;
  };
  entry: {
    id: string;
    kind: 'js-block' | 'js-page';
    name: string;
    path: string;
    descriptorPath: string;
  };
  baseHeadCommitId: string | null;
  files: Record<string, LightExtensionWorkspaceFileState>;
  lastCheck?: {
    localSnapshotId: string;
    baseHeadCommitId: string | null;
  };
}

export interface LightExtensionApiTargetFlags {
  env?: string;
  apiBaseUrl?: string;
}

export interface LightExtensionResolvedTarget {
  envName: string;
  apiBaseUrl: string;
}

export interface LightExtensionWorkspaceDeltaFile {
  path: string;
  operation: 'upsert' | 'delete';
  content?: string;
  encoding?: 'utf8';
  size?: number;
  language?: string;
  mode?: string;
}

export interface LightExtensionWorkspaceDelta {
  files: LightExtensionWorkspaceDeltaFile[];
  summary: {
    changedFiles: number;
    upserts: number;
    deletes: number;
    additions: number;
    deletions: number;
  };
  diff: string;
}

export interface PullTargetInspection {
  dirty: boolean;
  changedPaths: string[];
  state?: LightExtensionWorkspaceState;
  stateError?: string;
}

export class LightExtensionCliError extends Error {
  readonly exitCode: number;
  readonly httpStatus?: number;
  readonly details?: unknown;
  readonly jsonOutput?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      exitCode?: number;
      httpStatus?: number;
      details?: unknown;
      jsonOutput?: Record<string, unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'LightExtensionCliError';
    this.exitCode = options.exitCode ?? LIGHT_EXTENSION_EXIT_CODES.general;
    this.httpStatus = options.httpStatus;
    this.details = options.details;
    this.jsonOutput = options.jsonOutput;
  }

  toJSON(): Record<string, unknown> {
    if (this.jsonOutput) return this.jsonOutput;
    return {
      ok: false,
      ...(this.httpStatus === undefined ? {} : { httpStatus: this.httpStatus }),
      error: {
        message: this.message,
        ...(this.details === undefined ? {} : { details: this.details }),
      },
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.invalidValue', { label }, { fallback: '{{label}} is missing or invalid.' }),
    );
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.invalidValue', { label }, { fallback: '{{label}} is missing or invalid.' }),
    );
  }
  return value;
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  return requireString(value, label);
}

function isSupportedKind(value: string): value is 'js-block' | 'js-page' {
  return SUPPORTED_KINDS.has(value);
}

function sanitizeApiBaseUrl(value: string): string {
  const url = new URL(value);
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}

export async function resolveLightExtensionTarget(
  flags: LightExtensionApiTargetFlags,
): Promise<LightExtensionResolvedTarget> {
  const envName = flags.env ?? (await getCurrentEnvName());
  const env = await getEnv(envName);
  const apiBaseUrl = flags.apiBaseUrl ?? env?.baseUrl;
  if (!apiBaseUrl) {
    throw new LightExtensionCliError(
      translateCli(
        'commands.light.errors.missingApiBaseUrl',
        { envName },
        { fallback: 'Env "{{envName}}" does not have an API base URL. Use --api-base-url or configure the env first.' },
      ),
    );
  }
  return {
    envName,
    apiBaseUrl: sanitizeApiBaseUrl(apiBaseUrl),
  };
}

export function assertTargetMatchesState(
  target: LightExtensionResolvedTarget,
  state: LightExtensionWorkspaceState,
): void {
  if (target.envName !== state.env.name || sanitizeApiBaseUrl(target.apiBaseUrl) !== state.app.apiBaseUrl) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.targetMismatch', undefined, {
        fallback:
          'This workspace belongs to a different NocoBase app or env. Pull it again for the selected target before checking or saving.',
      }),
      {
        details: {
          workspace: { env: state.env.name, apiBaseUrl: state.app.apiBaseUrl },
          selected: { env: target.envName, apiBaseUrl: target.apiBaseUrl },
        },
      },
    );
  }
}

export function unwrapResponseData(value: unknown): unknown {
  return requireRecord(value, 'HTTP response').data;
}

export function getFirstError(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value) || !Array.isArray(value.errors) || !isRecord(value.errors[0])) {
    return undefined;
  }
  return value.errors[0];
}

export function extractWorkspaceCheckResult(value: unknown): LightExtensionWorkspaceCheckResult {
  const record = requireRecord(value, 'Workspace check result');
  if (typeof record.accepted !== 'boolean') {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.checkAcceptedInvalid', undefined, {
        fallback: 'Workspace check accepted is missing or invalid.',
      }),
    );
  }
  if (!Array.isArray(record.diagnostics)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.checkArraysInvalid', undefined, {
        fallback: 'Workspace check diagnostics are missing or invalid.',
      }),
    );
  }
  const httpStatus = record.httpStatus;
  if (httpStatus !== 200 && httpStatus !== 207 && httpStatus !== 422) {
    throw new LightExtensionCliError('Workspace check status is missing or invalid.');
  }
  return {
    ...(record as unknown as LightExtensionWorkspaceCheckResult),
    accepted: record.accepted,
    httpStatus,
    diagnostics: record.diagnostics as LightExtensionDiagnostic[],
    ...(Array.isArray(record.entries) ? { entries: record.entries as Array<Record<string, unknown>> } : {}),
  };
}

export function extractRejectedWorkspaceCheckResult(value: unknown): LightExtensionWorkspaceCheckResult {
  const error = getFirstError(value);
  if (error?.details) {
    return extractWorkspaceCheckResult(error.details);
  }
  return extractWorkspaceCheckResult(unwrapResponseData(value));
}

export function exitCodeForHttpStatus(status: number): number {
  if (status === 422) return LIGHT_EXTENSION_EXIT_CODES.rejected;
  if (status === 409) return LIGHT_EXTENSION_EXIT_CODES.conflict;
  if (status === 403) return LIGHT_EXTENSION_EXIT_CODES.forbidden;
  return LIGHT_EXTENSION_EXIT_CODES.general;
}

export function buildHttpError(status: number, responseBody: unknown, operation: string): LightExtensionCliError {
  const firstError = getFirstError(responseBody);
  const message =
    typeof firstError?.message === 'string' && firstError.message.trim()
      ? firstError.message
      : translateCli(
          'commands.light.errors.httpFailure',
          { operation, status },
          { fallback: '{{operation}} failed with HTTP {{status}}.' },
        );
  return new LightExtensionCliError(message, {
    httpStatus: status,
    exitCode: exitCodeForHttpStatus(status),
    details: responseBody,
  });
}

export function extractEntryRecord(value: unknown): LightExtensionEntryRecord {
  const record = requireRecord(value, 'Light extension entry');
  const target = requireString(record.target, 'Entry target');
  if (target !== 'client') {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.clientEntriesOnly', undefined, {
        fallback: 'The local Light Extension workflow only supports client entries.',
      }),
    );
  }
  const kind = requireString(record.kind, 'Entry kind');
  if (!isSupportedKind(kind)) {
    throw new LightExtensionCliError(
      translateCli(
        'commands.light.errors.unsupportedEntryKind',
        { kind },
        {
          fallback:
            'The local Light Extension workflow only supports JS Block and JS Page entries; received "{{kind}}". Use the raw API command for other kinds.',
        },
      ),
    );
  }
  return {
    id: requireString(record.id, 'Entry id'),
    repoId: requireString(record.repoId, 'Entry repo id'),
    target,
    kind,
    entryName: requireString(record.entryName, 'Entry name'),
    entryPath: normalizeWorkspacePath(requireString(record.entryPath, 'Entry path')),
    descriptorPath: normalizeWorkspacePath(requireString(record.descriptorPath, 'Entry descriptor path')),
  };
}

export function extractPullResult(value: unknown): LightExtensionPullResult {
  const record = requireRecord(value, 'Light extension pull result');
  const repo = requireRecord(record.repo, 'Pull repository');
  if (!Array.isArray(record.files)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.pullFilesMissing', undefined, {
        fallback: 'Pull response must include the complete files array.',
      }),
    );
  }
  return {
    ...(record as unknown as LightExtensionPullResult),
    repo: {
      ...(repo as unknown as LightExtensionRepoRecord),
      id: requireString(repo.id, 'Pull repository id'),
      name: requireString(repo.name, 'Pull repository name'),
      lifecycleStatus: requireString(repo.lifecycleStatus, 'Pull repository lifecycleStatus'),
      headCommitId: requireNullableString(repo.headCommitId, 'Pull repository headCommitId'),
    },
    files: record.files as LightExtensionPulledFile[],
  };
}

export function extractSaveResult(value: unknown): LightExtensionSaveResult {
  const record = requireRecord(value, 'Light extension save result');
  const repo = requireRecord(record.repo, 'Save repository');
  const commit = requireRecord(record.commit, 'Save commit');
  const tree = requireRecord(record.tree, 'Save tree');
  requireString(commit.id, 'Save commit id');
  requireString(tree.hash, 'Save tree hash');
  return {
    ...(record as unknown as LightExtensionSaveResult),
    repo: repo as unknown as LightExtensionRepoRecord,
    commit: commit as unknown as LightExtensionSaveResult['commit'],
    tree: tree as unknown as LightExtensionSaveResult['tree'],
  };
}

export function normalizeWorkspacePath(value: string): string {
  const slashPath = value.replace(/\\/g, '/').replace(/^\.\/+/, '');
  const normalized = posix.normalize(slashPath);
  if (
    !normalized ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.startsWith('/') ||
    normalized.includes('\0') ||
    normalized !== slashPath
  ) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.invalidWorkspacePath', { path: value }, {
        fallback: 'Invalid workspace path: {{path}}',
      }),
    );
  }
  return normalized;
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function inferLanguage(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === '.ts' || extension === '.tsx') return 'typescript';
  if (extension === '.js' || extension === '.jsx') return 'javascript';
  if (extension === '.json') return 'json';
  if (extension === '.html') return 'html';
  if (extension === '.css') return 'css';
  if (extension === '.md') return 'markdown';
  return 'text';
}

function hasDisallowedBinaryControls(content: string): boolean {
  for (const character of content) {
    const code = character.codePointAt(0) ?? 0;
    if ((code >= 0 && code < 8) || (code > 13 && code < 32) || code === 127) {
      return true;
    }
  }
  return false;
}

function decodeUtf8Source(bytes: Buffer, path: string): string {
  let content: string;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error: unknown) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.nonUtf8Unsupported', { path }, {
        fallback: 'Binary or non-UTF-8 files are not supported by the first local Agent workflow: {{path}}.',
      }),
      { cause: error },
    );
  }
  if (content.includes('\0') || hasDisallowedBinaryControls(content)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.controlBytesUnsupported', { path }, {
        fallback:
          'Binary files and source containing NUL/control bytes are not supported by the first local Agent workflow: {{path}}.',
      }),
    );
  }
  return content;
}

function shouldExcludePath(path: string): boolean {
  const segments = path.split('/');
  if (segments[0] === '.git' || segments[0] === '.nocobase') return true;
  if (segments[0] === '.light-extension' && segments[1] === 'types') return true;
  return segments.length > 1 && TOP_LEVEL_GENERATED_DIRECTORIES.has(segments[0]);
}

async function assertWorkspacePathHasNoSymlinks(workspaceRoot: string, workspacePath?: string): Promise<void> {
  const root = resolve(workspaceRoot);
  const segments = workspacePath ? normalizeWorkspacePath(workspacePath).split('/') : [];
  const candidates: Array<{ absolutePath: string; workspacePath: string }> = [{ absolutePath: root, workspacePath: '.' }];
  let currentPath = root;
  for (let index = 0; index < segments.length; index += 1) {
    currentPath = join(currentPath, segments[index]);
    candidates.push({ absolutePath: currentPath, workspacePath: segments.slice(0, index + 1).join('/') });
  }
  for (const candidate of candidates) {
    try {
      const stats = await fs.lstat(candidate.absolutePath);
      if (stats.isSymbolicLink()) {
        throw new LightExtensionCliError(
          translateCli('commands.light.errors.symlinkUnsupported', { path: candidate.workspacePath }, {
            fallback: 'Symbolic links are not supported in a Light Extension workspace: {{path}}',
          }),
        );
      }
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }
}

async function walkWorkspaceFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const workspacePath = relative(root, absolutePath).replace(/\\/g, '/');
      if (entry.isSymbolicLink()) {
        throw new LightExtensionCliError(
          translateCli('commands.light.errors.symlinkUnsupported', { path: workspacePath }, {
            fallback: 'Symbolic links are not supported in a Light Extension workspace: {{path}}',
          }),
        );
      }
      if (shouldExcludePath(workspacePath)) continue;
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else if (entry.isFile()) {
        files.push(normalizeWorkspacePath(workspacePath));
      }
    }
  }

  try {
    await assertWorkspacePathHasNoSymlinks(root);
    await walk(root);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return [];
    throw error;
  }
  return files.sort();
}

export async function readWorkspaceFiles(
  workspaceRoot: string,
  state?: LightExtensionWorkspaceState,
): Promise<LightExtensionWorkspaceFile[]> {
  const root = resolve(workspaceRoot);
  const paths = await walkWorkspaceFiles(root);
  const files: LightExtensionWorkspaceFile[] = [];
  for (const path of paths) {
    await assertWorkspacePathHasNoSymlinks(root, path);
    const content = decodeUtf8Source(await fs.readFile(join(root, ...path.split('/'))), path);
    const baseline = state?.files[path];
    files.push({
      path,
      content,
      encoding: 'utf8',
      language: baseline?.language || inferLanguage(path),
      mode: baseline?.mode || '100644',
    });
  }
  return files;
}

export function buildWorkspaceSnapshotId(files: readonly LightExtensionWorkspaceFile[]): string {
  const snapshot = files
    .map((file) => [normalizeWorkspacePath(file.path), file.content, file.language, file.mode])
    .sort(([left], [right]) => left.localeCompare(right));
  return sha256(JSON.stringify(snapshot));
}

function stateFileFromWorkspaceFile(file: LightExtensionWorkspaceFile): LightExtensionWorkspaceFileState {
  return {
    hash: sha256(file.content),
    language: file.language,
    mode: file.mode,
  };
}

function parseWorkspaceState(value: unknown): LightExtensionWorkspaceState {
  const record = requireRecord(value, 'Light Extension workspace state');
  if (record.version !== LIGHT_EXTENSION_STATE_VERSION) {
    throw new LightExtensionCliError(
      translateCli(
        'commands.light.errors.stateVersion',
        { version: String(record.version) },
        { fallback: 'Unsupported Light Extension workspace state version: {{version}}. Pull the workspace again.' },
      ),
    );
  }
  const app = requireRecord(record.app, 'Workspace app');
  const env = requireRecord(record.env, 'Workspace env');
  const repo = requireRecord(record.repo, 'Workspace repo');
  const entry = requireRecord(record.entry, 'Workspace entry');
  const files = requireRecord(record.files, 'Workspace files');
  const parsedFiles: Record<string, LightExtensionWorkspaceFileState> = {};
  for (const [rawPath, rawFile] of Object.entries(files)) {
    const path = normalizeWorkspacePath(rawPath);
    const file = requireRecord(rawFile, `Workspace file ${path}`);
    parsedFiles[path] = {
      hash: requireString(file.hash, `Workspace file hash ${path}`),
      language: requireString(file.language, `Workspace file language ${path}`),
      mode: requireString(file.mode, `Workspace file mode ${path}`),
    };
  }
  const kind = requireString(entry.kind, 'Workspace entry kind');
  if (!isSupportedKind(kind)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.workspaceEntryKind', { kind }, {
        fallback: 'Unsupported workspace entry kind: {{kind}}',
      }),
    );
  }
  return {
    ...(record as unknown as LightExtensionWorkspaceState),
    version: 1,
    app: { apiBaseUrl: sanitizeApiBaseUrl(requireString(app.apiBaseUrl, 'Workspace API base URL')) },
    env: { name: requireString(env.name, 'Workspace env name') },
    repo: {
      id: requireString(repo.id, 'Workspace repo id'),
      name: requireString(repo.name, 'Workspace repo name'),
    },
    entry: {
      id: requireString(entry.id, 'Workspace entry id'),
      kind,
      name: requireString(entry.name, 'Workspace entry name'),
      path: normalizeWorkspacePath(requireString(entry.path, 'Workspace entry path')),
      descriptorPath: normalizeWorkspacePath(requireString(entry.descriptorPath, 'Workspace entry descriptor path')),
    },
    baseHeadCommitId: requireNullableString(record.baseHeadCommitId, 'Workspace base Head'),
    files: parsedFiles,
  };
}

export async function loadWorkspaceState(workspaceRoot: string): Promise<LightExtensionWorkspaceState> {
  const statePath = join(resolve(workspaceRoot), ...LIGHT_EXTENSION_STATE_PATH.split('/'));
  let content: string;
  try {
    await assertWorkspacePathHasNoSymlinks(workspaceRoot, LIGHT_EXTENSION_STATE_PATH);
    content = await fs.readFile(statePath, 'utf8');
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new LightExtensionCliError(
        translateCli(
          'commands.light.errors.stateMissing',
          { statePath },
          { fallback: 'No Light Extension workspace state was found at {{statePath}}. Run `nb light pull` first.' },
        ),
      );
    }
    throw error;
  }
  try {
    return parseWorkspaceState(JSON.parse(content));
  } catch (error: unknown) {
    if (error instanceof LightExtensionCliError) throw error;
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.stateInvalid', { statePath }, {
        fallback: 'The Light Extension workspace state at {{statePath}} is invalid.',
      }),
      { cause: error },
    );
  }
}

async function loadWorkspaceStateIfPresent(workspaceRoot: string): Promise<LightExtensionWorkspaceState | undefined> {
  const statePath = join(resolve(workspaceRoot), ...LIGHT_EXTENSION_STATE_PATH.split('/'));
  try {
    await assertWorkspacePathHasNoSymlinks(workspaceRoot, LIGHT_EXTENSION_STATE_PATH);
    const content = await fs.readFile(statePath, 'utf8');
    return parseWorkspaceState(JSON.parse(content));
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export async function inspectPullTarget(workspaceRoot: string): Promise<PullTargetInspection> {
  const root = resolve(workspaceRoot);
  try {
    await fs.access(root, fsConstants.F_OK);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return { dirty: false, changedPaths: [] };
    }
    throw error;
  }

  let state: LightExtensionWorkspaceState | undefined;
  let stateError: string | undefined;
  try {
    state = await loadWorkspaceStateIfPresent(root);
  } catch (error: unknown) {
    stateError = error instanceof Error ? error.message : String(error);
  }
  const currentPaths = await walkWorkspaceFiles(root);
  if (!state) {
    return {
      dirty: currentPaths.length > 0 || Boolean(stateError),
      changedPaths: currentPaths,
      stateError,
    };
  }
  const changedPaths = new Set<string>();
  const currentPathSet = new Set(currentPaths);
  for (const path of currentPaths) {
    try {
      await assertWorkspacePathHasNoSymlinks(root, path);
      const content = decodeUtf8Source(await fs.readFile(join(root, ...path.split('/'))), path);
      if (state.files[path]?.hash !== sha256(content)) changedPaths.add(path);
    } catch {
      changedPaths.add(path);
    }
  }
  for (const path of Object.keys(state.files)) {
    if (!currentPathSet.has(path)) changedPaths.add(path);
  }
  return {
    dirty: changedPaths.size > 0,
    changedPaths: [...changedPaths].sort(),
    state,
  };
}

function validatePulledFiles(files: readonly LightExtensionPulledFile[]): LightExtensionWorkspaceFile[] {
  const paths = new Set<string>();
  return files
    .map((file) => {
      const path = normalizeWorkspacePath(requireString(file.path, 'Pulled file path'));
      if (paths.has(path))
        throw new LightExtensionCliError(
          translateCli('commands.light.errors.duplicatePullPath', { path }, {
            fallback: 'Pull response contains a duplicate path: {{path}}',
          }),
        );
      paths.add(path);
      if (file.encoding === 'base64') {
        throw new LightExtensionCliError(
          translateCli('commands.light.errors.base64Unsupported', { path }, {
            fallback: 'Base64 or binary files are not supported by the first local Agent workflow: {{path}}.',
          }),
        );
      }
      if (typeof file.content !== 'string') {
        throw new LightExtensionCliError(
          translateCli('commands.light.errors.pullUtf8Missing', { path }, {
            fallback: 'Pull response did not include UTF-8 content for {{path}}.',
          }),
        );
      }
      const content = decodeUtf8Source(Buffer.from(file.content, 'utf8'), path);
      return {
        path,
        content,
        encoding: 'utf8' as const,
        language: typeof file.language === 'string' && file.language ? file.language : inferLanguage(path),
        mode: typeof file.mode === 'string' && file.mode ? file.mode : '100644',
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}

async function writeStateAndBaseline(
  workspaceRoot: string,
  state: LightExtensionWorkspaceState,
  files: readonly LightExtensionWorkspaceFile[],
): Promise<void> {
  const root = resolve(workspaceRoot);
  const statePath = join(root, ...LIGHT_EXTENSION_STATE_PATH.split('/'));
  const baselineRoot = join(root, ...LIGHT_EXTENSION_BASELINE_PATH.split('/'));
  await assertWorkspacePathHasNoSymlinks(root);
  await assertWorkspacePathHasNoSymlinks(root, LIGHT_EXTENSION_BASELINE_PATH);
  await fs.rm(baselineRoot, { recursive: true, force: true });
  await fs.mkdir(baselineRoot, { recursive: true });
  await assertWorkspacePathHasNoSymlinks(root, LIGHT_EXTENSION_BASELINE_PATH);
  for (const file of files) {
    const target = join(baselineRoot, ...file.path.split('/'));
    const baselinePath = `${LIGHT_EXTENSION_BASELINE_PATH}/${file.path}`;
    await assertWorkspacePathHasNoSymlinks(root, baselinePath);
    await fs.mkdir(dirname(target), { recursive: true });
    await assertWorkspacePathHasNoSymlinks(root, baselinePath);
    await fs.writeFile(target, file.content, 'utf8');
  }
  await assertWorkspacePathHasNoSymlinks(root, LIGHT_EXTENSION_STATE_PATH);
  await fs.mkdir(dirname(statePath), { recursive: true });
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  await assertWorkspacePathHasNoSymlinks(root, `${LIGHT_EXTENSION_STATE_PATH}.${process.pid}.tmp`);
  await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await assertWorkspacePathHasNoSymlinks(root, LIGHT_EXTENSION_STATE_PATH);
  await fs.rename(temporaryPath, statePath);
}

export async function materializePulledWorkspace(options: {
  workspaceRoot: string;
  target: LightExtensionResolvedTarget;
  repoId: string;
  entry: LightExtensionEntryRecord;
  pull: LightExtensionPullResult;
  previousState?: LightExtensionWorkspaceState;
}): Promise<LightExtensionWorkspaceState> {
  if (options.pull.repo.id !== options.repoId || options.entry.repoId !== options.repoId) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.pullSelectionMismatch', undefined, {
        fallback: 'The selected repository, entry, and pull response do not match.',
      }),
    );
  }
  if (options.pull.repo.lifecycleStatus === 'archived') {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.archivedRepository', undefined, {
        fallback: 'Archived Light Extension repositories cannot enter the local Agent workflow.',
      }),
    );
  }
  const files = validatePulledFiles(options.pull.files || []);
  const pulledPaths = new Set(files.map((file) => file.path));
  if (!pulledPaths.has(options.entry.entryPath) || !pulledPaths.has(options.entry.descriptorPath)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.entryFilesMissing', undefined, {
        fallback:
          'The pulled repository does not contain the selected entry source and descriptor. Repair the repository before using the local Agent workflow.',
      }),
      { details: { entryPath: options.entry.entryPath, descriptorPath: options.entry.descriptorPath } },
    );
  }
  const root = resolve(options.workspaceRoot);
  await assertWorkspacePathHasNoSymlinks(root);
  await fs.mkdir(root, { recursive: true });
  await assertWorkspacePathHasNoSymlinks(root);
  const newPaths = new Set(files.map((file) => file.path));
  for (const path of Object.keys(options.previousState?.files || {})) {
    if (!newPaths.has(path)) {
      await assertWorkspacePathHasNoSymlinks(root, path);
      await fs.rm(join(root, ...path.split('/')), { force: true });
    }
  }
  for (const file of files) {
    const target = join(root, ...file.path.split('/'));
    await assertWorkspacePathHasNoSymlinks(root, file.path);
    await fs.mkdir(dirname(target), { recursive: true });
    await assertWorkspacePathHasNoSymlinks(root, file.path);
    await fs.writeFile(target, file.content, 'utf8');
  }
  const fileStates = Object.fromEntries(files.map((file) => [file.path, stateFileFromWorkspaceFile(file)]));
  const state: LightExtensionWorkspaceState = {
    version: 1,
    app: { apiBaseUrl: sanitizeApiBaseUrl(options.target.apiBaseUrl) },
    env: { name: options.target.envName },
    repo: { id: options.pull.repo.id, name: options.pull.repo.name },
    entry: {
      id: options.entry.id,
      kind: options.entry.kind,
      name: options.entry.entryName,
      path: options.entry.entryPath,
      descriptorPath: options.entry.descriptorPath,
    },
    baseHeadCommitId: options.pull.repo.headCommitId,
    files: fileStates,
  };
  await writeStateAndBaseline(root, state, files);
  return state;
}

export async function recordSuccessfulWorkspaceCheck(options: {
  workspaceRoot: string;
  state: LightExtensionWorkspaceState;
  files: readonly LightExtensionWorkspaceFile[];
}): Promise<LightExtensionWorkspaceState> {
  const localSnapshotId = buildWorkspaceSnapshotId(options.files);
  const state: LightExtensionWorkspaceState = {
    ...options.state,
    lastCheck: {
      localSnapshotId,
      baseHeadCommitId: options.state.baseHeadCommitId,
    },
  };
  const statePath = join(resolve(options.workspaceRoot), ...LIGHT_EXTENSION_STATE_PATH.split('/'));
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  await assertWorkspacePathHasNoSymlinks(options.workspaceRoot, LIGHT_EXTENSION_STATE_PATH);
  await assertWorkspacePathHasNoSymlinks(
    options.workspaceRoot,
    `${LIGHT_EXTENSION_STATE_PATH}.${process.pid}.tmp`,
  );
  await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await assertWorkspacePathHasNoSymlinks(options.workspaceRoot, LIGHT_EXTENSION_STATE_PATH);
  await fs.rename(temporaryPath, statePath);
  return state;
}

async function readBaselineContent(workspaceRoot: string, path: string): Promise<string> {
  const baselinePath = join(resolve(workspaceRoot), ...LIGHT_EXTENSION_BASELINE_PATH.split('/'), ...path.split('/'));
  try {
    await assertWorkspacePathHasNoSymlinks(workspaceRoot, `${LIGHT_EXTENSION_BASELINE_PATH}/${path}`);
    return await fs.readFile(baselinePath, 'utf8');
  } catch (error: unknown) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.baselineMissing', { path }, {
        fallback: 'The Pull baseline for {{path}} is missing. Pull the workspace again before saving.',
      }),
      { cause: error },
    );
  }
}

export async function assertWorkspaceBaselineIntegrity(
  workspaceRoot: string,
  state: LightExtensionWorkspaceState,
): Promise<void> {
  for (const [path, file] of Object.entries(state.files)) {
    const content = await readBaselineContent(workspaceRoot, path);
    const actualHash = sha256(content);
    if (actualHash !== file.hash) {
      throw new LightExtensionCliError(
        translateCli(
          'commands.light.errors.baselineHashMismatch',
          { path },
          {
            fallback:
              'The Pull baseline for {{path}} does not match the workspace state. Pull the workspace again before reviewing or saving changes.',
          },
        ),
        { details: { path, expectedHash: file.hash, actualHash } },
      );
    }
  }
}

function splitLines(content: string): string[] {
  if (!content) return [];
  const lines = content.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

function buildFileDiff(path: string, before: string, after: string): { text: string; additions: number; deletions: number } {
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  let prefix = 0;
  while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < beforeLines.length - prefix &&
    suffix < afterLines.length - prefix &&
    beforeLines[beforeLines.length - 1 - suffix] === afterLines[afterLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const removed = beforeLines.slice(prefix, beforeLines.length - suffix);
  const added = afterLines.slice(prefix, afterLines.length - suffix);
  const oldStart = prefix + 1;
  const newStart = prefix + 1;
  const text = [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -${oldStart},${removed.length} +${newStart},${added.length} @@`,
    ...removed.map((line) => `-${line}`),
    ...added.map((line) => `+${line}`),
  ].join('\n');
  return { text, additions: added.length, deletions: removed.length };
}

export async function buildWorkspaceDelta(options: {
  workspaceRoot: string;
  state: LightExtensionWorkspaceState;
  files: readonly LightExtensionWorkspaceFile[];
}): Promise<LightExtensionWorkspaceDelta> {
  await assertWorkspaceBaselineIntegrity(options.workspaceRoot, options.state);
  const currentByPath = new Map(options.files.map((file) => [file.path, file]));
  const paths = new Set([...Object.keys(options.state.files), ...currentByPath.keys()]);
  const changes: LightExtensionWorkspaceDeltaFile[] = [];
  const diffs: string[] = [];
  let additions = 0;
  let deletions = 0;
  for (const path of [...paths].sort()) {
    const baseline = options.state.files[path];
    const current = currentByPath.get(path);
    if (!current) {
      const before = await readBaselineContent(options.workspaceRoot, path);
      const diff = buildFileDiff(path, before, '');
      additions += diff.additions;
      deletions += diff.deletions;
      diffs.push(diff.text);
      changes.push({ path, operation: 'delete' });
      continue;
    }
    if (baseline?.hash === sha256(current.content)) continue;
    const before = baseline ? await readBaselineContent(options.workspaceRoot, path) : '';
    const diff = buildFileDiff(path, before, current.content);
    additions += diff.additions;
    deletions += diff.deletions;
    diffs.push(diff.text);
    changes.push({
      path,
      operation: 'upsert',
      content: current.content,
      encoding: 'utf8',
      size: Buffer.byteLength(current.content, 'utf8'),
      language: current.language,
      mode: current.mode,
    });
  }
  return {
    files: changes,
    summary: {
      changedFiles: changes.length,
      upserts: changes.filter((file) => file.operation === 'upsert').length,
      deletes: changes.filter((file) => file.operation === 'delete').length,
      additions,
      deletions,
    },
    diff: diffs.join('\n\n'),
  };
}

export function assertWorkspaceReadyToSave(
  state: LightExtensionWorkspaceState,
  files: readonly LightExtensionWorkspaceFile[],
): string {
  const snapshotId = buildWorkspaceSnapshotId(files);
  if (
    !state.lastCheck ||
    state.lastCheck.localSnapshotId !== snapshotId ||
    state.lastCheck.baseHeadCommitId !== state.baseHeadCommitId
  ) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.checkRequired', undefined, {
        fallback:
          'The current local snapshot has not passed the authoritative workspace check. Run `nb light check` after the latest file change.',
      }),
      {
        details: {
          currentSnapshotId: snapshotId,
          checkedSnapshotId: state.lastCheck?.localSnapshotId,
          baseHeadCommitId: state.baseHeadCommitId,
        },
      },
    );
  }
  return snapshotId;
}

export async function recordSuccessfulSave(options: {
  workspaceRoot: string;
  state: LightExtensionWorkspaceState;
  files: readonly LightExtensionWorkspaceFile[];
  result: LightExtensionSaveResult;
}): Promise<LightExtensionWorkspaceState> {
  if (options.result.repo.id !== options.state.repo.id) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.saveRepoMismatch', undefined, {
        fallback: 'Save response repository does not match the local workspace.',
      }),
    );
  }
  const state: LightExtensionWorkspaceState = {
    ...options.state,
    baseHeadCommitId: options.result.commit.id,
    files: Object.fromEntries(options.files.map((file) => [file.path, stateFileFromWorkspaceFile(file)])),
    lastCheck: undefined,
  };
  delete state.lastCheck;
  await writeStateAndBaseline(options.workspaceRoot, state, options.files);
  return state;
}

export function assertSafeWorkspaceDirectory(value: string): string {
  const root = resolve(value);
  if (root === dirname(root)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.errors.unsafeDirectory', { path: value }, {
        fallback: 'Refusing to use an unsafe workspace directory: {{path}}',
      }),
    );
  }
  return root;
}
