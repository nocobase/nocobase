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

export const JS_TEMPLATE_STATE_VERSION = 1;
export const JS_TEMPLATE_STATE_PATH = '.nocobase/js-template-state.json';
export const JS_TEMPLATE_BASELINE_PATH = '.nocobase/js-template-baseline';

export const JS_TEMPLATE_EXIT_CODES = {
  general: 1,
  rejected: 2,
  conflict: 3,
  forbidden: 4,
} as const;

export type JsTemplateKind = 'js-block' | 'js-page' | 'js-field' | 'js-action' | 'js-item';

const SUPPORTED_KINDS = new Set<JsTemplateKind>([
  'js-block',
  'js-page',
  'js-field',
  'js-action',
  'js-item',
]);
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
export interface JsTemplateDiagnostic {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  kind?: string;
  templateName?: string;
  details?: Record<string, unknown>;
}

export interface JsTemplateWorkspaceCheckResult {
  accepted: boolean;
  httpStatus: 200 | 207 | 422;
  diagnostics: JsTemplateDiagnostic[];
  failureCode?: string;
  artifact?: Record<string, unknown>;
  templates?: Array<Record<string, unknown>>;
}

export interface JsTemplateRecord {
  id: string;
  projectId: string;
  target: 'client';
  kind: JsTemplateKind;
  templateName: string;
  entryPath: string;
  descriptorPath: string;
}

export interface JsTemplateProjectRecord {
  id: string;
  name: string;
  lifecycleStatus: 'enabled' | 'disabled';
  headCommitId: string | null;
}

export interface JsTemplatePulledFile {
  path: string;
  blobHash: string;
  size: number;
  language: string;
  mode: string;
  content?: string;
  encoding?: 'utf8' | 'base64';
}

export interface JsTemplatePullResult {
  project: JsTemplateProjectRecord;
  commit: { id: string; treeHash: string } | null;
  tree: { hash: string; entryCount: number; byteSize: number } | null;
  unchanged: boolean;
  files?: JsTemplatePulledFile[];
}

export interface JsTemplateSaveResult {
  project: JsTemplateProjectRecord;
  commit: { id: string; treeHash: string };
  tree: { hash: string; entryCount: number; byteSize: number };
  compile: {
    status: 'success' | 'skipped';
    templates: Array<Record<string, unknown>>;
  };
  diagnostics: JsTemplateDiagnostic[];
}

export interface JsTemplateWorkspaceFile {
  path: string;
  content: string;
  encoding: 'utf8';
  language: string;
  mode: string;
}

export interface JsTemplateWorkspaceFileState {
  hash: string;
  language: string;
  mode: string;
}

