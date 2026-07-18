/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

import {
  hashRunJSEntryDependencyManifest,
  normalizePath,
  normalizeRunJSEntryDependencyManifest,
  sha256Hex,
  type RunJSDependencyFile,
  type RunJSEntryDependencyManifestV1,
  type RunJSRuntimeDependencyEdge,
  type RunJSTypeDependencyContract,
  type RunJSTypeDependencyEdge,
  type RunJSTypeDependencyEdgeKind,
  type RunJSUnresolvedDependency,
  type RunJSUnresolvedDependencyKind,
} from '..';
import { createRunJSTypeScriptCompilerOptions } from '../typescript-project';
import {
  resolveRunJSBuiltInModule,
  resolveRunJSWorkspaceImport,
  RUNJS_RESOLVABLE_EXTENSIONS,
  runJSVirtualDirname,
  runJSVirtualExtname,
  runJSVirtualJoin,
} from './portable';

export interface RunJSDependencyCollectorFile {
  path: string;
  content: string;
  blobHash?: string;
}

export interface CollectRunJSWorkspaceDependencyManifestInput {
  compilerBuildId: string;
  entryPath: string;
  files: readonly RunJSDependencyCollectorFile[];
  typeRoots?: readonly string[];
  typeContracts?: readonly RunJSTypeDependencyContract[];
  externalModules?: readonly string[];
}

export interface CollectRunJSWorkspaceDependencyManifestResult {
  manifest: RunJSEntryDependencyManifestV1;
  manifestHash: string;
}

export interface RunJSRuntimeDependencyGraph {
  files: string[];
  edges: RunJSRuntimeDependencyEdge[];
}

export interface RunJSTypeDependencyGraph {
  files: string[];
  edges: RunJSTypeDependencyEdge[];
  contracts: RunJSTypeDependencyContract[];
}

export interface RunJSResolvedDependencyGraph {
  runtime: RunJSRuntimeDependencyGraph;
  types: RunJSTypeDependencyGraph;
  unresolved: RunJSUnresolvedDependency[];
}

export class RunJSRuntimeDependencyGraphCollector {
  private readonly files = new Set<string>();

  private readonly edges = new Map<string, RunJSRuntimeDependencyEdge>();

  private readonly unresolved = new Map<string, RunJSUnresolvedDependency>();

  reset(): void {
    this.files.clear();
    this.edges.clear();
    this.unresolved.clear();
  }

  recordFile(path: string): void {
    this.files.add(normalizeCollectorPath(path));
  }

  recordEdge(edge: RunJSRuntimeDependencyEdge): void {
    const normalized = normalizeRuntimeEdge(edge);
    this.edges.set(`${normalized.importer}\u0000${normalized.imported}`, normalized);
  }

  recordUnresolved(dependency: RunJSUnresolvedDependency): void {
    recordUnresolvedDependency(this.unresolved, dependency);
  }

  snapshot(): RunJSRuntimeDependencyGraph & { unresolved: RunJSUnresolvedDependency[] } {
    return {
      files: [...this.files].sort(compareText),
      edges: [...this.edges.values()].sort(compareRuntimeEdges),
      unresolved: [...this.unresolved.values()].sort(compareUnresolved),
    };
  }
}

interface NormalizedCollectorFile extends RunJSDependencyFile {
  content: string;
}

interface CollectedModuleReference {
  kind: 'runtime' | 'type' | 'reference' | 'dynamic' | 'require';
  specifier: string;
}

export class RunJSRuntimeDependencyCollector {
  private readonly files = new Map<string, RunJSDependencyFile>();
  private readonly edges = new Map<string, RunJSRuntimeDependencyEdge>();
  private readonly unresolved = new Map<string, RunJSUnresolvedDependency>();

  recordFile(file: RunJSDependencyFile): void {
    recordDependencyFile(this.files, file);
  }

  recordEdge(edge: RunJSRuntimeDependencyEdge): void {
    const normalized = normalizeRuntimeEdge(edge);
    this.edges.set(`${normalized.importer}\u0000${normalized.imported}`, normalized);
  }

  recordUnresolved(dependency: RunJSUnresolvedDependency): void {
    recordUnresolvedDependency(this.unresolved, dependency);
  }

  snapshot(): {
    files: RunJSDependencyFile[];
    edges: RunJSRuntimeDependencyEdge[];
    unresolved: RunJSUnresolvedDependency[];
  } {
    return {
      files: [...this.files.values()].sort(compareDependencyFiles),
      edges: [...this.edges.values()].sort(compareRuntimeEdges),
      unresolved: [...this.unresolved.values()].sort(compareUnresolved),
    };
  }
}

