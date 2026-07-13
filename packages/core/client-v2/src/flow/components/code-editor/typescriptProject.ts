/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import type { Extension } from '@codemirror/state';
import { type Diagnostic, linter } from '@codemirror/lint';
import { type Tooltip, hoverTooltip } from '@codemirror/view';
import { buildRunJSTypeScriptEnvironmentFiles } from '@nocobase/runjs/client-v2';

import { runJSTypeScriptLibSources } from './runJSTypeScriptLibSources';

export interface CodeEditorTypeScriptFile {
  path: string;
  content: string;
}

export interface CodeEditorTypeScriptProject {
  currentFilePath: string;
  files: CodeEditorTypeScriptFile[];
  declarationFiles?: CodeEditorTypeScriptFile[];
  compilerOptions?: Partial<import('typescript').CompilerOptions>;
  runJSContext?: {
    modelUse?: string;
  };
}

export interface CodeEditorTypeScriptProjectRef {
  current?: CodeEditorTypeScriptProject;
}

type TypeScriptModule = typeof import('typescript');
type TypeScriptLanguageService = import('typescript').LanguageService;
type TypeScriptCompilerOptions = import('typescript').CompilerOptions;
type TypeScriptDiagnostic = import('typescript').Diagnostic;
type TypeScriptCompletionEntry = import('typescript').CompletionEntry;
type TypeScriptCompletionEntryDetails = import('typescript').CompletionEntryDetails;
type TypeScriptUserPreferences = import('typescript').UserPreferences;
type TypeScriptFormatCodeSettings = import('typescript').FormatCodeSettings;
type TypeScriptTextChange = import('typescript').TextChange;

type VirtualFile = {
  fileName: string;
  path: string;
  content: string;
};

type CodeMirrorTextChange = {
  from: number;
  insert: string;
  to: number;
};

type ProjectService = {
  currentFileName: string;
  files: Map<string, VirtualFile>;
  service: TypeScriptLanguageService;
  signature: string;
  ts: TypeScriptModule;
};

const RUNJS_ENV_FILE_NAME = '/__runjs__/runjs-env.d.ts';
const runJSTypeScriptEnvironmentFiles = buildRunJSTypeScriptEnvironmentFiles(runJSTypeScriptLibSources);

