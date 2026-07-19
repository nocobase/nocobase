/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';
import { posix as pathPosix } from 'path';

import { RUNJS_TYPESCRIPT_ES_LIB_PATH } from '../typescript-environment';
import { createRunJSTypeScriptCompilerOptions } from '../typescript-project';
import {
  buildRunJSUnresolvedCandidatePaths,
  type RunJSTypeDependencyContract,
  type RunJSTypeDependencyEdge,
  type RunJSTypeDependencyGraph,
  type RunJSUnresolvedDependency,
} from './dependency-collector';

export interface RunJSTypeScriptProjectFile {
  path: string;
  content: string;
  root: boolean;
}

export interface RunJSTypeScriptProjectUpdate {
  added: string[];
  changed: string[];
  deleted: string[];
  rootNamesChanged: boolean;
  unchanged: boolean;
}

export interface RunJSTypeScriptProjectDebugState {
  disposed: boolean;
  fileCount: number;
  rootCount: number;
  projectVersion: number;
  updateCount: number;
}

interface VersionedProjectFile extends RunJSTypeScriptProjectFile {
  version: number;
}

export class RunJSTypeScriptProject {
  private readonly compilerOptions = createRunJSTypeScriptCompilerOptions(ts);

  private readonly documentRegistry = ts.createDocumentRegistry(true, '/');

  private readonly files = new Map<string, VersionedProjectFile>();

  private readonly resolvedModules = new Map<string, Map<string, string | null>>();

  private rootNames: string[] = [];

  private projectVersion = 0;

  private updateCount = 0;

  private disposed = false;

  private readonly languageService: ts.LanguageService;

  constructor() {
    this.languageService = ts.createLanguageService(this.createLanguageServiceHost(), this.documentRegistry);
  }

  update(nextFiles: readonly RunJSTypeScriptProjectFile[]): RunJSTypeScriptProjectUpdate {
    this.assertActive();
    const normalized = new Map<string, RunJSTypeScriptProjectFile>();
    for (const file of nextFiles) {
      if (!file.path.startsWith('/')) {
        throw new TypeError(`RunJS TypeScript project path must be absolute: ${file.path}`);
      }
      const existing = normalized.get(file.path);
      if (existing && (existing.content !== file.content || existing.root !== file.root)) {
        throw new TypeError(`Conflicting RunJS TypeScript project file: ${file.path}`);
      }
      normalized.set(file.path, file);
    }

    const added: string[] = [];
    const changed: string[] = [];
    const deleted: string[] = [];
    for (const path of this.files.keys()) {
      if (!normalized.has(path)) {
        deleted.push(path);
      }
    }
    for (const [path, file] of normalized) {
      const current = this.files.get(path);
      if (!current) {
        added.push(path);
        continue;
      }
      if (current.content !== file.content || current.root !== file.root) {
        changed.push(path);
      }
    }

    const nextRootNames = [...normalized.values()]
      .filter((file) => file.root)
      .map((file) => file.path)
      .sort();
    const rootNamesChanged = !arraysEqual(this.rootNames, nextRootNames);
    const unchanged = added.length === 0 && changed.length === 0 && deleted.length === 0 && !rootNamesChanged;
    if (unchanged) {
      return { added, changed, deleted, rootNamesChanged, unchanged };
    }

    for (const path of deleted) {
      this.files.delete(path);
      this.resolvedModules.delete(path);
    }
    for (const [path, file] of normalized) {
      const current = this.files.get(path);
      if (current && current.content === file.content && current.root === file.root) {
        continue;
      }
      this.resolvedModules.delete(path);
      this.files.set(path, {
        ...file,
        version: current ? current.version + 1 : 1,
      });
    }
    this.rootNames = nextRootNames;
    this.projectVersion += 1;
    this.updateCount += 1;
    return { added, changed, deleted, rootNamesChanged, unchanged };
  }

  getDiagnostics(paths: readonly string[]): ts.Diagnostic[] {
    this.assertActive();
    const diagnostics: ts.Diagnostic[] = [];
    for (const path of [...new Set(paths)].sort()) {
      if (!this.files.has(path)) {
        continue;
      }
      diagnostics.push(...this.languageService.getSyntacticDiagnostics(path));
      diagnostics.push(...this.languageService.getSemanticDiagnostics(path));
    }
    return diagnostics;
  }