export class RunJSTypeDependencyCollector {
  private readonly files = new Map<string, RunJSDependencyFile>();
  private readonly edges = new Map<string, RunJSTypeDependencyEdge>();
  private readonly contracts = new Map<string, RunJSTypeDependencyContract>();
  private readonly unresolved = new Map<string, RunJSUnresolvedDependency>();

  recordFile(file: RunJSDependencyFile): void {
    recordDependencyFile(this.files, file);
  }

  recordEdge(edge: RunJSTypeDependencyEdge): void {
    const normalized = normalizeTypeEdge(edge);
    this.edges.set(`${normalized.importer}\u0000${normalized.imported}\u0000${normalized.kind}`, normalized);
  }

  recordContract(contract: RunJSTypeDependencyContract): void {
    const normalized = normalizeContract(contract);
    this.contracts.set(JSON.stringify(normalized), normalized);
  }

  recordUnresolved(dependency: RunJSUnresolvedDependency): void {
    recordUnresolvedDependency(this.unresolved, dependency);
  }

  snapshot(): {
    files: RunJSDependencyFile[];
    edges: RunJSTypeDependencyEdge[];
    contracts: RunJSTypeDependencyContract[];
    unresolved: RunJSUnresolvedDependency[];
  } {
    return {
      files: [...this.files.values()].sort(compareDependencyFiles),
      edges: [...this.edges.values()].sort(compareTypeEdges),
      contracts: [...this.contracts.values()].sort(compareContracts),
      unresolved: [...this.unresolved.values()].sort(compareUnresolved),
    };
  }
}

export function collectRunJSWorkspaceDependencyManifest(
  input: CollectRunJSWorkspaceDependencyManifestInput,
): CollectRunJSWorkspaceDependencyManifestResult {
  const files = normalizeCollectorFiles(input.files);
  const entryPath = normalizePath(input.entryPath);
  const entry = files.get(entryPath);
  if (!entry) {
    throw new TypeError(`RunJS dependency manifest entry was not found: ${entryPath}`);
  }

  const references = new Map<string, CollectedModuleReference[]>();
  for (const file of files.values()) {
    references.set(file.path, collectModuleReferences(file));
  }
  const externalModules = new Set([
    ...Object.keys(resolveDefaultExternalModules()),
    ...(input.externalModules || []).map((moduleName) => String(moduleName || '').trim()).filter(Boolean),
  ]);
  const runtimeCollector = new RunJSRuntimeDependencyCollector();
  const typeCollector = new RunJSTypeDependencyCollector();

  collectRuntimeClosure(entryPath, files, references, externalModules, runtimeCollector);
  collectTypeClosure([entryPath, ...(input.typeRoots || [])], files, references, externalModules, typeCollector);
  for (const contract of input.typeContracts || []) {
    typeCollector.recordContract(contract);
  }

  const runtime = runtimeCollector.snapshot();
  const types = typeCollector.snapshot();
  const manifest = normalizeRunJSEntryDependencyManifest({
    version: 1,
    compilerBuildId: input.compilerBuildId,
    entryPath,
    runtime: { files: runtime.files, edges: runtime.edges },
    types: { files: types.files, edges: types.edges, contracts: types.contracts },
    unresolved: [...runtime.unresolved, ...types.unresolved],
  });
  return { manifest, manifestHash: hashRunJSEntryDependencyManifest(manifest) };
}

export function buildRunJSEntryDependencyManifestFromGraph(input: {
  compilerBuildId: string;
  entryPath: string;
  files: readonly { path: string; content?: string; blobHash?: string }[];
  graph: RunJSResolvedDependencyGraph;
}): CollectRunJSWorkspaceDependencyManifestResult {
  const files = new Map(
    input.files.map((file) => {
      const path = normalizeCollectorPath(file.path);
      const blobHash = file.blobHash || (typeof file.content === 'string' ? sha256Hex(file.content) : undefined);
      if (!blobHash) {
        throw new TypeError(`RunJS dependency manifest file hash was not provided: ${path}`);
      }
      return [path, { path, blobHash }] as const;
    }),
  );
  const dependencyFile = (path: string): RunJSDependencyFile => {
    const normalizedPath = normalizeCollectorPath(path);
    const file = files.get(normalizedPath);
    if (!file) {
      throw new TypeError(`RunJS dependency graph references a file outside the compile input: ${normalizedPath}`);
    }
    return file;
  };
  const manifest = normalizeRunJSEntryDependencyManifest({
    version: 1,
    compilerBuildId: input.compilerBuildId,
    entryPath: input.entryPath,
    runtime: {
      files: input.graph.runtime.files.map(dependencyFile),
      edges: input.graph.runtime.edges,
    },
    types: {
      files: input.graph.types.files.map(dependencyFile),
      edges: input.graph.types.edges,
      contracts: input.graph.types.contracts,
    },
    unresolved: input.graph.unresolved,
  });
  return { manifest, manifestHash: hashRunJSEntryDependencyManifest(manifest) };
}