export interface JsTemplateWorkspaceState {
  version: 1;
  app: {
    apiBaseUrl: string;
  };
  env: {
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
  template: {
    id: string;
    kind: JsTemplateKind;
    name: string;
    path: string;
    descriptorPath: string;
  };
  baseHeadCommitId: string | null;
  files: Record<string, JsTemplateWorkspaceFileState>;
  lastCheck?: {
    localSnapshotId: string;
    baseHeadCommitId: string | null;
  };
}

export interface JsTemplateApiTargetFlags {
  env?: string;
  apiBaseUrl?: string;
}

export interface JsTemplateResolvedTarget {
  envName: string;
  apiBaseUrl: string;
}

export interface JsTemplateWorkspaceDeltaFile {
  path: string;
  operation: 'upsert' | 'delete';
  content?: string;
  encoding?: 'utf8';
  size?: number;
  language?: string;
  mode?: string;
}

export interface JsTemplateWorkspaceDelta {
  files: JsTemplateWorkspaceDeltaFile[];
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
  state?: JsTemplateWorkspaceState;
  stateError?: string;
}

export class JsTemplateCliError extends Error {
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
    this.name = 'JsTemplateCliError';
    this.exitCode = options.exitCode ?? JS_TEMPLATE_EXIT_CODES.general;
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
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.invalidValue', { label }, { fallback: '{{label}} is missing or invalid.' }),
    );
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.invalidValue', { label }, { fallback: '{{label}} is missing or invalid.' }),
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

function isSupportedKind(value: string): value is JsTemplateKind {
  return SUPPORTED_KINDS.has(value as JsTemplateKind);
}

function sanitizeApiBaseUrl(value: string): string {
  const url = new URL(value);
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}

export async function resolveJsTemplateTarget(
  flags: JsTemplateApiTargetFlags,
): Promise<JsTemplateResolvedTarget> {
  const envName = flags.env ?? (await getCurrentEnvName());
  const env = await getEnv(envName);
  const apiBaseUrl = flags.apiBaseUrl ?? env?.baseUrl;
  if (!apiBaseUrl) {
    throw new JsTemplateCliError(
      translateCli(
        'commands.jsTemplate.errors.missingApiBaseUrl',
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
  target: JsTemplateResolvedTarget,
  state: JsTemplateWorkspaceState,
): void {
  if (target.envName !== state.env.name || sanitizeApiBaseUrl(target.apiBaseUrl) !== state.app.apiBaseUrl) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.targetMismatch', undefined, {
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

export function extractWorkspaceCheckResult(value: unknown): JsTemplateWorkspaceCheckResult {
  const record = requireRecord(value, 'Workspace check result');
  if (typeof record.accepted !== 'boolean') {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.checkAcceptedInvalid', undefined, {
        fallback: 'Workspace check accepted is missing or invalid.',
      }),
    );
  }
  if (!Array.isArray(record.diagnostics)) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.checkArraysInvalid', undefined, {
        fallback: 'Workspace check diagnostics are missing or invalid.',
      }),
    );
  }
  const httpStatus = record.httpStatus;
  if (httpStatus !== 200 && httpStatus !== 207 && httpStatus !== 422) {
    throw new JsTemplateCliError('Workspace check status is missing or invalid.');
  }
  return {
    ...(record as unknown as JsTemplateWorkspaceCheckResult),
    accepted: record.accepted,
    httpStatus,
    diagnostics: record.diagnostics as JsTemplateDiagnostic[],
    ...(Array.isArray(record.templates) ? { templates: record.templates as Array<Record<string, unknown>> } : {}),
  };
}

export function extractRejectedWorkspaceCheckResult(value: unknown): JsTemplateWorkspaceCheckResult {
  const error = getFirstError(value);
  if (error?.details) {
    return extractWorkspaceCheckResult(error.details);
  }
  return extractWorkspaceCheckResult(unwrapResponseData(value));
}

export function exitCodeForHttpStatus(status: number): number {
  if (status === 422) return JS_TEMPLATE_EXIT_CODES.rejected;
  if (status === 409) return JS_TEMPLATE_EXIT_CODES.conflict;
  if (status === 403) return JS_TEMPLATE_EXIT_CODES.forbidden;
  return JS_TEMPLATE_EXIT_CODES.general;
}

export function buildHttpError(status: number, responseBody: unknown, operation: string): JsTemplateCliError {
  const firstError = getFirstError(responseBody);
  const message =
    typeof firstError?.message === 'string' && firstError.message.trim()
      ? firstError.message
      : translateCli(
          'commands.jsTemplate.errors.httpFailure',
          { operation, status },
          { fallback: '{{operation}} failed with HTTP {{status}}.' },
        );
  return new JsTemplateCliError(message, {
    httpStatus: status,
    exitCode: exitCodeForHttpStatus(status),
    details: responseBody,
  });
}

export function extractTemplateRecord(value: unknown): JsTemplateRecord {
  const record = requireRecord(value, 'JS Template template');
  const target = requireString(record.target, 'Template target');
  if (target !== 'client') {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.clientTemplatesOnly', undefined, {
        fallback: 'The local JS Template workflow only supports client templates.',
      }),
    );
  }
  const kind = requireString(record.kind, 'Template kind');
  if (!isSupportedKind(kind)) {
    throw new JsTemplateCliError(
      translateCli(
        'commands.jsTemplate.errors.unsupportedTemplateKind',
        { kind },
        {
          fallback:
            'The local JS Template workflow supports js-block, js-page, js-field, js-action, and js-item templates; received "{{kind}}".',
        },
      ),
    );
  }
  return {
    id: requireString(record.id, 'Template id'),
    projectId: requireString(record.projectId, 'Template project id'),
    target,
    kind,
    templateName: requireString(record.templateName, 'Template name'),
    entryPath: normalizeWorkspacePath(requireString(record.entryPath, 'Template path')),
    descriptorPath: normalizeWorkspacePath(requireString(record.descriptorPath, 'Template descriptor path')),
  };
}