  getProgramWorkspacePaths(workspacePaths: readonly string[]): string[] {
    this.assertActive();
    const program = this.languageService.getProgram();
    if (!program) {
      return [];
    }
    return [...new Set(workspacePaths.map(normalizeVirtualPath))]
      .filter((path) => Boolean(program.getSourceFile(path)))
      .sort();
  }

  getDependencyGraph(input: {
    workspacePaths: readonly string[];
    contracts: readonly RunJSTypeDependencyContract[];
  }): RunJSTypeDependencyGraph & { unresolved: RunJSUnresolvedDependency[] } {
    this.assertActive();
    const program = this.languageService.getProgram();
    if (!program) {
      throw new Error('RunJS TypeScript Program is unavailable after diagnostics');
    }
    const workspacePaths = [...new Set(input.workspacePaths.map(normalizeVirtualPath))].sort();
    const workspacePathSet = new Set(workspacePaths);
    const files = workspacePaths.filter((path) => Boolean(program.getSourceFile(path))).map(fromVirtualPath);
    const edges = new Map<string, RunJSTypeDependencyEdge>();
    const unresolved = new Map<string, RunJSUnresolvedDependency>();

    for (const containingFile of workspacePaths) {
      const sourceFile = program.getSourceFile(containingFile);
      if (!sourceFile) {
        continue;
      }
      const resolutions = this.resolvedModules.get(containingFile) || new Map<string, string | null>();
      for (const reference of collectModuleReferences(sourceFile)) {
        const resolvedPath = resolutions.get(reference.specifier);
        if (resolvedPath && workspacePathSet.has(resolvedPath)) {
          const edge = {
            importer: fromVirtualPath(containingFile),
            imported: fromVirtualPath(resolvedPath),
            kind: reference.kind,
          };
          edges.set(`${edge.importer}\u0000${edge.imported}\u0000${edge.kind}`, edge);
          continue;
        }
        if (!resolvedPath) {
          const importer = fromVirtualPath(containingFile);
          const dependency = {
            importer,
            specifier: reference.specifier,
            kind: reference.kind,
            candidatePaths: buildRunJSUnresolvedCandidatePaths(importer, reference.specifier),
          } satisfies RunJSUnresolvedDependency;
          unresolved.set(JSON.stringify(dependency), dependency);
        }
      }
      for (const reference of sourceFile.referencedFiles) {
        const resolvedPath = normalizeVirtualPath(
          pathPosix.resolve(pathPosix.dirname(containingFile), reference.fileName),
        );
        if (workspacePathSet.has(resolvedPath) && program.getSourceFile(resolvedPath)) {
          const edge = {
            importer: fromVirtualPath(containingFile),
            imported: fromVirtualPath(resolvedPath),
            kind: 'reference' as const,
          };
          edges.set(`${edge.importer}\u0000${edge.imported}\u0000${edge.kind}`, edge);
        } else {
          const importer = fromVirtualPath(containingFile);
          const dependency = {
            importer,
            specifier: reference.fileName,
            kind: 'reference' as const,
            candidatePaths: buildRunJSUnresolvedCandidatePaths(importer, reference.fileName),
          };
          unresolved.set(JSON.stringify(dependency), dependency);
        }
      }
    }

    return {
      files,
      edges: [...edges.values()].sort(compareTypeEdges),
      contracts: [...input.contracts].sort(compareContracts),
      unresolved: [...unresolved.values()].sort(compareUnresolved),
    };
  }