export function buildRunJSUnresolvedCandidatePaths(importer: string, specifier: string): string[] {
  const normalizedImporter = normalizeCollectorPath(importer);
  if (!isRelativeSpecifier(specifier)) {
    return [];
  }
  const base = runJSVirtualJoin(runJSVirtualDirname(normalizedImporter), specifier);
  if (!base || base === '..' || base.startsWith('../')) {
    return [];
  }
  if (runJSVirtualExtname(base)) {
    return [normalizeCollectorPath(base)];
  }
  return [
    ...RUNJS_RESOLVABLE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RUNJS_RESOLVABLE_EXTENSIONS.map((extension) => runJSVirtualJoin(base, `index${extension}`)),
  ]
    .map(normalizeCollectorPath)
    .sort(compareText);
}

function collectRuntimeClosure(
  entryPath: string,
  files: ReadonlyMap<string, NormalizedCollectorFile>,
  references: ReadonlyMap<string, readonly CollectedModuleReference[]>,
  externalModules: ReadonlySet<string>,
  collector: RunJSRuntimeDependencyCollector,
): void {
  const pending = [entryPath];
  const visited = new Set<string>();
  const availablePaths = new Set(files.keys());
  while (pending.length) {
    const importer = pending.shift() as string;
    if (visited.has(importer)) {
      continue;
    }
    visited.add(importer);
    const file = files.get(importer);
    if (!file) {
      continue;
    }
    collector.recordFile(file);

    for (const reference of references.get(importer) || []) {
      if (reference.kind === 'type' || reference.kind === 'reference') {
        continue;
      }
      if (reference.kind === 'dynamic') {
        collector.recordUnresolved(
          unresolvedDependency(
            importer,
            reference.specifier,
            'dynamic',
            buildRunJSUnresolvedCandidatePaths(importer, reference.specifier),
          ),
        );
        continue;
      }
      if (reference.kind === 'require') {
        collector.recordUnresolved(
          unresolvedDependency(
            importer,
            reference.specifier,
            'blocked',
            buildRunJSUnresolvedCandidatePaths(importer, reference.specifier),
          ),
        );
        continue;
      }
      if (!isRelativeSpecifier(reference.specifier)) {
        if (!externalModules.has(reference.specifier)) {
          collector.recordUnresolved(unresolvedDependency(importer, reference.specifier, 'blocked', []));
        }
        continue;
      }

      const resolution = resolveRunJSWorkspaceImport(importer, reference.specifier, availablePaths);
      if (resolution.status === 'resolved') {
        collector.recordEdge({ importer, imported: resolution.path });
        pending.push(resolution.path);
      } else {
        collector.recordUnresolved(
          unresolvedDependency(
            importer,
            reference.specifier,
            resolution.status === 'blocked' ? 'blocked' : 'runtime',
            buildRunJSUnresolvedCandidatePaths(importer, reference.specifier),
          ),
        );
      }
    }
  }
}

function collectTypeClosure(
  roots: readonly string[],
  files: ReadonlyMap<string, NormalizedCollectorFile>,
  references: ReadonlyMap<string, readonly CollectedModuleReference[]>,
  externalModules: ReadonlySet<string>,
  collector: RunJSTypeDependencyCollector,
): void {
  const pending = [...new Set(roots.map(normalizeCollectorPath))].sort(compareText);
  const visited = new Set<string>();
  const resolutionHost = createTypeResolutionHost(files);
  const compilerOptions = createRunJSTypeScriptCompilerOptions(ts);
  while (pending.length) {
    const importer = pending.shift() as string;
    if (visited.has(importer)) {
      continue;
    }
    visited.add(importer);
    const file = files.get(importer);
    if (!file) {
      collector.recordUnresolved(unresolvedDependency(importer, importer, 'reference', [importer]));
      continue;
    }
    collector.recordFile(file);

    for (const reference of references.get(importer) || []) {
      if (reference.kind === 'dynamic' || reference.kind === 'require') {
        continue;
      }
      if (!isRelativeSpecifier(reference.specifier)) {
        if (!externalModules.has(reference.specifier)) {
          collector.recordUnresolved(unresolvedDependency(importer, reference.specifier, reference.kind, []));
        }
        continue;
      }
      const resolved = ts.resolveModuleName(
        reference.specifier,
        `/${importer}`,
        compilerOptions,
        resolutionHost,
      ).resolvedModule;
      const resolvedPath = resolved ? fromVirtualPath(resolved.resolvedFileName) : undefined;
      if (resolvedPath && files.has(resolvedPath)) {
        const kind = reference.kind === 'reference' ? 'reference' : reference.kind;
        collector.recordEdge({ importer, imported: resolvedPath, kind });
        pending.push(resolvedPath);
      } else {
        collector.recordUnresolved(
          unresolvedDependency(
            importer,
            reference.specifier,
            reference.kind,
            buildRunJSUnresolvedCandidatePaths(importer, reference.specifier),
          ),
        );
      }
    }
  }
}