const runJSEnvDeclaration = `
interface RunJSLogger {
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  child(bindings: Record<string, unknown>): RunJSLogger;
}
interface RunJSUnknownObject {
  [key: string]: unknown;
}
interface RunJSRecord extends RunJSUnknownObject {
  id?: string | number;
}
interface RunJSCollection extends RunJSUnknownObject {
  name?: string;
  dataSourceKey?: string;
}
interface RunJSCollectionField extends RunJSUnknownObject {
  name?: string;
  type?: string;
  interface?: string;
}
interface RunJSRef<T> {
  readonly current: T | null;
}
interface RunJSModel extends RunJSUnknownObject {
  readonly uid: string;
  readonly use?: string;
  readonly props?: RunJSUnknownObject;
}
interface RunJSForm extends RunJSUnknownObject {
  getFieldValue(name: string | Array<string | number>): unknown;
  getFieldsValue(): Record<string, unknown>;
  setFieldValue(name: string | Array<string | number>, value: unknown): void;
  setFieldsValue(values: Record<string, unknown>): void;
}
interface RunJSI18n {
  readonly language?: string;
  t(key: string, options?: Record<string, unknown>): string;
  exists(key: string, options?: Record<string, unknown>): boolean;
}
interface RunJSMessage {
  info(content: unknown, duration?: number): void;
  success(content: unknown, duration?: number): void;
  error(content: unknown, duration?: number): void;
  warning(content: unknown, duration?: number): void;
  loading(content: unknown, duration?: number): void;
  open(config: Record<string, unknown>): void;
  destroy(key?: string): void;
}
interface RunJSNotification {
  open(config: Record<string, unknown>): void;
  success(config: Record<string, unknown>): void;
  info(config: Record<string, unknown>): void;
  warning(config: Record<string, unknown>): void;
  error(config: Record<string, unknown>): void;
  destroy(key?: string): void;
}
interface RunJSModal {
  info(config: Record<string, unknown>): unknown;
  success(config: Record<string, unknown>): unknown;
  error(config: Record<string, unknown>): unknown;
  warning(config: Record<string, unknown>): unknown;
  confirm(config: Record<string, unknown>): unknown;
}
interface RunJSResource extends RunJSUnknownObject {
  readonly selectedRows?: RunJSRecord[];
  readonly pagination?: RunJSUnknownObject;
  getData?(): unknown;
  setData?(value: unknown): RunJSResource;
  getSelectedRows?(): RunJSRecord[];
  setResourceName?(resourceName: string): RunJSResource;
  setFilterByTk?(filterByTk: unknown): RunJSResource;
  runAction?(action: string, options?: Record<string, unknown>): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  off?(event: string, callback: (...args: unknown[]) => void): void;
  refresh?: () => Promise<unknown>;
}
interface RunJSApi {
  readonly auth?: {
    readonly locale?: string;
    readonly role?: string;
    readonly token?: string;
  };
  request<T = unknown>(options: Record<string, unknown>): Promise<T>;
  resource(name: string): RunJSResource;
}
interface RunJSAuth {
  readonly roleName?: string;
  readonly locale?: string;
  readonly token?: string;
  readonly user?: RunJSRecord;
}
interface RunJSViewer {
  dialog(props: Record<string, unknown>): unknown;
  drawer(props: Record<string, unknown>): unknown;
  popover(props: Record<string, unknown>): unknown;
  embed(props: Record<string, unknown>): unknown;
}
interface RunJSPopup extends RunJSUnknownObject {
  readonly uid?: string;
  readonly record?: RunJSRecord;
  readonly sourceRecord?: RunJSRecord;
  readonly parent?: RunJSPopup;
  readonly resource?: RunJSUnknownObject;
}
interface RunJSSQL {
  run(sql: string, options?: Record<string, unknown>): Promise<unknown>;
  save(data: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;
  runById(uid: string, options?: Record<string, unknown>): Promise<unknown>;
  destroy(uid: string): Promise<void>;
}
interface RunJSURLSearchParams {
  readonly [name: string]: string | string[] | undefined;
}
interface RunJSDayjsValue {
  format(template?: string): string;
  toISOString(): string;
  valueOf(): number;
}
interface RunJSDayjs {
  (value?: unknown): RunJSDayjsValue;
}
interface RunJSReactRoot {
  render(value: unknown): void;
  unmount(): void;
}
interface RunJSReactDOM {
  createRoot(container: unknown, options?: Record<string, unknown>): RunJSReactRoot;
}
interface RunJSAntd {
  readonly [componentName: string]: React.FC<Record<string, unknown>>;
}
interface RunJSSourceInfo {
  readonly sourceMode: string;
  readonly sourceBinding?: RunJSUnknownObject;
  readonly sourceMap?: string;
  readonly context?: RunJSUnknownObject;
}
interface RunJSExecutionResult<T = unknown> {
  readonly success: boolean;
  readonly value?: T;
  readonly error?: unknown;
  readonly timeout?: boolean;
}
type RunJSSafeElement = RunJSDOM.HTMLElement;
interface RunJSContext {
  logger: RunJSLogger;
  api: RunJSApi;
  React: typeof React;
  ReactDOM: RunJSReactDOM;
  antd: RunJSAntd;
  dayjs: RunJSDayjs;
  i18n: RunJSI18n;
  message: RunJSMessage;
  notification: RunJSNotification;
  modal: RunJSModal;
  viewer: RunJSViewer;
  popup?: RunJSPopup;
  resource?: RunJSResource;
  sql: RunJSSQL;
  auth?: RunJSAuth;
  role?: string | string[];
  token?: string;
  urlSearchParams?: RunJSURLSearchParams;
  libs: {
    React: typeof React;
    ReactDOM: RunJSReactDOM;
    antd: RunJSAntd;
    dayjs: RunJSDayjs;
    [libraryName: string]: unknown;
  };
  locale?: string;
  user?: RunJSRecord;
  themeToken?: RunJSUnknownObject;
  ref: RunJSRef<RunJSSafeElement>;
  model: RunJSModel;
  render(value: unknown, container?: RunJSSafeElement): void;
  onRefReady(ref: RunJSRef<RunJSSafeElement>, callback: (element: RunJSSafeElement) => void, timeout?: number): void;
  getVar<T = unknown>(path: string): Promise<T>;
  getVarInfos(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  getApiInfos(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  getEnvInfos(): Promise<Record<string, unknown>>;
  getModel(uid: string, searchInPreviousEngines?: boolean): RunJSUnknownObject | undefined;
  request<T = unknown>(options: Record<string, unknown>): Promise<T>;
  runjs<T = unknown>(
    code: string,
    variables?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<RunJSExecutionResult<T>>;
  loadCSS(href: string): Promise<void>;
  openView(uid: string, options?: Record<string, unknown>): Promise<unknown>;
  requireAsync(url: string): Promise<unknown>;
  importAsync(url: string): Promise<unknown>;
  makeResource(type: unknown): RunJSResource;
  createResource(type: unknown): RunJSResource;
  initResource(type: string): RunJSResource;
  resolveJsonTemplate<T = unknown>(template: T): Promise<T>;
  runAction(name: string, params?: Record<string, unknown>): Promise<unknown> | unknown;
  previewRunJS(code: string, version?: string): Promise<{ success: boolean; message: string }>;
  t(key: string, options?: Record<string, unknown>): string;
  view?: RunJSUnknownObject;
  data?: RunJSUnknownObject;
  app?: RunJSUnknownObject;
  event?: RunJSUnknownObject;
}
declare const ctx: RunJSContext;
declare const console: RunJSLogger;

declare namespace React {
  type Key = string | number;
  type ReactNode = unknown;
  type CSSProperties = Record<string, string | number | undefined>;
  interface Attributes {
    key?: Key;
  }
  interface HTMLAttributes<T = unknown> extends Attributes {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    onClick?: (event: unknown) => void;
  }
  type FC<P = Record<string, unknown>> = (props: P & { children?: ReactNode }) => ReactNode;
  function createElement(type: unknown, props?: Record<string, unknown> | null, ...children: ReactNode[]): ReactNode;
  const Fragment: unknown;
}
declare const React: {
  createElement: typeof React.createElement;
  Fragment: typeof React.Fragment;
};
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>;
  }
}
declare module 'react' {
  export = React;
  export as namespace React;
}
declare module 'antd' {
  import React = require('react');
  export const Alert: React.FC<Record<string, unknown>>;
  export const Button: React.FC<Record<string, unknown>>;
  export const Card: React.FC<Record<string, unknown>>;
  export const Col: React.FC<Record<string, unknown>>;
  export const DatePicker: React.FC<Record<string, unknown>>;
  export const Divider: React.FC<Record<string, unknown>>;
  export const Form: React.FC<Record<string, unknown>>;
  export const Input: React.FC<Record<string, unknown>>;
  export const List: React.FC<Record<string, unknown>>;
  export const Modal: React.FC<Record<string, unknown>>;
  export const Row: React.FC<Record<string, unknown>>;
  export const Select: React.FC<Record<string, unknown>>;
  export const Space: React.FC<Record<string, unknown>>;
  export const Table: React.FC<Record<string, unknown>>;
  export const Tag: React.FC<Record<string, unknown>>;
  export const Typography: Record<string, React.FC<Record<string, unknown>>>;
  export const message: {
    success(content: unknown): void;
    error(content: unknown): void;
    warning(content: unknown): void;
    info(content: unknown): void;
  };
}
`;