  getDebugState(): RunJSTypeScriptProjectDebugState {
    return {
      disposed: this.disposed,
      fileCount: this.files.size,
      rootCount: this.rootNames.length,
      projectVersion: this.projectVersion,
      updateCount: this.updateCount,
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.languageService.dispose();
    this.files.clear();
    this.resolvedModules.clear();
    this.rootNames = [];
  }

  private createLanguageServiceHost(): ts.LanguageServiceHost {
    return {
      directoryExists: (path) => this.directoryExists(path),
      fileExists: (path) => this.files.has(normalizeVirtualPath(path)),
      getCompilationSettings: () => this.compilerOptions,
      getCurrentDirectory: () => '/',
      getDefaultLibFileName: () => RUNJS_TYPESCRIPT_ES_LIB_PATH,
      getNewLine: () => '\n',
      getProjectVersion: () => String(this.projectVersion),
      getScriptFileNames: () => this.rootNames,
      getScriptKind: (path) => getScriptKind(path),
      getScriptSnapshot: (path) => {
        const file = this.files.get(normalizeVirtualPath(path));
        return file ? ts.ScriptSnapshot.fromString(file.content) : undefined;
      },
      getScriptVersion: (path) => String(this.files.get(normalizeVirtualPath(path))?.version || 0),
      readFile: (path) => this.files.get(normalizeVirtualPath(path))?.content,
      realpath: (path) => normalizeVirtualPath(path),
      resolveModuleNames: (moduleNames, containingFile) => {
        const normalizedContainingFile = normalizeVirtualPath(containingFile);
        const resolutions = new Map<string, string | null>();
        const resolved = moduleNames.map((moduleName) => {
          const resolution = ts.resolveModuleName(moduleName, containingFile, this.compilerOptions, {
            directoryExists: (path) => this.directoryExists(path),
            fileExists: (path) => this.files.has(normalizeVirtualPath(path)),
            readFile: (path) => this.files.get(normalizeVirtualPath(path))?.content,
            realpath: (path) => normalizeVirtualPath(path),
          }).resolvedModule;
          resolutions.set(moduleName, resolution ? normalizeVirtualPath(resolution.resolvedFileName) : null);
          return resolution;
        });
        this.resolvedModules.set(normalizedContainingFile, resolutions);
        return resolved;
      },
      useCaseSensitiveFileNames: () => true,
    };
  }

  private directoryExists(path: string): boolean {
    const normalized = normalizeVirtualPath(path);
    if (normalized === '/') {
      return true;
    }
    const prefix = `${normalized}/`;
    return [...this.files.keys()].some((filePath) => filePath.startsWith(prefix));
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('RunJS TypeScript project has been disposed.');
    }
  }
}

interface TypeModuleReference {
  kind: 'runtime' | 'type';
  specifier: string;
}

function collectModuleReferences(sourceFile: ts.SourceFile): TypeModuleReference[] {
  const references: TypeModuleReference[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteralLike(statement.moduleSpecifier)) {
      references.push({
        kind: isTypeOnlyImport(statement) ? 'type' : 'runtime',
        specifier: statement.moduleSpecifier.text,
      });
      continue;
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      references.push({
        kind: isTypeOnlyExport(statement) ? 'type' : 'runtime',
        specifier: statement.moduleSpecifier.text,
      });
    }
  }
  return references;
}

function isTypeOnlyImport(statement: ts.ImportDeclaration): boolean {
  const clause = statement.importClause;
  if (!clause) {
    return false;
  }
  if (clause.isTypeOnly) {
    return true;
  }
  return Boolean(
    !clause.name &&
      clause.namedBindings &&
      ts.isNamedImports(clause.namedBindings) &&
      clause.namedBindings.elements.length > 0 &&
      clause.namedBindings.elements.every((element) => element.isTypeOnly),
  );
}

function isTypeOnlyExport(statement: ts.ExportDeclaration): boolean {
  if (statement.isTypeOnly) {
    return true;
  }
  return Boolean(
    statement.exportClause &&
      ts.isNamedExports(statement.exportClause) &&
      statement.exportClause.elements.length > 0 &&
      statement.exportClause.elements.every((element) => element.isTypeOnly),
  );
}

function fromVirtualPath(path: string): string {
  return normalizeVirtualPath(path).replace(/^\/+/, '');
}

function compareTypeEdges(left: RunJSTypeDependencyEdge, right: RunJSTypeDependencyEdge): number {
  return (
    left.importer.localeCompare(right.importer) ||
    left.imported.localeCompare(right.imported) ||
    left.kind.localeCompare(right.kind)
  );
}

function compareContracts(left: RunJSTypeDependencyContract, right: RunJSTypeDependencyContract): number {
  return (
    left.id.localeCompare(right.id) ||
    String(left.version || '').localeCompare(String(right.version || '')) ||
    String(left.contentHash || '').localeCompare(String(right.contentHash || ''))
  );
}

function compareUnresolved(left: RunJSUnresolvedDependency, right: RunJSUnresolvedDependency): number {
  return (
    left.importer.localeCompare(right.importer) ||
    left.specifier.localeCompare(right.specifier) ||
    String(left.kind || '').localeCompare(String(right.kind || '')) ||
    left.candidatePaths.join('\u0000').localeCompare(right.candidatePaths.join('\u0000'))
  );
}

function getScriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (path.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (path.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }
  if (path.endsWith('.json')) {
    return ts.ScriptKind.JSON;
  }
  return ts.ScriptKind.TS;
}

function normalizeVirtualPath(path: string): string {
  const normalized = path.replace(/\\/gu, '/').replace(/\/+$/u, '');
  return normalized || '/';
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