function collectModuleReferences(file: NormalizedCollectorFile): CollectedModuleReference[] {
  if (file.path.endsWith('.json')) {
    return [];
  }
  const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, scriptKind(file.path));
  const references: CollectedModuleReference[] = [];

  for (const referencedFile of sourceFile.referencedFiles) {
    references.push({ kind: 'reference', specifier: referencedFile.fileName });
  }
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
      continue;
    }
    if (
      ts.isImportEqualsDeclaration(statement) &&
      ts.isExternalModuleReference(statement.moduleReference) &&
      statement.moduleReference.expression &&
      ts.isStringLiteralLike(statement.moduleReference.expression)
    ) {
      references.push({ kind: 'require', specifier: statement.moduleReference.expression.text });
    }
  }

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        references.push({ kind: 'dynamic', specifier: node.arguments[0].text });
      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        references.push({ kind: 'require', specifier: node.arguments[0].text });
      }
    }
    ts.forEachChild(node, visit);
  };
  sourceFile.forEachChild(visit);
  return uniqueModuleReferences(references);
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

function normalizeCollectorFiles(files: readonly RunJSDependencyCollectorFile[]): Map<string, NormalizedCollectorFile> {
  const normalized = new Map<string, NormalizedCollectorFile>();
  for (const file of files) {
    const path = normalizeCollectorPath(file.path);
    const next = {
      path,
      content: file.content,
      blobHash: file.blobHash || sha256Hex(file.content),
    };
    const existing = normalized.get(path);
    if (existing && (existing.content !== next.content || existing.blobHash !== next.blobHash)) {
      throw new TypeError(`Conflicting RunJS dependency collector file: ${path}`);
    }
    normalized.set(path, next);
  }
  return normalized;
}

function createTypeResolutionHost(files: ReadonlyMap<string, NormalizedCollectorFile>): ts.ModuleResolutionHost {
  const virtualFiles = new Map([...files].map(([path, file]) => [`/${path}`, file.content]));
  const directories = new Set(['/']);
  for (const path of virtualFiles.keys()) {
    const segments = path.split('/').filter(Boolean);
    let directory = '';
    for (const segment of segments.slice(0, -1)) {
      directory += `/${segment}`;
      directories.add(directory);
    }
  }
  return {
    directoryExists: (path) => directories.has(normalizeVirtualPath(path)),
    fileExists: (path) => virtualFiles.has(normalizeVirtualPath(path)),
    getCurrentDirectory: () => '/',
    readFile: (path) => virtualFiles.get(normalizeVirtualPath(path)),
    realpath: normalizeVirtualPath,
  };
}

function normalizeRuntimeEdge(edge: RunJSRuntimeDependencyEdge): RunJSRuntimeDependencyEdge {
  return { importer: normalizeCollectorPath(edge.importer), imported: normalizeCollectorPath(edge.imported) };
}

function normalizeTypeEdge(edge: RunJSTypeDependencyEdge): RunJSTypeDependencyEdge {
  return { ...normalizeRuntimeEdge(edge), kind: normalizeTypeEdgeKind(edge.kind) };
}

function normalizeTypeEdgeKind(kind: RunJSTypeDependencyEdgeKind): RunJSTypeDependencyEdgeKind {
  if (kind !== 'runtime' && kind !== 'type' && kind !== 'reference') {
    throw new TypeError(`Unsupported RunJS type dependency edge kind: ${kind}`);
  }
  return kind;
}

