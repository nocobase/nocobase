/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildRunJSTypeScriptContextDeclaration,
  collectRunJSTypeLibraryUsage,
  createRunJSTypeScriptCompilerOptions,
  RUNJS_TYPESCRIPT_ENVIRONMENT_LIBRARY_NAME,
  RUNJS_TYPESCRIPT_ENVIRONMENT_PACK_ID,
  selectRunJSTypeLibraryRequests,
  type RunJSTypeLibraryPack,
  type RunJSTypeLibraryPackDependency,
  type RunJSTypeLibraryRequest,
  RUNJS_TYPESCRIPT_CONTEXT_PATH,
} from '@nocobase/runjs/client-v2';

import {
  getRunJSBuiltInAutoImportLibrary,
  isRunJSTypeScriptAutoImportSourceAllowed,
  rewriteRunJSBuiltInAutoImportCodeActions,
} from './typescriptBuiltInAutoImport';
import {
  clearTypeScriptImmutableFileCacheNamespace,
  getTypeScriptImmutableFileCacheDebugState,
  TypeScriptVirtualFileSystem,
  type TypeScriptVirtualFileInput,
} from './typescriptVirtualFileSystem';
import { RUNJS_TYPESCRIPT_WORKER_REVISION_MISMATCH } from './typescriptWorkerProtocol';
import type {
  TypeScriptWorkerCompletionChange,
  TypeScriptWorkerCompletionEntry,
  TypeScriptWorkerCompletionResult,
  TypeScriptWorkerDebugState,
  TypeScriptWorkerDiagnostic,
  TypeScriptWorkerProjectSnapshot,
  TypeScriptWorkerProjectUpdate,
  TypeScriptWorkerQuickInfo,
} from './typescriptWorkerProtocol';

type TypeScriptModule = typeof import('typescript');
type TypeScriptLanguageService = import('typescript').LanguageService;
type TypeScriptCompilerOptions = import('typescript').CompilerOptions;
type TypeScriptDiagnostic = import('typescript').Diagnostic;
type TypeScriptCompletionEntry = import('typescript').CompletionEntry;
type TypeScriptCompletionEntryDetails = import('typescript').CompletionEntryDetails;

export type TypeScriptWorkerPackLoader = (request: RunJSTypeLibraryRequest) => Promise<RunJSTypeLibraryPack>;

type ProjectService = {
  compilerOptions: TypeScriptCompilerOptions;
  currentFileName: string;
  fileSystem: TypeScriptVirtualFileSystem;
  service: TypeScriptLanguageService;
  structureKey: string;
};

type ProjectState = {
  actualLoadIds: string[];
  cacheHitIds: string[];
  dependencyFileCount: number;
  disposed: boolean;
  documentVersion: number;
  revision: number;
  languageServiceCreationCount: number;
  loadPack: TypeScriptWorkerPackLoader;
  loadedFullPackIds: Map<string, string>;
  packCache: Map<string, Promise<RunJSTypeLibraryPack>>;
  packRequestIds: string[];
  peakDeclarationCharacterCount: number;
  service: ProjectService | null;
  snapshot: TypeScriptWorkerProjectSnapshot;
};

const completionPreferences: import('typescript').UserPreferences = {
  allowIncompleteCompletions: true,
  includeCompletionsForModuleExports: true,
  includeCompletionsWithInsertText: true,
  includePackageJsonAutoImports: 'off',
  importModuleSpecifierPreference: 'relative',
};
const completionFormatOptions: import('typescript').FormatCodeSettings = {
  convertTabsToSpaces: true,
  indentSize: 2,
  newLineCharacter: '\n',
  tabSize: 2,
};
let typeScriptPromise: Promise<TypeScriptModule> | null = null;

async function loadTypeScript(): Promise<TypeScriptModule> {
  typeScriptPromise ||= import('typescript');
  return await typeScriptPromise;
}