const runJSSourceRuntimeDeclaration = `
interface RunJSContext {
  settings: Record<string, unknown>;
  runJsSource: RunJSSourceInfo;
}
`;

const genericRunJSContextDeclaration = `
interface RunJSContext {
  element?: RunJSSafeElement;
  value?: unknown;
  record?: RunJSRecord;
  collection?: RunJSCollection;
  collectionField?: RunJSCollectionField;
  form?: RunJSForm;
  formValues?: Record<string, unknown>;
  namePath?: Array<string | number>;
  disabled?: boolean;
  readOnly?: boolean;
  item?: RunJSUnknownObject;
  filterByTk?: string | number;
  recordIndex?: number;
  settings?: Record<string, unknown>;
  runJsSource?: RunJSSourceInfo;
  getValue?(): unknown;
  setValue?(value: unknown): void;
  setProps?(fieldModel: unknown, props: Record<string, unknown>): void;
  refresh?(): Promise<void>;
}
`;

const runJSContextModelDeclarations: Record<string, string> = {
  JSBlockModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value?: unknown;
  record?: RunJSRecord;
}
`,
  JSFieldModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value: unknown;
  record?: RunJSRecord;
  collection?: RunJSCollection;
  collectionField?: RunJSCollectionField;
}
`,
  JSEditableFieldModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value: unknown;
  record?: RunJSRecord;
  collectionField?: RunJSCollectionField;
  form?: RunJSForm;
  formValues?: Record<string, unknown>;
  namePath?: Array<string | number>;
  disabled: boolean;
  readOnly: boolean;
  getValue(): unknown;
  setValue(value: unknown): void;
}
`,
  JSItemModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  record?: RunJSRecord;
  resource?: RunJSResource;
  formValues?: Record<string, unknown>;
  item?: RunJSUnknownObject;
}
`,
  JSItemActionModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  record?: RunJSRecord;
  resource?: RunJSResource;
  formValues?: Record<string, unknown>;
  item?: RunJSUnknownObject;
}
`,
  JSColumnModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value: unknown;
  record?: RunJSRecord;
  recordIndex: number;
  collection?: RunJSCollection;
  collectionField?: RunJSCollectionField;
}
`,
  FormJSFieldItemModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value: unknown;
  record?: RunJSRecord;
  formValues?: Record<string, unknown>;
  setProps(fieldModel: unknown, props: Record<string, unknown>): void;
}
`,
  JSRecordActionModel: `