export function extractPullResult(value: unknown): JsTemplatePullResult {
  const record = requireRecord(value, 'JS Template pull result');
  const project = requireRecord(record.project, 'Pull project');
  if (!Array.isArray(record.files)) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.pullFilesMissing', undefined, {
        fallback: 'Pull response must include the complete files array.',
      }),
    );
  }
  return {
    ...(record as unknown as JsTemplatePullResult),
    project: {
      ...(project as unknown as JsTemplateProjectRecord),
      id: requireString(project.id, 'Pull project id'),
      name: requireString(project.name, 'Pull project name'),
      lifecycleStatus: requireString(project.lifecycleStatus, 'Pull project lifecycleStatus'),
      headCommitId: requireNullableString(project.headCommitId, 'Pull project headCommitId'),
    },
    files: record.files as JsTemplatePulledFile[],
  };
}

export function extractSaveResult(value: unknown): JsTemplateSaveResult {
  const record = requireRecord(value, 'JS Template save result');
  const project = requireRecord(record.project, 'Save project');
  const commit = requireRecord(record.commit, 'Save commit');
  const tree = requireRecord(record.tree, 'Save tree');
  requireString(commit.id, 'Save commit id');
  requireString(tree.hash, 'Save tree hash');
  return {
    ...(record as unknown as JsTemplateSaveResult),
    project: project as unknown as JsTemplateProjectRecord,
    commit: commit as unknown as JsTemplateSaveResult['commit'],
    tree: tree as unknown as JsTemplateSaveResult['tree'],
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
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.invalidWorkspacePath', { path: value }, {
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
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.nonUtf8Unsupported', { path }, {
        fallback: 'Binary or non-UTF-8 files are not supported by the first local Agent workflow: {{path}}.',
      }),
      { cause: error },
    );
  }
  if (content.includes('\0') || hasDisallowedBinaryControls(content)) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.controlBytesUnsupported', { path }, {
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
  if (segments[0] === '.js-template' && segments[1] === 'types') return true;
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
        throw new JsTemplateCliError(
          translateCli('commands.jsTemplate.errors.symlinkUnsupported', { path: candidate.workspacePath }, {
            fallback: 'Symbolic links are not supported in a JS Template workspace: {{path}}',
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
    const templates = await fs.readdir(directory, { withFileTypes: true });
    for (const template of templates) {
      const absolutePath = join(directory, template.name);
      const workspacePath = relative(root, absolutePath).replace(/\\/g, '/');
      if (template.isSymbolicLink()) {
        throw new JsTemplateCliError(
          translateCli('commands.jsTemplate.errors.symlinkUnsupported', { path: workspacePath }, {
            fallback: 'Symbolic links are not supported in a JS Template workspace: {{path}}',
          }),
        );
      }
      if (shouldExcludePath(workspacePath)) continue;
      if (template.isDirectory()) {
        await walk(absolutePath);
      } else if (template.isFile()) {
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
  state?: JsTemplateWorkspaceState,
): Promise<JsTemplateWorkspaceFile[]> {
  const root = resolve(workspaceRoot);
  const paths = await walkWorkspaceFiles(root);
  const files: JsTemplateWorkspaceFile[] = [];
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

export function buildWorkspaceSnapshotId(files: readonly JsTemplateWorkspaceFile[]): string {
  const snapshot = files
    .map((file) => [normalizeWorkspacePath(file.path), file.content, file.language, file.mode])
    .sort(([left], [right]) => left.localeCompare(right));
  return sha256(JSON.stringify(snapshot));
}

function stateFileFromWorkspaceFile(file: JsTemplateWorkspaceFile): JsTemplateWorkspaceFileState {
  return {
    hash: sha256(file.content),
    language: file.language,
    mode: file.mode,
  };
}

function parseWorkspaceState(value: unknown): JsTemplateWorkspaceState {
  const record = requireRecord(value, 'JS Template workspace state');
  if (record.version !== JS_TEMPLATE_STATE_VERSION) {
    throw new JsTemplateCliError(
      translateCli(
        'commands.jsTemplate.errors.stateVersion',
        { version: String(record.version) },
        { fallback: 'Unsupported JS Template workspace state version: {{version}}. Pull the workspace again.' },
      ),
    );
  }
  const app = requireRecord(record.app, 'Workspace app');
  const env = requireRecord(record.env, 'Workspace env');
  const project = requireRecord(record.project, 'Workspace project');
  const template = requireRecord(record.template, 'Workspace template');
  const files = requireRecord(record.files, 'Workspace files');
  const parsedFiles: Record<string, JsTemplateWorkspaceFileState> = {};
  for (const [rawPath, rawFile] of Object.entries(files)) {
    const path = normalizeWorkspacePath(rawPath);
    const file = requireRecord(rawFile, `Workspace file ${path}`);
    parsedFiles[path] = {
      hash: requireString(file.hash, `Workspace file hash ${path}`),
      language: requireString(file.language, `Workspace file language ${path}`),
      mode: requireString(file.mode, `Workspace file mode ${path}`),
    };
  }
  const kind = requireString(template.kind, 'Workspace template kind');
  if (!isSupportedKind(kind)) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.workspaceTemplateKind', { kind }, {
        fallback: 'Unsupported workspace template kind: {{kind}}',
      }),
    );
  }
  return {
    ...(record as unknown as JsTemplateWorkspaceState),
    version: 1,
    app: { apiBaseUrl: sanitizeApiBaseUrl(requireString(app.apiBaseUrl, 'Workspace API base URL')) },
    env: { name: requireString(env.name, 'Workspace env name') },
    project: {
      id: requireString(project.id, 'Workspace project id'),
      name: requireString(project.name, 'Workspace project name'),
    },
    template: {
      id: requireString(template.id, 'Workspace template id'),
      kind,
      name: requireString(template.name, 'Workspace template name'),
      path: normalizeWorkspacePath(requireString(template.path, 'Workspace template path')),
      descriptorPath: normalizeWorkspacePath(requireString(template.descriptorPath, 'Workspace template descriptor path')),
    },
    baseHeadCommitId: requireNullableString(record.baseHeadCommitId, 'Workspace base Head'),
    files: parsedFiles,
  };
}

export async function loadWorkspaceState(workspaceRoot: string): Promise<JsTemplateWorkspaceState> {
  const statePath = join(resolve(workspaceRoot), ...JS_TEMPLATE_STATE_PATH.split('/'));
  let content: string;
  try {
    await assertWorkspacePathHasNoSymlinks(workspaceRoot, JS_TEMPLATE_STATE_PATH);
    content = await fs.readFile(statePath, 'utf8');
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new JsTemplateCliError(
        translateCli(
          'commands.jsTemplate.errors.stateMissing',
          { statePath },
          { fallback: 'No JS Template workspace state was found at {{statePath}}. Run `nb js-template pull` first.' },
        ),
      );
    }
    throw error;
  }
  try {
    return parseWorkspaceState(JSON.parse(content));
  } catch (error: unknown) {
    if (error instanceof JsTemplateCliError) throw error;
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.stateInvalid', { statePath }, {
        fallback: 'The JS Template workspace state at {{statePath}} is invalid.',
      }),
      { cause: error },
    );
  }
}