function normalizeProjectPath(path: string): string {
  const normalized = String(path || '')
    .replace(/\\/gu, '/')
    .replace(/^\/+|\s+$/gu, '')
    .replace(/\/+/gu, '/');
  return normalized || 'main.tsx';
}

function normalizeFileName(fileName: string): string {
  const normalized = String(fileName || '')
    .replace(/\\/gu, '/')
    .replace(/\/+/gu, '/');
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
  const file = normalizeFileName(fileName);
  const directory = normalizeFileName(directoryName).replace(/\/$/u, '');
  return file === directory || file.startsWith(`${directory}/`);
}

function mergeFile(files: Map<string, TypeScriptVirtualFileInput>, input: TypeScriptVirtualFileInput): void {
  const fileName = normalizeFileName(input.fileName);
  const existing = files.get(fileName);
  if (existing && existing.content !== input.content) {
    throw new Error(`Conflicting immutable TypeScript virtual file: ${fileName}`);
  }
  files.set(fileName, {
    ...existing,
    ...input,
    fileName,
    immutable: Boolean(existing?.immutable || input.immutable),
    root: Boolean(existing?.root || input.root),
  });
}

function addPackFiles(files: Map<string, TypeScriptVirtualFileInput>, packs: readonly RunJSTypeLibraryPack[]): void {
  for (const pack of packs) {
    for (const file of pack.rootFiles) {
      mergeFile(files, {
        content: file.content,
        contentHash: file.contentHash,
        fileName: file.path,
        immutable: true,
        root: true,
      });
    }
    for (const file of pack.dependencyFiles) {
      mergeFile(files, {
        content: file.content,
        contentHash: file.contentHash,
        fileName: file.path,
        immutable: true,
        root: false,
      });
    }
  }
}

function toExplicitRequest(packId: string, libraryName: string): RunJSTypeLibraryRequest {
  return packId.endsWith('/full') ? { kind: 'full', libraryName, packId } : { kind: 'library', libraryName, packId };
}

function inferLibraryName(packId: string): string {
  if (packId.startsWith('antd-icons/')) return 'antdIcons';
  if (packId.startsWith('antd/')) return 'antd';
  return packId;
}

function assertDependencyMatches(dependency: RunJSTypeLibraryPackDependency, pack: RunJSTypeLibraryPack): void {
  if (dependency.version !== pack.version || dependency.contentHash !== pack.contentHash) {
    throw new Error(`RunJS TypeScript library pack dependency mismatch: ${dependency.id}`);
  }
}

async function loadPackWithDependencies(
  state: ProjectState,
  request: RunJSTypeLibraryRequest,
  ancestors: ReadonlySet<string>,
  result: Map<string, RunJSTypeLibraryPack>,
): Promise<void> {
  if (result.has(request.packId) || ancestors.has(request.packId)) return;
  let loading = state.packCache.get(request.packId);
  if (!loading) {
    state.actualLoadIds.push(request.packId);
    loading = state.loadPack(request).catch((error: unknown) => {
      if (state.packCache.get(request.packId) === loading) state.packCache.delete(request.packId);
      throw error;
    });
    state.packCache.set(request.packId, loading);
  } else {
    state.cacheHitIds.push(request.packId);
  }
  const pack = await loading;
  state.dependencyFileCount = Math.max(state.dependencyFileCount, pack.dependencyFiles.length);
  state.peakDeclarationCharacterCount = Math.max(
    state.peakDeclarationCharacterCount,
    [...pack.rootFiles, ...pack.dependencyFiles].reduce((sum, file) => sum + file.content.length, 0),
  );
  if (request.kind === 'full') state.loadedFullPackIds.set(request.libraryName, pack.id);
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(pack.id);
  for (const dependency of [...pack.dependencies].sort((left, right) => left.id.localeCompare(right.id))) {
    await loadPackWithDependencies(
      state,
      { kind: 'library', libraryName: inferLibraryName(dependency.id), packId: dependency.id },
      nextAncestors,
      result,
    );
    const dependencyPack = result.get(dependency.id);
    if (dependencyPack) assertDependencyMatches(dependency, dependencyPack);
  }
  result.set(pack.id, pack);
}