interface RunJSContext {
  record: RunJSRecord;
  filterByTk: string | number;
}
`,
  JSCollectionActionModel: `
interface RunJSContext {}
`,
  JSFormActionModel: `
interface RunJSContext {
  form?: RunJSForm;
  resource?: RunJSResource;
  refresh(): Promise<void>;
}
`,
  FilterFormJSActionModel: `
interface RunJSContext {
  form?: RunJSForm;
  formValues?: Record<string, unknown>;
}
`,
  JSActionModel: `
interface RunJSContext {}
`,
};

const runJSSourceRuntimeModelUses = new Set([
  'FilterFormJSActionModel',
  'FormJSFieldItemModel',
  'JSActionModel',
  'JSBlockModel',
  'JSCollectionActionModel',
  'JSColumnModel',
  'JSEditableFieldModel',
  'JSFieldModel',
  'JSFormActionModel',
  'JSItemActionModel',
  'JSItemModel',
  'JSRecordActionModel',
]);

function buildRunJSEnvDeclaration(modelUse?: string): string {
  const modelDeclaration = (modelUse && runJSContextModelDeclarations[modelUse]) || genericRunJSContextDeclaration;
  const sourceRuntimeDeclaration =
    modelUse && runJSSourceRuntimeModelUses.has(modelUse) ? runJSSourceRuntimeDeclaration : '';
  return [runJSEnvDeclaration, sourceRuntimeDeclaration, modelDeclaration].filter(Boolean).join('\n');
}

let typeScriptModulePromise: Promise<TypeScriptModule> | null = null;
let cachedProjectService: ProjectService | null = null;

async function loadTypeScript(): Promise<TypeScriptModule> {
  if (!typeScriptModulePromise) {
    typeScriptModulePromise = import('typescript');
  }
  return await typeScriptModulePromise;
}

function normalizeProjectPath(path: string): string {
  const normalized = String(path || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .trim();
  return normalized || 'main.tsx';
}

function normalizeFileName(fileName: string): string {
  const normalized = String(fileName || '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized.replace(/^\/+/, '')}`;
}

function toFileName(path: string): string {
  return `/${normalizeProjectPath(path)}`;
}

function getScriptKind(ts: TypeScriptModule, fileName: string): import('typescript').ScriptKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (lower.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (lower.endsWith('.js')) return ts.ScriptKind.JS;
  if (lower.endsWith('.json')) return ts.ScriptKind.JSON;
  return ts.ScriptKind.TS;
}