async function loadWorkspaceStateIfPresent(workspaceRoot: string): Promise<JsTemplateWorkspaceState | undefined> {
  const statePath = join(resolve(workspaceRoot), ...JS_TEMPLATE_STATE_PATH.split('/'));
  try {
    await assertWorkspacePathHasNoSymlinks(workspaceRoot, JS_TEMPLATE_STATE_PATH);
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

  let state: JsTemplateWorkspaceState | undefined;
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

function validatePulledFiles(files: readonly JsTemplatePulledFile[]): JsTemplateWorkspaceFile[] {
  const paths = new Set<string>();
  return files
    .map((file) => {
      const path = normalizeWorkspacePath(requireString(file.path, 'Pulled file path'));
      if (paths.has(path))
        throw new JsTemplateCliError(
          translateCli('commands.jsTemplate.errors.duplicatePullPath', { path }, {
            fallback: 'Pull response contains a duplicate path: {{path}}',
          }),
        );
      paths.add(path);
      if (file.encoding === 'base64') {
        throw new JsTemplateCliError(
          translateCli('commands.jsTemplate.errors.base64Unsupported', { path }, {
            fallback: 'Base64 or binary files are not supported by the first local Agent workflow: {{path}}.',
          }),
        );
      }
      if (typeof file.content !== 'string') {
        throw new JsTemplateCliError(
          translateCli('commands.jsTemplate.errors.pullUtf8Missing', { path }, {
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
  state: JsTemplateWorkspaceState,
  files: readonly JsTemplateWorkspaceFile[],
): Promise<void> {
  const root = resolve(workspaceRoot);
  const statePath = join(root, ...JS_TEMPLATE_STATE_PATH.split('/'));
  const baselineRoot = join(root, ...JS_TEMPLATE_BASELINE_PATH.split('/'));
  await assertWorkspacePathHasNoSymlinks(root);
  await assertWorkspacePathHasNoSymlinks(root, JS_TEMPLATE_BASELINE_PATH);
  await fs.rm(baselineRoot, { recursive: true, force: true });
  await fs.mkdir(baselineRoot, { recursive: true });
  await assertWorkspacePathHasNoSymlinks(root, JS_TEMPLATE_BASELINE_PATH);
  for (const file of files) {
    const target = join(baselineRoot, ...file.path.split('/'));
    const baselinePath = `${JS_TEMPLATE_BASELINE_PATH}/${file.path}`;
    await assertWorkspacePathHasNoSymlinks(root, baselinePath);
    await fs.mkdir(dirname(target), { recursive: true });
    await assertWorkspacePathHasNoSymlinks(root, baselinePath);
    await fs.writeFile(target, file.content, 'utf8');
  }
  await assertWorkspacePathHasNoSymlinks(root, JS_TEMPLATE_STATE_PATH);
  await fs.mkdir(dirname(statePath), { recursive: true });
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  await assertWorkspacePathHasNoSymlinks(root, `${JS_TEMPLATE_STATE_PATH}.${process.pid}.tmp`);
  await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await assertWorkspacePathHasNoSymlinks(root, JS_TEMPLATE_STATE_PATH);
  await fs.rename(temporaryPath, statePath);
}

export async function materializePulledWorkspace(options: {
  workspaceRoot: string;
  target: JsTemplateResolvedTarget;
  projectId: string;
  template: JsTemplateRecord;
  pull: JsTemplatePullResult;
  previousState?: JsTemplateWorkspaceState;
}): Promise<JsTemplateWorkspaceState> {
  if (options.pull.project.id !== options.projectId || options.template.projectId !== options.projectId) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.pullSelectionMismatch', undefined, {
        fallback: 'The selected project, template, and pull response do not match.',
      }),
    );
  }
  const files = validatePulledFiles(options.pull.files || []);
  const pulledPaths = new Set(files.map((file) => file.path));
  if (!pulledPaths.has(options.template.entryPath) || !pulledPaths.has(options.template.descriptorPath)) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.templateFilesMissing', undefined, {
        fallback:
          'The pulled project does not contain the selected template source and descriptor. Repair the project before using the local Agent workflow.',
      }),
      { details: { entryPath: options.template.entryPath, descriptorPath: options.template.descriptorPath } },
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
  const state: JsTemplateWorkspaceState = {
    version: 1,
    app: { apiBaseUrl: sanitizeApiBaseUrl(options.target.apiBaseUrl) },
    env: { name: options.target.envName },
    project: { id: options.pull.project.id, name: options.pull.project.name },
    template: {
      id: options.template.id,
      kind: options.template.kind,
      name: options.template.templateName,
      path: options.template.entryPath,
      descriptorPath: options.template.descriptorPath,
    },
    baseHeadCommitId: options.pull.project.headCommitId,
    files: fileStates,
  };
  await writeStateAndBaseline(root, state, files);
  return state;
}

export async function recordSuccessfulWorkspaceCheck(options: {
  workspaceRoot: string;
  state: JsTemplateWorkspaceState;
  files: readonly JsTemplateWorkspaceFile[];
}): Promise<JsTemplateWorkspaceState> {
  const localSnapshotId = buildWorkspaceSnapshotId(options.files);
  const state: JsTemplateWorkspaceState = {
    ...options.state,
    lastCheck: {
      localSnapshotId,
      baseHeadCommitId: options.state.baseHeadCommitId,
    },
  };
  const statePath = join(resolve(options.workspaceRoot), ...JS_TEMPLATE_STATE_PATH.split('/'));
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  await assertWorkspacePathHasNoSymlinks(options.workspaceRoot, JS_TEMPLATE_STATE_PATH);
  await assertWorkspacePathHasNoSymlinks(
    options.workspaceRoot,
    `${JS_TEMPLATE_STATE_PATH}.${process.pid}.tmp`,
  );
  await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await assertWorkspacePathHasNoSymlinks(options.workspaceRoot, JS_TEMPLATE_STATE_PATH);
  await fs.rename(temporaryPath, statePath);
  return state;
}

async function readBaselineContent(workspaceRoot: string, path: string): Promise<string> {
  const baselinePath = join(resolve(workspaceRoot), ...JS_TEMPLATE_BASELINE_PATH.split('/'), ...path.split('/'));
  try {
    await assertWorkspacePathHasNoSymlinks(workspaceRoot, `${JS_TEMPLATE_BASELINE_PATH}/${path}`);
    return await fs.readFile(baselinePath, 'utf8');
  } catch (error: unknown) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.baselineMissing', { path }, {
        fallback: 'The Pull baseline for {{path}} is missing. Pull the workspace again before saving.',
      }),
      { cause: error },
    );
  }
}