async function loadProjectPacks(
  ts: TypeScriptModule,
  state: ProjectState,
  currentFileContent: string,
): Promise<RunJSTypeLibraryPack[]> {
  const snapshot = state.snapshot;
  const usageRequests = collectRunJSTypeLibraryUsage(ts, {
    currentFile: { content: currentFileContent, path: normalizeProjectPath(snapshot.currentFilePath) },
    files: snapshot.files.map((file) => ({ content: file.content, path: normalizeProjectPath(file.path) })),
    libraries: snapshot.typeLibraryUsageDefinitions,
  });
  const definitionByPackId = new Map(
    snapshot.typeLibraryUsageDefinitions.map((definition) => [definition.packId, definition]),
  );
  const explicitRequests = snapshot.typeLibraryIds.map((packId) =>
    toExplicitRequest(packId, definitionByPackId.get(packId)?.libraryName || inferLibraryName(packId)),
  );
  const requests = selectRunJSTypeLibraryRequests(
    [...new Map([...usageRequests, ...explicitRequests].map((request) => [request.packId, request])).values()],
    state.loadedFullPackIds,
  );
  for (const request of requests) state.packRequestIds.push(request.packId);
  const packs = new Map<string, RunJSTypeLibraryPack>();
  await loadPackWithDependencies(
    state,
    {
      kind: 'library',
      libraryName: RUNJS_TYPESCRIPT_ENVIRONMENT_LIBRARY_NAME,
      packId: RUNJS_TYPESCRIPT_ENVIRONMENT_PACK_ID,
    },
    new Set(),
    packs,
  );
  for (const request of requests) await loadPackWithDependencies(state, request, new Set(), packs);
  return [...packs.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function createHost(
  ts: TypeScriptModule,
  fileSystem: TypeScriptVirtualFileSystem,
  compilerOptions: TypeScriptCompilerOptions,
): import('typescript').LanguageServiceHost {
  const getFile = (fileName: string) => fileSystem.get(fileName);
  const moduleResolutionHost: import('typescript').ModuleResolutionHost = {
    fileExists: (fileName) => Boolean(getFile(fileName)),
    readFile: (fileName) => getFile(fileName)?.content,
  };
  return {
    directoryExists: (directoryName) =>
      fileSystem.getAllFileNames().some((fileName) => isInsideDirectory(fileName, directoryName)),
    fileExists: (fileName) => Boolean(getFile(fileName)),
    getCompilationSettings: () => compilerOptions,
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => 'lib.d.ts',
    getDirectories(directoryName) {
      const directory = normalizeFileName(directoryName).replace(/\/$/u, '');
      const directories = new Set<string>();
      for (const fileName of fileSystem.getAllFileNames()) {
        if (!isInsideDirectory(fileName, directory)) continue;
        const relative = fileName.slice(directory.length).replace(/^\/+/, '');
        const first = relative.split('/')[0];
        if (first && relative.includes('/')) directories.add(first);
      }
      return [...directories];
    },
    getScriptFileNames: () => fileSystem.getRootFileNames(),
    getScriptKind: (fileName) => getScriptKind(ts, fileName),
    getScriptSnapshot: (fileName) => getFile(fileName)?.snapshot,
    getScriptVersion: (fileName) => getFile(fileName)?.version || '0',
    readDirectory: (directoryName, extensions) =>
      fileSystem
        .getAllFileNames()
        .filter(
          (fileName) =>
            isInsideDirectory(fileName, directoryName) &&
            (!extensions || extensions.some((extension) => fileName.endsWith(extension))),
        ),
    readFile: (fileName) => getFile(fileName)?.content,
    resolveModuleNames: (moduleNames, containingFile) =>
      moduleNames.map(
        (moduleName) =>
          ts.resolveModuleName(moduleName, containingFile, compilerOptions, moduleResolutionHost).resolvedModule,
      ),
    useCaseSensitiveFileNames: () => true,
  };
}

function getCompletionType(kind: string): string {
  const types: Record<string, string> = {
    class: 'class',
    const: 'constant',
    enum: 'enum',
    function: 'function',
    getter: 'property',
    interface: 'interface',
    keyword: 'keyword',
    let: 'variable',
    method: 'method',
    module: 'namespace',
    property: 'property',
    setter: 'property',
    type: 'type',
    var: 'variable',
    variable: 'variable',
  };
  return types[kind] || 'variable';
}

function getDetails(
  service: ProjectService,
  position: number,
  entry: TypeScriptCompletionEntry,
): TypeScriptCompletionEntryDetails | undefined {
  try {
    return service.service.getCompletionEntryDetails(
      service.currentFileName,
      position,
      entry.name,
      completionFormatOptions,
      entry.source,
      completionPreferences,
      entry.data,
    );
  } catch (_) {
    return undefined;
  }
}

function buildCompletionChanges(
  service: ProjectService,
  details: TypeScriptCompletionEntryDetails | undefined,
  from: number,
  to: number,
): TypeScriptWorkerCompletionChange[] {
  const changes: TypeScriptWorkerCompletionChange[] = [];
  const seen = new Set<string>();
  for (const action of details?.codeActions || []) {
    for (const fileChange of action.changes || []) {
      if (normalizeFileName(fileChange.fileName) !== service.currentFileName) continue;
      for (const textChange of fileChange.textChanges || []) {
        const change = {
          from: textChange.span.start,
          insert: textChange.newText,
          to: textChange.span.start + textChange.span.length,
        };
        if (change.from < to && change.to > from) continue;
        const key = `${change.from}:${change.to}:${change.insert}`;
        if (!seen.has(key)) {
          seen.add(key);
          changes.push(change);
        }
      }
    }
  }
  return changes.sort((left, right) => left.from - right.from);
}

function completionEntryToDto(
  ts: TypeScriptModule,
  service: ProjectService,
  position: number,
  entry: TypeScriptCompletionEntry,
  from: number,
  to: number,
  rewriteBuiltInAutoImports: boolean,
): TypeScriptWorkerCompletionEntry {
  const source = entry.source || (entry.sourceDisplay ? ts.displayPartsToString(entry.sourceDisplay) : '');
  const libraryName = rewriteBuiltInAutoImports ? getRunJSBuiltInAutoImportLibrary(source) : undefined;
  const detail = libraryName
    ? `Auto import from ctx.libs.${libraryName}`
    : source
      ? `Auto import from ${source}`
      : entry.kind;
  const details = entry.source || entry.hasAction ? getDetails(service, position, entry) : undefined;
  const builtInAutoImportChanges =
    libraryName && source
      ? rewriteRunJSBuiltInAutoImportCodeActions({
          codeActions: details?.codeActions,
          currentFileName: service.currentFileName,
          libraryName,
          localName: entry.name,
          source,
          sourceText: service.fileSystem.get(service.currentFileName)?.content || '',
          ts,
        })
      : undefined;
  const unavailable = Boolean(libraryName && !builtInAutoImportChanges);
  const changes = unavailable ? [] : builtInAutoImportChanges || buildCompletionChanges(service, details, from, to);
  return {
    boost: source ? 120 : 20,
    changes,
    detail,
    info: entry.kindModifiers || detail,
    label: entry.name,
    unavailable,
    type: getCompletionType(entry.kind),
  };
}

function diagnosticSeverity(
  ts: TypeScriptModule,
  diagnostic: TypeScriptDiagnostic,
): TypeScriptWorkerDiagnostic['severity'] {
  if (diagnostic.category === ts.DiagnosticCategory.Error) return 'error';
  if (diagnostic.category === ts.DiagnosticCategory.Warning) return 'warning';
  return 'info';
}

function diagnosticsToDto(
  ts: TypeScriptModule,
  diagnostics: readonly TypeScriptDiagnostic[],
): TypeScriptWorkerDiagnostic[] {
  return diagnostics
    .filter((diagnostic) => typeof diagnostic.start === 'number')
    .map((diagnostic) => {
      const from = Math.max(0, diagnostic.start || 0);
      return {
        code: diagnostic.code,
        from,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        severity: diagnosticSeverity(ts, diagnostic),
        source: 'TypeScript',
        to: from + Math.max(1, diagnostic.length || 1),
      };
    });
}

export class TypeScriptWorkerRuntime {
  private readonly projects = new Map<string, ProjectState>();
  private readonly registries = new Map<string, import('typescript').DocumentRegistry>();

  sync(
    projectId: string,
    documentVersion: number,
    targetRevision: number,
    snapshot: TypeScriptWorkerProjectSnapshot,
    loadPack: TypeScriptWorkerPackLoader,
  ): void {
    const existing = this.projects.get(projectId);
    if (existing && documentVersion < existing.documentVersion) return;
    if (existing) {
      if (existing.snapshot.registryKey !== snapshot.registryKey) {
        existing.service?.service.dispose();
        existing.service = null;
        existing.packCache.clear();
        existing.loadedFullPackIds.clear();
        clearTypeScriptImmutableFileCacheNamespace(projectId);
      }
      existing.documentVersion = documentVersion;
      existing.revision = targetRevision;
      existing.snapshot = snapshot;
      existing.loadPack = loadPack;
      existing.disposed = false;
      return;
    }
    this.projects.set(projectId, {
      actualLoadIds: [],
      cacheHitIds: [],
      dependencyFileCount: 0,
      disposed: false,
      documentVersion,
      revision: targetRevision,
      languageServiceCreationCount: 0,
      loadPack,
      loadedFullPackIds: new Map(),
      packCache: new Map(),
      packRequestIds: [],
      peakDeclarationCharacterCount: 0,
      service: null,
      snapshot,
    });
  }

  update(
    projectId: string,
    documentVersion: number,
    baseRevision: number,
    targetRevision: number,
    update: TypeScriptWorkerProjectUpdate,
    loadPack: TypeScriptWorkerPackLoader,
  ): void {
    const state = this.projects.get(projectId);
    if (!state) throw new Error(`TypeScript worker project is not initialized: ${projectId}`);
    if (state.revision !== baseRevision) {
      throw new Error(`${RUNJS_TYPESCRIPT_WORKER_REVISION_MISMATCH}:${state.revision}:${baseRevision}`);
    }
    if (documentVersion < state.documentVersion) return;
    const files = new Map(state.snapshot.files.map((file) => [file.path, file]));
    for (const path of update.fileRemovals) files.delete(path);
    for (const file of update.fileUpserts) files.set(file.path, file);
    const declarationFiles = new Map(state.snapshot.declarationFiles.map((file) => [file.path, file]));
    for (const path of update.declarationFileRemovals) declarationFiles.delete(path);
    for (const file of update.declarationFileUpserts) declarationFiles.set(file.path, file);
    this.sync(
      projectId,
      documentVersion,
      targetRevision,
      {
        compilerOptions: update.compilerOptions,
        currentFilePath: update.currentFilePath,
        declarationFiles: [...declarationFiles.values()],
        files: [...files.values()],
        registryKey: update.registryKey,
        rewriteBuiltInAutoImports: update.rewriteBuiltInAutoImports,
        runJSContext: update.runJSContext,
        typeLibraryIds: update.typeLibraryIds,
        typeLibraryUsageDefinitions: update.typeLibraryUsageDefinitions,
      },
      loadPack,
    );
  }

  async completion(
    projectId: string,
    documentVersion: number,
    position: number,
  ): Promise<TypeScriptWorkerCompletionResult | null> {
    const prepared = await this.prepare(projectId, documentVersion);
    if (!prepared) return null;
    const { state, service, ts } = prepared;
    const completions = service.service.getCompletionsAtPosition(
      service.currentFileName,
      position,
      completionPreferences,
    );
    if (!completions?.entries.length || !this.isCurrent(state, documentVersion)) return null;
    const span = completions.optionalReplacementSpan || completions.entries[0]?.replacementSpan;
    const from = span?.start ?? position;
    const to = span ? span.start + span.length : position;
    const options = completions.entries
      .filter((entry) => {
        const source = entry.source || (entry.sourceDisplay ? ts.displayPartsToString(entry.sourceDisplay) : '');
        return isRunJSTypeScriptAutoImportSourceAllowed(
          source || undefined,
          state.snapshot.rewriteBuiltInAutoImports === true,
        );
      })
      .map((entry) =>
        completionEntryToDto(ts, service, position, entry, from, to, state.snapshot.rewriteBuiltInAutoImports === true),
      );
    if (!options.length) return null;
    return {
      from,
      options,
      to,
    };
  }

  async diagnostics(projectId: string, documentVersion: number): Promise<TypeScriptWorkerDiagnostic[]> {
    const prepared = await this.prepare(projectId, documentVersion);
    if (!prepared) return [];
    const { state, service, ts } = prepared;
    const diagnostics = [
      ...service.service.getSyntacticDiagnostics(service.currentFileName),
      ...service.service.getSemanticDiagnostics(service.currentFileName),
      ...service.service.getSuggestionDiagnostics(service.currentFileName),
    ];
    return this.isCurrent(state, documentVersion) ? diagnosticsToDto(ts, diagnostics) : [];
  }

  async hover(projectId: string, documentVersion: number, position: number): Promise<TypeScriptWorkerQuickInfo | null> {
    const prepared = await this.prepare(projectId, documentVersion);
    if (!prepared) return null;
    const { state, service, ts } = prepared;
    const quickInfo = service.service.getQuickInfoAtPosition(service.currentFileName, position);
    if (!quickInfo || !this.isCurrent(state, documentVersion)) return null;
    return {
      detail: ts.displayPartsToString(quickInfo.documentation || []),
      from: quickInfo.textSpan?.start ?? position,
      message: ts.displayPartsToString(quickInfo.displayParts || []),
      to: quickInfo.textSpan ? quickInfo.textSpan.start + quickInfo.textSpan.length : position,
    };
  }

  debug(projectId: string): TypeScriptWorkerDebugState {
    const state = this.projects.get(projectId);
    const immutable = getTypeScriptImmutableFileCacheDebugState(projectId);
    return {
      actualLoadIds: [...(state?.actualLoadIds || [])],
      allFileNames: state?.service?.fileSystem.getAllFileNames() || [],
      cacheHitIds: [...(state?.cacheHitIds || [])],
      dependencyFileCount: state?.dependencyFileCount || 0,
      disposed: !state || state.disposed,
      fileVersions: state?.service?.fileSystem.getVersions() || {},
      immutableCacheCharacterCount: immutable.characterCount,
      immutableFileCount: immutable.fileCount,
      immutableSnapshotCreationCount: immutable.snapshotCreationCount,
      languageServiceCreationCount: state?.languageServiceCreationCount || 0,
      packRequestIds: [...(state?.packRequestIds || [])],
      peakDeclarationCharacterCount: state?.peakDeclarationCharacterCount || 0,
      programSourceFileCount: state?.service?.service.getProgram()?.getSourceFiles().length || 0,
      rootFileNames: state?.service?.fileSystem.getRootFileNames() || [],
      structureKey: state?.service?.structureKey,
    };
  }

  dispose(projectId: string): void {
    const state = this.projects.get(projectId);
    state?.service?.service.dispose();
    if (state) {
      state.disposed = true;
      state.service = null;
      state.packCache.clear();
      state.loadedFullPackIds.clear();
    }
    this.projects.delete(projectId);
    this.registries.delete(projectId);
    clearTypeScriptImmutableFileCacheNamespace(projectId);
  }

  disposeAll(): void {
    for (const projectId of [...this.projects.keys()]) this.dispose(projectId);
  }

  private isCurrent(state: ProjectState, documentVersion: number): boolean {
    return !state.disposed && state.documentVersion === documentVersion;
  }

  private async prepare(
    projectId: string,
    documentVersion: number,
  ): Promise<{ service: ProjectService; state: ProjectState; ts: TypeScriptModule } | null> {
    const state = this.projects.get(projectId);
    if (!state || !this.isCurrent(state, documentVersion)) return null;
    const ts = await loadTypeScript();
    if (!this.isCurrent(state, documentVersion)) return null;
    const snapshot = state.snapshot;
    const currentFileName = toFileName(snapshot.currentFilePath);
    const currentFileContent = snapshot.files.find((file) => toFileName(file.path) === currentFileName)?.content || '';
    const packs = await loadProjectPacks(ts, state, currentFileContent);
    if (!this.isCurrent(state, documentVersion)) return null;
    const declarationFiles = new Map<string, string>();
    const dependencyFiles = new Set<string>();
    for (const pack of packs) {
      for (const file of pack.rootFiles) declarationFiles.set(file.path, file.content);
      for (const file of pack.dependencyFiles) {
        declarationFiles.set(file.path, file.content);
        dependencyFiles.add(file.path);
      }
    }
    state.dependencyFileCount = Math.max(state.dependencyFileCount, dependencyFiles.size);
    state.peakDeclarationCharacterCount = Math.max(
      state.peakDeclarationCharacterCount,
      [...declarationFiles.values()].reduce((sum, content) => sum + content.length, 0),
    );
    const compilerOptions = {
      ...createRunJSTypeScriptCompilerOptions(ts),
      ...(snapshot.compilerOptions as Partial<TypeScriptCompilerOptions> | undefined),
    };
    const files = new Map<string, TypeScriptVirtualFileInput>();
    for (const file of [...snapshot.files, ...snapshot.declarationFiles]) {
      mergeFile(files, { content: file.content, fileName: toFileName(file.path), root: true });
    }
    mergeFile(files, {
      content: buildRunJSTypeScriptContextDeclaration(snapshot.runJSContext?.modelUse, {
        globalContextType: snapshot.runJSContext?.globalContextType,
      }),
      fileName: RUNJS_TYPESCRIPT_CONTEXT_PATH,
      root: true,
    });
    addPackFiles(files, packs);
    const inputs = [...files.values()];
    const structureKey = JSON.stringify({
      compilerOptions,
      files: inputs.map((file) => `${file.fileName}:${file.root ? 'root' : 'dependency'}`).sort(),
      packs: packs.map((pack) => pack.id).sort(),
      runJSContext: snapshot.runJSContext || {},
    });
    if (state.service?.structureKey === structureKey) {
      state.service.fileSystem.synchronize(inputs);
      state.service.currentFileName = currentFileName;
      return { service: state.service, state, ts };
    }
    state.service?.service.dispose();
    const fileSystem = new TypeScriptVirtualFileSystem(ts, projectId);
    fileSystem.synchronize(inputs);
    let registry = this.registries.get(projectId);
    if (!registry) {
      registry = ts.createDocumentRegistry();
      this.registries.set(projectId, registry);
    }
    state.service = {
      compilerOptions,
      currentFileName,
      fileSystem,
      service: ts.createLanguageService(createHost(ts, fileSystem, compilerOptions), registry),
      structureKey,
    };
    state.languageServiceCreationCount += 1;
    return { service: state.service, state, ts };
  }
}