function defaultCompilerOptions(ts: TypeScriptModule): TypeScriptCompilerOptions {
  return {
    allowJs: true,
    allowNonTsExtensions: true,
    allowSyntheticDefaultImports: true,
    checkJs: false,
    esModuleInterop: true,
    jsx: ts.JsxEmit.React,
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    types: [],
  };
}

function createFiles(project: CodeEditorTypeScriptProject, currentFileContent?: string): Map<string, VirtualFile> {
  const files = new Map<string, VirtualFile>();
  const addFile = (file: CodeEditorTypeScriptFile) => {
    const path = normalizeProjectPath(file.path);
    const fileName = toFileName(path);
    files.set(fileName, {
      content: String(file.content ?? ''),
      fileName,
      path,
    });
  };

  for (const file of Array.isArray(project.files) ? project.files : []) {
    addFile(file);
  }
  for (const file of Array.isArray(project.declarationFiles) ? project.declarationFiles : []) {
    addFile(file);
  }
  for (const file of runJSTypeScriptEnvironmentFiles) {
    addFile(file);
  }

  files.set(RUNJS_ENV_FILE_NAME, {
    content: buildRunJSEnvDeclaration(project.runJSContext?.modelUse),
    fileName: RUNJS_ENV_FILE_NAME,
    path: RUNJS_ENV_FILE_NAME.slice(1),
  });

  const currentFileName = toFileName(project.currentFilePath);
  if (typeof currentFileContent === 'string') {
    const currentFile = files.get(currentFileName);
    files.set(currentFileName, {
      content: currentFileContent,
      fileName: currentFileName,
      path: currentFile?.path || normalizeProjectPath(project.currentFilePath),
    });
  }

  return files;
}

function createProjectSignature(
  project: CodeEditorTypeScriptProject,
  currentFileContent: string | undefined,
  compilerOptions: TypeScriptCompilerOptions,
  files: Map<string, VirtualFile>,
): string {
  const fileSignature = Array.from(files.values())
    .sort((left, right) => left.fileName.localeCompare(right.fileName))
    .map((file) => `${file.fileName}\u0000${file.content}`)
    .join('\u0001');
  return [
    toFileName(project.currentFilePath),
    typeof currentFileContent === 'string' ? 'inline' : 'project',
    JSON.stringify(compilerOptions),
    fileSignature,
  ].join('\u0002');
}

function isInsideDirectory(fileName: string, directoryName: string): boolean {
  const normalizedFile = normalizeFileName(fileName);
  const normalizedDirectory = normalizeFileName(directoryName).replace(/\/$/, '');
  return normalizedFile === normalizedDirectory || normalizedFile.startsWith(`${normalizedDirectory}/`);
}