export async function assertWorkspaceBaselineIntegrity(
  workspaceRoot: string,
  state: JsTemplateWorkspaceState,
): Promise<void> {
  for (const [path, file] of Object.entries(state.files)) {
    const content = await readBaselineContent(workspaceRoot, path);
    const actualHash = sha256(content);
    if (actualHash !== file.hash) {
      throw new JsTemplateCliError(
        translateCli(
          'commands.jsTemplate.errors.baselineHashMismatch',
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
  state: JsTemplateWorkspaceState;
  files: readonly JsTemplateWorkspaceFile[];
}): Promise<JsTemplateWorkspaceDelta> {
  await assertWorkspaceBaselineIntegrity(options.workspaceRoot, options.state);
  const currentByPath = new Map(options.files.map((file) => [file.path, file]));
  const paths = new Set([...Object.keys(options.state.files), ...currentByPath.keys()]);
  const changes: JsTemplateWorkspaceDeltaFile[] = [];
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
  state: JsTemplateWorkspaceState,
  files: readonly JsTemplateWorkspaceFile[],
): string {
  const snapshotId = buildWorkspaceSnapshotId(files);
  if (
    !state.lastCheck ||
    state.lastCheck.localSnapshotId !== snapshotId ||
    state.lastCheck.baseHeadCommitId !== state.baseHeadCommitId
  ) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.checkRequired', undefined, {
        fallback:
          'The current local snapshot has not passed the authoritative workspace check. Run `nb js-template check` after the latest file change.',
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
  state: JsTemplateWorkspaceState;
  files: readonly JsTemplateWorkspaceFile[];
  result: JsTemplateSaveResult;
}): Promise<JsTemplateWorkspaceState> {
  if (options.result.project.id !== options.state.project.id) {
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.saveProjectMismatch', undefined, {
        fallback: 'Save response project does not match the local workspace.',
      }),
    );
  }
  const state: JsTemplateWorkspaceState = {
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
    throw new JsTemplateCliError(
      translateCli('commands.jsTemplate.errors.unsafeDirectory', { path: value }, {
        fallback: 'Refusing to use an unsafe workspace directory: {{path}}',
      }),
    );
  }
  return root;
}
