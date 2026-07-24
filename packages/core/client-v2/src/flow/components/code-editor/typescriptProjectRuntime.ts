/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion, CompletionResult } from '@codemirror/autocomplete';
import type { Diagnostic } from '@codemirror/lint';
import {
  buildRunJSTypeScriptContextDeclaration,
  collectRunJSTypeLibraryUsage,
  createRunJSTypeScriptCompilerOptions,
  type RunJSTypeLibraryPack,
  RUNJS_TYPESCRIPT_CONTEXT_PATH,
} from '@nocobase/runjs/client-v2';

import { runJSTypeScriptEnvironmentPack } from './generated/runJSTypeScriptEnvironmentFiles';
import {
  getRunJSBuiltInAutoImportLibrary,
  isRunJSTypeScriptAutoImportSourceAllowed,
  rewriteRunJSBuiltInAutoImportCodeActions,
  type RunJSBuiltInAutoImportChange,
} from './typescriptBuiltInAutoImport';
import { ensureGeneratedRunJSTypeLibraryPackLoadersRegistered } from './type-packs';
import { getDefaultRunJSTypeLibraryRegistry } from './typescriptLibraryRegistry';
import type {
  CodeEditorTypeScriptDiagnostic,
  CodeEditorTypeScriptFile,
  CodeEditorTypeScriptProject,
  CodeEditorTypeScriptProjectDebugState,
  CodeEditorTypeScriptProjectInternalError,
  CodeEditorTypeScriptQuickInfoResult,
  CodeEditorTypeScriptProjectSession,
} from './typescriptProject';
import {
  clearTypeScriptImmutableFileCacheForTests,
  getTypeScriptImmutableFileCacheDebugState,
  TypeScriptImmutableFileConflictError,
  TypeScriptVirtualFileSystem,
  type TypeScriptVirtualFileInput,
} from './typescriptVirtualFileSystem';

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

type RequestStateToken = {
  currentFileContent?: string;
  documentRevision?: number;
  metadataKey: string;
  project: CodeEditorTypeScriptProject;
  projectRevision?: number;
};

function createRequestStateToken(project: CodeEditorTypeScriptProject, currentFileContent?: string): RequestStateToken {
  const capturedProject: CodeEditorTypeScriptProject = {
    ...project,
    compilerOptions: project.compilerOptions ? { ...project.compilerOptions } : undefined,
    declarationFiles: project.declarationFiles?.map((file) => ({ ...file })),
    files: project.files.map((file) => ({ ...file })),
    runJSContext: project.runJSContext ? { ...project.runJSContext } : undefined,
    typeLibraryIds: project.typeLibraryIds ? [...project.typeLibraryIds] : undefined,
  };
  return {
    currentFileContent,
    documentRevision: project.documentRevision,
    metadataKey: JSON.stringify({
      compilerOptions: capturedProject.compilerOptions,
      currentFilePath: normalizeProjectPath(project.currentFilePath),
      rewriteBuiltInAutoImports: project.rewriteBuiltInAutoImports,
      runJSContext: capturedProject.runJSContext,
      typeLibraryIds: capturedProject.typeLibraryIds,
      typeLibraryRegistry: project.typeLibraryRegistry?.getCacheKey(),
    }),
    project: capturedProject,
    projectRevision: project.projectRevision,
  };
}

function isSameRequestState(left: RequestStateToken | null, right: RequestStateToken): boolean {
  return Boolean(
    left &&
      left.currentFileContent === right.currentFileContent &&
      left.documentRevision === right.documentRevision &&
      sameRequestFiles(left.project.declarationFiles || [], right.project.declarationFiles || []) &&
      sameRequestFiles(left.project.files, right.project.files) &&
      left.metadataKey === right.metadataKey &&
      left.projectRevision === right.projectRevision &&
      left.project.typeLibraryRegistry === right.project.typeLibraryRegistry,
  );
}