async function getProjectService(
  project: CodeEditorTypeScriptProject,
  currentFileContent?: string,
): Promise<ProjectService> {
  const ts = await loadTypeScript();
  const compilerOptions = {
    ...defaultCompilerOptions(ts),
    ...(project.compilerOptions || {}),
  };
  const files = createFiles(project, currentFileContent);
  const currentFileName = toFileName(project.currentFilePath);
  const signature = createProjectSignature(project, currentFileContent, compilerOptions, files);

  if (cachedProjectService?.signature === signature) {
    return cachedProjectService;
  }

  const getFile = (fileName: string): VirtualFile | undefined => files.get(normalizeFileName(fileName));
  const moduleResolutionHost: import('typescript').ModuleResolutionHost = {
    fileExists(fileName) {
      return Boolean(getFile(fileName));
    },
    readFile(fileName) {
      return getFile(fileName)?.content;
    },
  };

  const host: import('typescript').LanguageServiceHost = {
    directoryExists(directoryName) {
      const normalizedDirectory = normalizeFileName(directoryName).replace(/\/$/, '');
      return Array.from(files.keys()).some((fileName) => isInsideDirectory(fileName, normalizedDirectory));
    },
    fileExists(fileName) {
      return Boolean(getFile(fileName));
    },
    getCompilationSettings() {
      return compilerOptions;
    },
    getCurrentDirectory() {
      return '/';
    },
    getDefaultLibFileName() {
      return 'lib.d.ts';
    },
    getDirectories(directoryName) {
      const normalizedDirectory = normalizeFileName(directoryName).replace(/\/$/, '');
      const directories = new Set<string>();
      for (const fileName of files.keys()) {
        if (!isInsideDirectory(fileName, normalizedDirectory)) continue;
        const relative = fileName.slice(normalizedDirectory.length).replace(/^\/+/, '');
        const first = relative.split('/')[0];
        if (first && relative.includes('/')) {
          directories.add(first);
        }
      }
      return Array.from(directories);
    },
    getScriptFileNames() {
      return Array.from(files.keys());
    },
    getScriptKind(fileName) {
      return getScriptKind(ts, fileName);
    },
    getScriptSnapshot(fileName) {
      const file = getFile(fileName);
      return file ? ts.ScriptSnapshot.fromString(file.content) : undefined;
    },
    getScriptVersion(fileName) {
      const file = getFile(fileName);
      return file ? String(file.content.length) : '0';
    },
    readDirectory(directoryName, extensions) {
      const normalizedDirectory = normalizeFileName(directoryName).replace(/\/$/, '');
      const allowedExtensions = Array.isArray(extensions) ? new Set(extensions) : null;
      return Array.from(files.keys()).filter((fileName) => {
        if (!isInsideDirectory(fileName, normalizedDirectory)) return false;
        if (!allowedExtensions) return true;
        return Array.from(allowedExtensions).some((extension) => fileName.endsWith(extension));
      });
    },
    readFile(fileName) {
      return getFile(fileName)?.content;
    },
    resolveModuleNames(moduleNames, containingFile) {
      return moduleNames.map((moduleName) => {
        const resolved = ts.resolveModuleName(moduleName, containingFile, compilerOptions, moduleResolutionHost);
        return resolved.resolvedModule;
      });
    },
    useCaseSensitiveFileNames() {
      return true;
    },
  };

  const service = ts.createLanguageService(host, ts.createDocumentRegistry());
  cachedProjectService = {
    currentFileName,
    files,
    service,
    signature,
    ts,
  };
  return cachedProjectService;
}

function getWordRange(context: CompletionContext): { from: number; to: number } | null {
  const word = context.matchBefore(/[$_\p{Letter}][$_\p{Letter}\p{Number}]*/u);
  if (word) {
    return { from: word.from, to: word.to };
  }

  if (!context.explicit) {
    return null;
  }

  const prevChar = context.pos > 0 ? context.state.doc.sliceString(context.pos - 1, context.pos) : '';
  if (prevChar === '.') {
    return { from: context.pos, to: context.pos };
  }

  return { from: context.pos, to: context.pos };
}

function getCompletionType(kind: string): Completion['type'] {
  switch (kind) {
    case 'class':
      return 'class';
    case 'const':
      return 'constant';
    case 'enum':
      return 'enum';
    case 'function':
      return 'function';
    case 'interface':
      return 'interface';
    case 'keyword':
      return 'keyword';
    case 'let':
    case 'var':
    case 'variable':
      return 'variable';
    case 'method':
      return 'method';
    case 'module':
      return 'namespace';
    case 'property':
    case 'getter':
    case 'setter':
      return 'property';
    case 'type':
      return 'type';
    default:
      return 'variable';
  }
}

function getSourceDisplay(ts: TypeScriptModule, entry: TypeScriptCompletionEntry): string | undefined {
  const source = typeof entry.source === 'string' ? entry.source : '';
  if (source) {
    return source;
  }
  const display = entry.sourceDisplay ? ts.displayPartsToString(entry.sourceDisplay) : '';
  return display || undefined;
}

function getCompletionDetails(
  projectService: ProjectService,
  position: number,
  entry: TypeScriptCompletionEntry,
  preferences: TypeScriptUserPreferences,
  formatOptions: TypeScriptFormatCodeSettings,
): TypeScriptCompletionEntryDetails | undefined {
  try {
    return projectService.service.getCompletionEntryDetails(
      projectService.currentFileName,
      position,
      entry.name,
      formatOptions,
      entry.source,
      preferences,
      entry.data,
    );
  } catch (_) {
    return undefined;
  }
}

function textChangeToChangeSpec(change: TypeScriptTextChange): CodeMirrorTextChange {
  return {
    from: change.span.start,
    insert: change.newText,
    to: change.span.start + change.span.length,
  };
}