function normalizeContract(contract: RunJSTypeDependencyContract): RunJSTypeDependencyContract {
  if (!contract.id?.trim()) {
    throw new TypeError('RunJS type dependency contract id must not be empty');
  }
  return {
    id: contract.id,
    ...(contract.version ? { version: contract.version } : {}),
    ...(contract.contentHash ? { contentHash: contract.contentHash } : {}),
  };
}

function recordDependencyFile(files: Map<string, RunJSDependencyFile>, file: RunJSDependencyFile): void {
  const normalized = { path: normalizeCollectorPath(file.path), blobHash: String(file.blobHash || '') };
  if (!normalized.blobHash) {
    throw new TypeError(`RunJS dependency file blob hash must not be empty: ${normalized.path}`);
  }
  const existing = files.get(normalized.path);
  if (existing && existing.blobHash !== normalized.blobHash) {
    throw new TypeError(`Conflicting RunJS dependency file hashes: ${normalized.path}`);
  }
  files.set(normalized.path, normalized);
}

function recordUnresolvedDependency(
  unresolved: Map<string, RunJSUnresolvedDependency>,
  dependency: RunJSUnresolvedDependency,
): void {
  const normalized = unresolvedDependency(
    dependency.importer,
    dependency.specifier,
    dependency.kind || 'runtime',
    dependency.candidatePaths,
  );
  unresolved.set(JSON.stringify(normalized), normalized);
}

function unresolvedDependency(
  importer: string,
  specifier: string,
  kind: RunJSUnresolvedDependencyKind,
  candidatePaths: readonly string[],
): RunJSUnresolvedDependency {
  return {
    importer: normalizeCollectorPath(importer),
    specifier,
    kind,
    candidatePaths: [...new Set(candidatePaths.map(normalizeCollectorPath))].sort(compareText),
  };
}

function uniqueModuleReferences(references: readonly CollectedModuleReference[]): CollectedModuleReference[] {
  return [
    ...new Map(references.map((reference) => [`${reference.kind}\u0000${reference.specifier}`, reference])).values(),
  ].sort((left, right) => compareText(left.kind, right.kind) || compareText(left.specifier, right.specifier));
}

function resolveDefaultExternalModules(): Record<string, string> {
  const modules: Record<string, string> = {};
  for (const moduleName of [
    'react',
    'react-dom/client',
    'antd',
    '@ant-design/icons',
    'dayjs',
    'lodash',
    'mathjs',
    '@formulajs/formulajs',
    '@nocobase/sdk/client',
  ]) {
    const runtimeName = resolveRunJSBuiltInModule(moduleName);
    if (runtimeName) {
      modules[moduleName] = runtimeName;
    }
  }
  return modules;
}

function isRelativeSpecifier(specifier: string): boolean {
  return specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../');
}

function fromVirtualPath(path: string): string {
  return normalizePath(path.replace(/^\/+/, ''));
}

function normalizeCollectorPath(path: string): string {
  return normalizePath(
    String(path || '')
      .replace(/\\/gu, '/')
      .replace(/^\.\//u, ''),
  );
}

function normalizeVirtualPath(path: string): string {
  const normalized = path.replace(/\\/gu, '/').replace(/\/+$/u, '');
  return normalized || '/';
}

function scriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (path.endsWith('.js')) return ts.ScriptKind.JS;
  if (path.endsWith('.json')) return ts.ScriptKind.JSON;
  return ts.ScriptKind.TS;
}

function compareDependencyFiles(left: RunJSDependencyFile, right: RunJSDependencyFile): number {
  return compareText(left.path, right.path) || compareText(left.blobHash, right.blobHash);
}

function compareRuntimeEdges(left: RunJSRuntimeDependencyEdge, right: RunJSRuntimeDependencyEdge): number {
  return compareText(left.importer, right.importer) || compareText(left.imported, right.imported);
}

function compareTypeEdges(left: RunJSTypeDependencyEdge, right: RunJSTypeDependencyEdge): number {
  return compareRuntimeEdges(left, right) || compareText(left.kind, right.kind);
}

function compareContracts(left: RunJSTypeDependencyContract, right: RunJSTypeDependencyContract): number {
  return (
    compareText(left.id, right.id) ||
    compareText(left.version || '', right.version || '') ||
    compareText(left.contentHash || '', right.contentHash || '')
  );
}

function compareUnresolved(left: RunJSUnresolvedDependency, right: RunJSUnresolvedDependency): number {
  return (
    compareText(left.importer, right.importer) ||
    compareText(left.specifier, right.specifier) ||
    compareText(left.kind || '', right.kind || '') ||
    compareText(left.candidatePaths.join('\u0000'), right.candidatePaths.join('\u0000'))
  );
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