function sameRequestFiles(
  left: CodeEditorTypeScriptProject['files'],
  right: CodeEditorTypeScriptProject['files'],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (file, index) =>
        file.path === right[index].path &&
        file.content === right[index].content &&
        file.revision === right[index].revision,
    )
  );
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
  for (const file of runJSTypeScriptEnvironmentPack.rootFiles) {
    mergeFileInput(files, {
      content: file.content,
      contentHash: file.contentHash,
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
  builtInAutoImportChanges?: RunJSBuiltInAutoImportChange[],
): CodeMirrorTextChange[] {
  const changes: CodeMirrorTextChange[] = [];
  const seen = new Set<string>();

  for (const builtInAutoImportChange of builtInAutoImportChanges || []) {
    changes.push(builtInAutoImportChange);
    seen.add(`${builtInAutoImportChange.from}:${builtInAutoImportChange.to}:${builtInAutoImportChange.insert}`);
  }

  for (const action of builtInAutoImportChanges ? [] : details?.codeActions || []) {
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
  rewriteBuiltInAutoImports: boolean,
): Completion['apply'] {
  return (view, _completion, from, to) => {
    const details = getCompletionDetails(projectService, position, entry, preferences, formatOptions);
    const source = getSourceDisplay(projectService.ts, entry);
    const libraryName = rewriteBuiltInAutoImports ? getRunJSBuiltInAutoImportLibrary(source) : undefined;
    const builtInAutoImportChanges =
      libraryName && source
        ? rewriteRunJSBuiltInAutoImportCodeActions({
            codeActions: details?.codeActions,
            currentFileName: projectService.currentFileName,
            libraryName,
            localName: label,
            source,
            sourceText: projectService.fileSystem.get(projectService.currentFileName)?.content || '',
            ts: projectService.ts,
          })
        : undefined;
    if (libraryName && !builtInAutoImportChanges) {
      return;
    }
    const changes = buildCompletionChanges(projectService, details, label, from, to, builtInAutoImportChanges);
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
  rewriteBuiltInAutoImports: boolean,
): Completion {
  const source = getSourceDisplay(projectService.ts, entry);
  const libraryName = rewriteBuiltInAutoImports ? getRunJSBuiltInAutoImportLibrary(source) : undefined;
  const detail = libraryName
    ? `Auto import from ctx.libs.${libraryName}`
    : source
      ? `Auto import from ${source}`
      : entry.kind;
  return {
    apply: createCompletionApply(
      projectService,
      position,
      entry,
      entry.name,
      preferences,
      formatOptions,
      rewriteBuiltInAutoImports,
    ),
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
  rewriteBuiltInAutoImports = false,
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
  const options = completions.entries
    .filter((entry) =>
      isRunJSTypeScriptAutoImportSourceAllowed(getSourceDisplay(projectService.ts, entry), rewriteBuiltInAutoImports),
    )
    .map((entry) =>
      completionEntryToCodeMirrorCompletion(
        projectService,
        position,
        entry,
        preferences,
        formatOptions,
        rewriteBuiltInAutoImports,
      ),
    );

  if (!options.length) {
    return null;
  }

  return {
    from,
    options,
    to,
    validFor: explicit ? undefined : /^[$_\p{Letter}\p{Number}]*$/u,
  };
}

function getDiagnosticsFromService(projectService: ProjectService): CodeEditorTypeScriptDiagnostic[] {
  const syntax = projectService.service.getSyntacticDiagnostics(projectService.currentFileName);
  const semantic = projectService.service.getSemanticDiagnostics(projectService.currentFileName);
  const suggestions = projectService.service.getSuggestionDiagnostics(projectService.currentFileName);
  return diagnosticsToCodeMirror(projectService.ts, [...syntax, ...semantic, ...suggestions]);
}

function diagnosticsToCodeMirror(
  ts: TypeScriptModule,
  diagnostics: readonly TypeScriptDiagnostic[],
): CodeEditorTypeScriptDiagnostic[] {
  return diagnostics
    .filter((diagnostic) => typeof diagnostic.start === 'number')
    .map((diagnostic) => {
      const from = Math.max(0, diagnostic.start || 0);
      const length = Math.max(1, diagnostic.length || 1);
      return {
        code: diagnostic.code,
        from,
        message: flattenDiagnosticMessage(ts, diagnostic),
        severity: diagnosticCategoryToSeverity(ts, diagnostic),
        source: 'TypeScript',
        to: from + length,
      };
    });
}

function filterIgnoredDiagnostics(
  project: CodeEditorTypeScriptProject,
  diagnostics: CodeEditorTypeScriptDiagnostic[],
): CodeEditorTypeScriptDiagnostic[] {
  if (!project.ignoredDiagnosticCodes?.length) {
    return diagnostics;
  }

  const ignoredCodes = new Set(project.ignoredDiagnosticCodes);
  return diagnostics.filter((diagnostic) => !ignoredCodes.has(diagnostic.code));
}

async function getSyntacticDiagnosticsWithoutTypeLibraries(
  project: CodeEditorTypeScriptProject,
  currentFileContent?: string,
): Promise<CodeEditorTypeScriptDiagnostic[]> {
  const ts = await loadTypeScript();
  const currentFilePath = normalizeProjectPath(project.currentFilePath);
  const source =
    currentFileContent ??
    project.files.find((file) => normalizeProjectPath(file.path) === currentFilePath)?.content ??
    '';
  const result = ts.transpileModule(source, {
    compilerOptions: {
      ...createRunJSTypeScriptCompilerOptions(ts),
      ...(project.compilerOptions || {}),
    },
    fileName: currentFilePath,
    reportDiagnostics: true,
  });
  return diagnosticsToCodeMirror(ts, result.diagnostics || []);
}

class TypeScriptProjectSession implements CodeEditorTypeScriptProjectSession {
  private disposal: Promise<void> = Promise.resolve();
  private disposed = false;
  private languageServiceCreationCount = 0;
  private lastInternalError: CodeEditorTypeScriptProjectInternalError | null = null;
  private latestStateGeneration = 0;
  private latestStateToken: RequestStateToken | null = null;
  private pendingRequestCount = 0;
  private projectService: ProjectService | null = null;
  private requestIds = new Map<'completion' | 'diagnostics' | 'hover', number>();
  private resolveDisposal: (() => void) | null = null;

  async getCompletionResult(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
    explicit = false,
  ): Promise<CompletionResult | null> {
    if (this.disposed) return null;
    this.pendingRequestCount += 1;
    const request = this.beginRequest('completion', project, currentFileContent);
    try {
      const service = await this.prepareService(
        request.project,
        request.currentFileContent,
        request.stateGeneration,
        request.stateChanged,
      );
      if (!service || !this.isCurrentRequest('completion', request)) return null;
      const result = getCompletionResultFromService(service, position, explicit, project.rewriteBuiltInAutoImports);
      return this.isCurrentRequest('completion', request) ? result : null;
    } catch (error) {
      if (this.disposed) return null;
      this.reportInternalError(project, error);
      return null;
    } finally {
      this.finishRequest();
    }
  }

  async getDiagnostics(
    project: CodeEditorTypeScriptProject,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptDiagnostic[]> {
    if (this.disposed) return [];
    this.pendingRequestCount += 1;
    const request = this.beginRequest('diagnostics', project, currentFileContent);
    try {
      const service = await this.prepareService(
        request.project,
        request.currentFileContent,
        request.stateGeneration,
        request.stateChanged,
      );
      if (!service || !this.isCurrentRequest('diagnostics', request)) return [];
      const diagnostics = filterIgnoredDiagnostics(project, getDiagnosticsFromService(service));
      return this.isCurrentRequest('diagnostics', request) ? diagnostics : [];
    } catch (error) {
      if (this.disposed) return [];
      this.reportInternalError(project, error);
      const diagnostics = filterIgnoredDiagnostics(
        project,
        await getSyntacticDiagnosticsWithoutTypeLibraries(project, currentFileContent),
      );
      return this.isCurrentRequest('diagnostics', request) ? diagnostics : [];
    } finally {
      this.finishRequest();
    }
  }

  async getHover(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptQuickInfoResult | null> {
    if (this.disposed) return null;
    this.pendingRequestCount += 1;
    const request = this.beginRequest('hover', project, currentFileContent);
    try {
      const service = await this.prepareService(
        request.project,
        request.currentFileContent,
        request.stateGeneration,
        request.stateChanged,
      );
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
      if (this.disposed) return null;
      this.reportInternalError(project, error);
      return null;
    } finally {
      this.finishRequest();
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
    this.latestStateToken = null;
    this.lastInternalError = null;
    this.latestStateGeneration += 1;
    if (this.pendingRequestCount > 0) {
      this.disposal = new Promise((resolve) => {
        this.resolveDisposal = resolve;
      });
    }
  }

  whenDisposed(): Promise<void> {
    return this.disposal;
  }

  private finishRequest(): void {
    this.pendingRequestCount -= 1;
    if (!this.disposed || this.pendingRequestCount !== 0) return;
    this.resolveDisposal?.();
    this.resolveDisposal = null;
  }

  private beginRequest(
    kind: 'completion' | 'diagnostics' | 'hover',
    project: CodeEditorTypeScriptProject,
    currentFileContent?: string,
  ): {
    currentFileContent?: string;
    project: CodeEditorTypeScriptProject;
    requestId: number;
    stateChanged: boolean;
    stateGeneration: number;
  } {
    const stateToken = createRequestStateToken(project, currentFileContent);
    const stateChanged = !isSameRequestState(this.latestStateToken, stateToken);
    if (stateChanged) {
      this.latestStateToken = stateToken;
      this.latestStateGeneration += 1;
    }
    const requestId = (this.requestIds.get(kind) || 0) + 1;
    this.requestIds.set(kind, requestId);
    return {
      currentFileContent: stateToken.currentFileContent,
      project: stateToken.project,
      requestId,
      stateChanged,
      stateGeneration: this.latestStateGeneration,
    };
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
    stateChanged: boolean,
  ): Promise<ProjectService | null> {
    if (this.disposed) return null;
    if (!stateChanged && this.projectService) return this.projectService;
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

export function createMainThreadTypeScriptProjectSession(): CodeEditorTypeScriptProjectSession {
  return new TypeScriptProjectSession();
}

export function clearMainThreadTypeScriptProjectCachesForTests(): void {
  clearTypeScriptImmutableFileCacheForTests();
  sharedDocumentRegistry = null;
}