function buildCompletionChanges(
  projectService: ProjectService,
  details: TypeScriptCompletionEntryDetails | undefined,
  label: string,
  from: number,
  to: number,
): CodeMirrorTextChange[] {
  const changes: CodeMirrorTextChange[] = [];
  const seen = new Set<string>();

  for (const action of details?.codeActions || []) {
    for (const change of action.changes || []) {
      if (normalizeFileName(change.fileName) !== projectService.currentFileName) {
        continue;
      }
      for (const textChange of change.textChanges || []) {
        const next = textChangeToChangeSpec(textChange);
        const nextFrom = typeof next.from === 'number' ? next.from : 0;
        const nextTo = typeof next.to === 'number' ? next.to : nextFrom;
        if (nextFrom < to && nextTo > from) {
          continue;
        }
        const key = `${nextFrom}:${nextTo}:${String(next.insert ?? '')}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        changes.push(next);
      }
    }
  }

  changes.push({ from, insert: label, to });
  changes.sort((left, right) => {
    const leftFrom = typeof left.from === 'number' ? left.from : 0;
    const rightFrom = typeof right.from === 'number' ? right.from : 0;
    return leftFrom - rightFrom;
  });
  return changes;
}

function getSelectionAnchorAfterChanges(changes: CodeMirrorTextChange[], from: number, label: string): number {
  const deltaBeforeTarget = changes.reduce((sum, change) => {
    const changeFrom = change.from;
    const changeTo = change.to;
    if (changeTo > from) {
      return sum;
    }
    return sum + change.insert.length - (changeTo - changeFrom);
  }, 0);
  return from + deltaBeforeTarget + label.length;
}

function createCompletionApply(
  projectService: ProjectService,
  position: number,
  entry: TypeScriptCompletionEntry,
  label: string,
  preferences: TypeScriptUserPreferences,
  formatOptions: TypeScriptFormatCodeSettings,
): Completion['apply'] {
  return (view, _completion, from, to) => {
    const details = getCompletionDetails(projectService, position, entry, preferences, formatOptions);
    const changes = buildCompletionChanges(projectService, details, label, from, to);
    view.dispatch({
      changes,
      scrollIntoView: true,
      selection: { anchor: getSelectionAnchorAfterChanges(changes, from, label) },
    });
  };
}

function completionEntryToCodeMirrorCompletion(
  projectService: ProjectService,
  position: number,
  entry: TypeScriptCompletionEntry,
  preferences: TypeScriptUserPreferences,
  formatOptions: TypeScriptFormatCodeSettings,
): Completion {
  const source = getSourceDisplay(projectService.ts, entry);
  const detail = source ? `Auto import from ${source}` : entry.kind;
  return {
    apply: createCompletionApply(projectService, position, entry, entry.name, preferences, formatOptions),
    boost: source ? 120 : 20,
    detail,
    info: entry.kindModifiers || detail,
    label: entry.name,
    type: getCompletionType(entry.kind),
  };
}

export async function getTypeScriptCompletionResult(
  project: CodeEditorTypeScriptProject,
  position: number,
  currentFileContent?: string,
  explicit = false,
): Promise<CompletionResult | null> {
  const projectService = await getProjectService(project, currentFileContent);
  const preferences: TypeScriptUserPreferences = {
    allowIncompleteCompletions: true,
    includeCompletionsForModuleExports: true,
    includeCompletionsWithInsertText: true,
    includePackageJsonAutoImports: 'off',
    importModuleSpecifierPreference: 'relative',
  };
  const formatOptions: TypeScriptFormatCodeSettings = {
    convertTabsToSpaces: true,
    indentSize: 2,
    newLineCharacter: '\n',
    tabSize: 2,
  };
  const completions = projectService.service.getCompletionsAtPosition(projectService.currentFileName, position, {
    ...preferences,
  });

  if (!completions?.entries?.length) {
    return null;
  }

  const replacementSpan = completions.optionalReplacementSpan || completions.entries[0]?.replacementSpan;
  const from = replacementSpan?.start ?? position;
  const to = replacementSpan ? replacementSpan.start + replacementSpan.length : position;
  const options = completions.entries.map((entry) =>
    completionEntryToCodeMirrorCompletion(projectService, position, entry, preferences, formatOptions),
  );

  return {
    from,
    options,
    to,
    validFor: explicit ? undefined : /^[$_\p{Letter}\p{Number}]*$/u,
  };
}

export function createTypeScriptCompletionSource(options: {
  projectRef?: CodeEditorTypeScriptProjectRef;
}): CompletionSource {
  const { projectRef } = options;

  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const project = projectRef?.current;
    if (!project) {
      return null;
    }

    const range = getWordRange(context);
    if (!range) {
      return null;
    }

    try {
      const result = await getTypeScriptCompletionResult(
        project,
        context.pos,
        context.state.doc.toString(),
        context.explicit,
      );
      if (!result) {
        return null;
      }
      return {
        ...result,
        from: result.from === context.pos ? range.from : result.from,
        to: result.to === context.pos ? range.to : result.to,
      };
    } catch (_) {
      return null;
    }
  };
}

function flattenDiagnosticMessage(ts: TypeScriptModule, diagnostic: TypeScriptDiagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
}

function diagnosticCategoryToSeverity(ts: TypeScriptModule, diagnostic: TypeScriptDiagnostic): Diagnostic['severity'] {
  if (diagnostic.category === ts.DiagnosticCategory.Error) {
    return 'error';
  }
  if (diagnostic.category === ts.DiagnosticCategory.Warning) {
    return 'warning';
  }
  return 'info';
}

export async function getTypeScriptProjectDiagnostics(
  project: CodeEditorTypeScriptProject,
  currentFileContent?: string,
): Promise<Diagnostic[]> {
  const projectService = await getProjectService(project, currentFileContent);
  const syntax = projectService.service.getSyntacticDiagnostics(projectService.currentFileName);
  const semantic = projectService.service.getSemanticDiagnostics(projectService.currentFileName);
  const suggestions = projectService.service.getSuggestionDiagnostics(projectService.currentFileName);
  return [...syntax, ...semantic, ...suggestions]
    .filter((diagnostic) => typeof diagnostic.start === 'number')
    .map((diagnostic) => {
      const from = Math.max(0, diagnostic.start || 0);
      const length = Math.max(1, diagnostic.length || 1);
      return {
        from,
        message: flattenDiagnosticMessage(projectService.ts, diagnostic),
        severity: diagnosticCategoryToSeverity(projectService.ts, diagnostic),
        source: 'TypeScript',
        to: from + length,
      };
    });
}

export function createTypeScriptProjectLinter(options: { projectRef?: CodeEditorTypeScriptProjectRef }): Extension {
  const { projectRef } = options;

  return linter(async (view) => {
    const project = projectRef?.current;
    if (!project) {
      return [];
    }

    try {
      return await getTypeScriptProjectDiagnostics(project, view.state.doc.toString());
    } catch (_) {
      return [];
    }
  });
}

function createHoverTooltip(message: string, detail?: string): Tooltip['create'] {
  return () => {
    const dom = document.createElement('div');
    dom.style.maxWidth = '420px';
    dom.style.padding = '6px 8px';
    dom.style.whiteSpace = 'pre-wrap';
    dom.textContent = detail ? `${message}\n\n${detail}` : message;
    return { dom };
  };
}

export function createTypeScriptHoverTooltip(options: { projectRef?: CodeEditorTypeScriptProjectRef }): Extension {
  const { projectRef } = options;

  return hoverTooltip(async (view, position) => {
    const project = projectRef?.current;
    if (!project) {
      return null;
    }

    try {
      const projectService = await getProjectService(project, view.state.doc.toString());
      const quickInfo = projectService.service.getQuickInfoAtPosition(projectService.currentFileName, position);
      if (!quickInfo) {
        return null;
      }

      const message = projectService.ts.displayPartsToString(quickInfo.displayParts || []);
      const detail = projectService.ts.displayPartsToString(quickInfo.documentation || []);
      const from = quickInfo.textSpan?.start ?? position;
      const to = quickInfo.textSpan ? quickInfo.textSpan.start + quickInfo.textSpan.length : position;
      return {
        create: createHoverTooltip(message, detail),
        end: to,
        pos: from,
      };
    } catch (_) {
      return null;
    }
  });
}
