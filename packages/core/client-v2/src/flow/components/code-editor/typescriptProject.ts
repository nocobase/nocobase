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
import {
  buildRunJSTypeScriptContextDeclaration,
  buildRunJSTypeScriptEnvironmentFiles,
  collectRunJSTypeLibraryUsage,
  createRunJSTypeScriptCompilerOptions,
  type RunJSTypeLibraryPack,
  RUNJS_TYPESCRIPT_CONTEXT_PATH,
} from '@nocobase/runjs/client-v2';

import { runJSTypeScriptLibSources } from './runJSTypeScriptLibSources';
import { ensureGeneratedRunJSTypeLibraryPackLoadersRegistered } from './type-packs';
import { getDefaultRunJSTypeLibraryRegistry, type RunJSTypeLibraryRegistry } from './typescriptLibraryRegistry';
import {
  clearTypeScriptImmutableFileCacheForTests,
  getTypeScriptImmutableFileCacheDebugState,
  TypeScriptImmutableFileConflictError,
  TypeScriptVirtualFileSystem,
  type TypeScriptVirtualFileInput,
} from './typescriptVirtualFileSystem';

export interface CodeEditorTypeScriptFile {
  path: string;
  content: string;
}

export interface CodeEditorTypeScriptProject {
  currentFilePath: string;
  files: CodeEditorTypeScriptFile[];
  declarationFiles?: CodeEditorTypeScriptFile[];
  typeLibraryIds?: string[];
  typeLibraryRegistry?: RunJSTypeLibraryRegistry;
  compilerOptions?: Partial<import('typescript').CompilerOptions>;
  runJSContext?: {
    modelUse?: string;
    globalContextType?: string;
  };
  onInternalError?: (error: CodeEditorTypeScriptProjectInternalError) => void;
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

type CodeMirrorTextChange = {
  from: number;
  insert: string;
  to: number;
};

type ProjectService = {
  currentFileName: string;
  compilerOptions: TypeScriptCompilerOptions;
  fileSystem: TypeScriptVirtualFileSystem;
  service: TypeScriptLanguageService;
  structureKey: string;
  ts: TypeScriptModule;
};

export type CodeEditorTypeScriptProjectInternalErrorCode = 'TYPE_LIBRARY_LOAD_FAILED' | 'TYPE_LIBRARY_FILE_CONFLICT';

export interface CodeEditorTypeScriptProjectInternalError {
  cause: unknown;
  code: CodeEditorTypeScriptProjectInternalErrorCode;
  message: string;
  packIds: readonly string[];
}

export interface CodeEditorTypeScriptProjectDebugState {
  allFileNames: string[];
  disposed: boolean;
  fileVersions: Record<string, string>;
  immutableFileCount: number;
  immutableSnapshotCreationCount: number;
  languageServiceCreationCount: number;
  rootFileNames: string[];
  structureKey?: string;
}

export interface CodeEditorTypeScriptProjectSession {
  dispose(): void;
  getCompletionResult(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
    explicit?: boolean,
  ): Promise<CompletionResult | null>;
  getDebugState(): CodeEditorTypeScriptProjectDebugState;
  getDiagnostics(project: CodeEditorTypeScriptProject, currentFileContent?: string): Promise<Diagnostic[]>;
  getHover(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
  ): Promise<TypeScriptQuickInfoResult | null>;
  getLastInternalError(): CodeEditorTypeScriptProjectInternalError | null;
}

type TypeScriptQuickInfoResult = {
  detail: string;
  from: number;
  message: string;
  to: number;
};

type PreparedProject = {
  compilerOptions: TypeScriptCompilerOptions;
  currentFileName: string;
  files: TypeScriptVirtualFileInput[];
  packIds: string[];
  structureKey: string;
  ts: TypeScriptModule;
};

class TypeScriptLibraryLoadingError extends Error {
  constructor(
    readonly packIds: readonly string[],
    readonly cause: unknown,
  ) {
    super('Failed to load RunJS TypeScript library packs.');
    this.name = 'TypeScriptLibraryLoadingError';
  }
}

const runJSTypeScriptEnvironmentFiles = buildRunJSTypeScriptEnvironmentFiles(runJSTypeScriptLibSources);

let typeScriptModulePromise: Promise<TypeScriptModule> | null = null;
let sharedDocumentRegistry: import('typescript').DocumentRegistry | null = null;

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

function isInsideDirectory(fileName: string, directoryName: string): boolean {
  const normalizedFile = normalizeFileName(fileName);
  const normalizedDirectory = normalizeFileName(directoryName).replace(/\/$/, '');
  return normalizedFile === normalizedDirectory || normalizedFile.startsWith(`${normalizedDirectory}/`);
}

function mergeFileInput(files: Map<string, TypeScriptVirtualFileInput>, input: TypeScriptVirtualFileInput): void {
  const fileName = normalizeFileName(input.fileName);
  const existing = files.get(fileName);
  if (!existing) {
    files.set(fileName, { ...input, fileName });
    return;
  }
  if (existing.content !== input.content) {
    throw new TypeScriptImmutableFileConflictError(
      fileName,
      existing.contentHash || 'mutable',
      input.contentHash || 'mutable',
    );
  }
  files.set(fileName, {
    ...existing,
    immutable: existing.immutable || input.immutable,
    root: existing.root || input.root,
  });
}

function addProjectFile(
  files: Map<string, TypeScriptVirtualFileInput>,
  file: CodeEditorTypeScriptFile,
  root: boolean,
): void {
  const fileName = toFileName(file.path);
  mergeFileInput(files, {
    content: String(file.content ?? ''),
    fileName,
    root,
  });
}

function addPackFiles(files: Map<string, TypeScriptVirtualFileInput>, packs: readonly RunJSTypeLibraryPack[]): void {
  for (const pack of packs) {
    for (const file of pack.rootFiles) {
      mergeFileInput(files, {
        content: file.content,
        contentHash: file.contentHash,
        fileName: file.path,
        immutable: true,
        root: true,
      });
    }
    for (const file of pack.dependencyFiles) {
      mergeFileInput(files, {
        content: file.content,
        contentHash: file.contentHash,
        fileName: file.path,
        immutable: true,
        root: false,
      });
    }
  }
}

function createRequestStateKey(project: CodeEditorTypeScriptProject, currentFileContent?: string): string {
  const files = [...(project.files || []), ...(project.declarationFiles || [])]
    .map((file) => [normalizeProjectPath(file.path), file.content] as const)
    .sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify({
    compilerOptions: project.compilerOptions || {},
    currentFileContent,
    currentFilePath: normalizeProjectPath(project.currentFilePath),
    files,
    runJSContext: project.runJSContext || {},
    typeLibraryIds: project.typeLibraryIds || [],
    typeLibraryRegistry: project.typeLibraryRegistry?.getCacheKey(),
  });
}

async function prepareProject(
  project: CodeEditorTypeScriptProject,
  currentFileContent?: string,
): Promise<PreparedProject> {
  const ts = await loadTypeScript();
  ensureGeneratedRunJSTypeLibraryPackLoadersRegistered();
  const typeLibraryRegistry = project.typeLibraryRegistry || getDefaultRunJSTypeLibraryRegistry();
  const compilerOptions = {
    ...createRunJSTypeScriptCompilerOptions(ts),
    ...(project.compilerOptions || {}),
  };
  const currentFileName = toFileName(project.currentFilePath);
  const usageRequests = collectRunJSTypeLibraryUsage(ts, {
    currentFile:
      typeof currentFileContent === 'string'
        ? { content: currentFileContent, path: normalizeProjectPath(project.currentFilePath) }
        : undefined,
    files: (project.files || []).map((file) => ({ content: file.content, path: normalizeProjectPath(file.path) })),
    libraries: typeLibraryRegistry.getUsageDefinitions(),
  });
  const explicitRequests = typeLibraryRegistry.createExplicitRequests(project.typeLibraryIds || []);
  const requests = new Map(usageRequests.map((request) => [request.packId, request]));
  for (const request of explicitRequests) requests.set(request.packId, request);
  const typeLibraryRequests = [...requests.values()];
  let packs: RunJSTypeLibraryPack[];
  try {
    packs = await typeLibraryRegistry.loadPacks(typeLibraryRequests);
  } catch (error) {
    throw new TypeScriptLibraryLoadingError(
      typeLibraryRequests.map((request) => request.packId),
      error,
    );
  }
  const files = new Map<string, TypeScriptVirtualFileInput>();
  for (const file of project.files || []) {
    addProjectFile(files, file, true);
  }
  for (const file of project.declarationFiles || []) {
    addProjectFile(files, file, true);
  }
  for (const file of runJSTypeScriptEnvironmentFiles) {
    mergeFileInput(files, {
      content: file.content,
      fileName: file.path,
      immutable: true,
      root: true,
    });
  }
  mergeFileInput(files, {
    content: buildRunJSTypeScriptContextDeclaration(project.runJSContext?.modelUse, {
      globalContextType: project.runJSContext?.globalContextType,
    }),
    fileName: RUNJS_TYPESCRIPT_CONTEXT_PATH,
    root: true,
  });
  if (typeof currentFileContent === 'string') {
    const current = files.get(currentFileName);
    files.set(currentFileName, {
      content: currentFileContent,
      fileName: currentFileName,
      root: true,
    });
  }
  addPackFiles(files, packs);
  const packIds = packs.map((pack) => pack.id).sort();
  const fileStructure = Array.from(files.values())
    .map((file) => `${file.fileName}:${file.root ? 'root' : 'dependency'}`)
    .sort();
  const structureKey = JSON.stringify({
    compilerOptions,
    context: project.runJSContext || {},
    files: fileStructure,
    packIds,
  });
  return {
    compilerOptions,
    currentFileName,
    files: Array.from(files.values()),
    packIds,
    structureKey,
    ts,
  };
}

function createLanguageServiceHost(
  ts: TypeScriptModule,
  fileSystem: TypeScriptVirtualFileSystem,
  compilerOptions: TypeScriptCompilerOptions,
): import('typescript').LanguageServiceHost {
  const getFile = (fileName: string) => fileSystem.get(fileName);

  const moduleResolutionHost: import('typescript').ModuleResolutionHost = {
    fileExists(fileName) {
      return Boolean(getFile(fileName));
    },
    readFile(fileName) {
      return getFile(fileName)?.content;
    },
  };

  return {
    directoryExists(directoryName) {
      const normalizedDirectory = normalizeFileName(directoryName).replace(/\/$/, '');
      return fileSystem.getAllFileNames().some((fileName) => isInsideDirectory(fileName, normalizedDirectory));
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
      for (const fileName of fileSystem.getAllFileNames()) {
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
      return fileSystem.getRootFileNames();
    },
    getScriptKind(fileName) {
      return getScriptKind(ts, fileName);
    },
    getScriptSnapshot(fileName) {
      const file = getFile(fileName);
      return file?.snapshot;
    },
    getScriptVersion(fileName) {
      const file = getFile(fileName);
      return file?.version || '0';
    },
    readDirectory(directoryName, extensions) {
      const normalizedDirectory = normalizeFileName(directoryName).replace(/\/$/, '');
      const allowedExtensions = Array.isArray(extensions) ? new Set(extensions) : null;
      return fileSystem.getAllFileNames().filter((fileName) => {
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

function getCompletionResultFromService(
  projectService: ProjectService,
  position: number,
  explicit: boolean,
): CompletionResult | null {
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

function getDiagnosticsFromService(projectService: ProjectService): Diagnostic[] {
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

class TypeScriptProjectSession implements CodeEditorTypeScriptProjectSession {
  private disposed = false;
  private languageServiceCreationCount = 0;
  private lastInternalError: CodeEditorTypeScriptProjectInternalError | null = null;
  private latestStateGeneration = 0;
  private latestStateKey = '';
  private projectService: ProjectService | null = null;
  private requestIds = new Map<'completion' | 'diagnostics' | 'hover', number>();

  async getCompletionResult(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
    explicit = false,
  ): Promise<CompletionResult | null> {
    const request = this.beginRequest('completion', project, currentFileContent);
    try {
      const service = await this.prepareService(project, currentFileContent, request.stateGeneration);
      if (!service || !this.isCurrentRequest('completion', request)) return null;
      const result = getCompletionResultFromService(service, position, explicit);
      return this.isCurrentRequest('completion', request) ? result : null;
    } catch (error) {
      this.reportInternalError(project, error);
      return null;
    }
  }

  async getDiagnostics(project: CodeEditorTypeScriptProject, currentFileContent?: string): Promise<Diagnostic[]> {
    const request = this.beginRequest('diagnostics', project, currentFileContent);
    try {
      const service = await this.prepareService(project, currentFileContent, request.stateGeneration);
      if (!service || !this.isCurrentRequest('diagnostics', request)) return [];
      const diagnostics = getDiagnosticsFromService(service);
      return this.isCurrentRequest('diagnostics', request) ? diagnostics : [];
    } catch (error) {
      this.reportInternalError(project, error);
      return [];
    }
  }

  async getHover(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
  ): Promise<TypeScriptQuickInfoResult | null> {
    const request = this.beginRequest('hover', project, currentFileContent);
    try {
      const service = await this.prepareService(project, currentFileContent, request.stateGeneration);
      if (!service || !this.isCurrentRequest('hover', request)) return null;
      const quickInfo = service.service.getQuickInfoAtPosition(service.currentFileName, position);
      if (!quickInfo || !this.isCurrentRequest('hover', request)) return null;
      return {
        detail: service.ts.displayPartsToString(quickInfo.documentation || []),
        from: quickInfo.textSpan?.start ?? position,
        message: service.ts.displayPartsToString(quickInfo.displayParts || []),
        to: quickInfo.textSpan ? quickInfo.textSpan.start + quickInfo.textSpan.length : position,
      };
    } catch (error) {
      this.reportInternalError(project, error);
      return null;
    }
  }

  getDebugState(): CodeEditorTypeScriptProjectDebugState {
    const immutableCache = getTypeScriptImmutableFileCacheDebugState();
    return {
      allFileNames: this.projectService?.fileSystem.getAllFileNames() || [],
      disposed: this.disposed,
      fileVersions: this.projectService?.fileSystem.getVersions() || {},
      immutableFileCount: immutableCache.fileCount,
      immutableSnapshotCreationCount: immutableCache.snapshotCreationCount,
      languageServiceCreationCount: this.languageServiceCreationCount,
      rootFileNames: this.projectService?.fileSystem.getRootFileNames() || [],
      structureKey: this.projectService?.structureKey,
    };
  }

  getLastInternalError(): CodeEditorTypeScriptProjectInternalError | null {
    return this.lastInternalError;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.projectService?.service.dispose();
    this.projectService = null;
    this.requestIds.clear();
    this.latestStateGeneration += 1;
  }

  private beginRequest(
    kind: 'completion' | 'diagnostics' | 'hover',
    project: CodeEditorTypeScriptProject,
    currentFileContent?: string,
  ): { requestId: number; stateGeneration: number } {
    const stateKey = createRequestStateKey(project, currentFileContent);
    if (stateKey !== this.latestStateKey) {
      this.latestStateKey = stateKey;
      this.latestStateGeneration += 1;
    }
    const requestId = (this.requestIds.get(kind) || 0) + 1;
    this.requestIds.set(kind, requestId);
    return { requestId, stateGeneration: this.latestStateGeneration };
  }

  private isCurrentRequest(
    kind: 'completion' | 'diagnostics' | 'hover',
    request: { requestId: number; stateGeneration: number },
  ): boolean {
    return (
      !this.disposed &&
      request.stateGeneration === this.latestStateGeneration &&
      request.requestId === this.requestIds.get(kind)
    );
  }

  private async prepareService(
    project: CodeEditorTypeScriptProject,
    currentFileContent: string | undefined,
    stateGeneration: number,
  ): Promise<ProjectService | null> {
    if (this.disposed) return null;
    const prepared = await prepareProject(project, currentFileContent);
    if (this.disposed || stateGeneration !== this.latestStateGeneration) return null;

    if (this.projectService?.structureKey === prepared.structureKey) {
      this.projectService.fileSystem.synchronize(prepared.files);
      this.projectService.currentFileName = prepared.currentFileName;
      return this.projectService;
    }

    this.projectService?.service.dispose();
    const fileSystem = new TypeScriptVirtualFileSystem(prepared.ts);
    fileSystem.synchronize(prepared.files);
    if (!sharedDocumentRegistry) {
      sharedDocumentRegistry = prepared.ts.createDocumentRegistry();
    }
    const host = createLanguageServiceHost(prepared.ts, fileSystem, prepared.compilerOptions);
    const service = prepared.ts.createLanguageService(host, sharedDocumentRegistry);
    this.languageServiceCreationCount += 1;
    this.projectService = {
      compilerOptions: prepared.compilerOptions,
      currentFileName: prepared.currentFileName,
      fileSystem,
      service,
      structureKey: prepared.structureKey,
      ts: prepared.ts,
    };
    return this.projectService;
  }

  private reportInternalError(project: CodeEditorTypeScriptProject, error: unknown): void {
    const internalError: CodeEditorTypeScriptProjectInternalError =
      error instanceof TypeScriptImmutableFileConflictError
        ? {
            cause: error,
            code: error.code,
            message: error.message,
            packIds: [],
          }
        : error instanceof TypeScriptLibraryLoadingError
          ? {
              cause: error.cause,
              code: 'TYPE_LIBRARY_LOAD_FAILED',
              message: error.message,
              packIds: error.packIds,
            }
          : {
              cause: error,
              code: 'TYPE_LIBRARY_LOAD_FAILED',
              message: error instanceof Error ? error.message : 'Unknown TypeScript project error.',
              packIds: [],
            };
    this.lastInternalError = internalError;
    try {
      project.onInternalError?.(internalError);
    } catch (_) {
      // Internal error observers must not interrupt editor requests.
    }
  }
}

export function createTypeScriptProjectSession(): CodeEditorTypeScriptProjectSession {
  return new TypeScriptProjectSession();
}

let defaultProjectSession = createTypeScriptProjectSession();

export function disposeDefaultTypeScriptProjectSession(): void {
  defaultProjectSession.dispose();
  defaultProjectSession = createTypeScriptProjectSession();
}

export function clearTypeScriptProjectCachesForTests(): void {
  disposeDefaultTypeScriptProjectSession();
  clearTypeScriptImmutableFileCacheForTests();
  sharedDocumentRegistry = null;
}

export async function getTypeScriptCompletionResult(
  project: CodeEditorTypeScriptProject,
  position: number,
  currentFileContent?: string,
  explicit = false,
): Promise<CompletionResult | null> {
  return await defaultProjectSession.getCompletionResult(project, position, currentFileContent, explicit);
}

export function createTypeScriptCompletionSource(options: {
  projectRef?: CodeEditorTypeScriptProjectRef;
  session?: CodeEditorTypeScriptProjectSession;
}): CompletionSource {
  const { projectRef, session = defaultProjectSession } = options;

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
      const result = await session.getCompletionResult(
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
  return await defaultProjectSession.getDiagnostics(project, currentFileContent);
}

export function createTypeScriptProjectLinter(options: {
  projectRef?: CodeEditorTypeScriptProjectRef;
  session?: CodeEditorTypeScriptProjectSession;
}): Extension {
  const { projectRef, session = defaultProjectSession } = options;

  return linter(async (view) => {
    const project = projectRef?.current;
    if (!project) {
      return [];
    }

    try {
      return await session.getDiagnostics(project, view.state.doc.toString());
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

export function createTypeScriptHoverTooltip(options: {
  projectRef?: CodeEditorTypeScriptProjectRef;
  session?: CodeEditorTypeScriptProjectSession;
}): Extension {
  const { projectRef, session = defaultProjectSession } = options;

  return hoverTooltip(async (view, position) => {
    const project = projectRef?.current;
    if (!project) {
      return null;
    }

    try {
      const quickInfo = await session.getHover(project, position, view.state.doc.toString());
      if (!quickInfo) {
        return null;
      }

      return {
        create: createHoverTooltip(quickInfo.message, quickInfo.detail),
        end: quickInfo.to,
        pos: quickInfo.from,
      };
    } catch (_) {
      return null;
    }
  });
}
