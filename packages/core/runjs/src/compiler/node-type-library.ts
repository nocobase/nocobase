/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

import { sha256Hex, stableSerialize, type RunJSTypeDependencyContract } from '..';
import {
  generatedRunJSAntdCompletionCatalog,
  generatedRunJSAntdIconsCompletionCatalog,
} from '../completion-catalog/generated';
import { RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION } from '../lodash-type-library';
import type {
  RunJSTypeLibraryFile,
  RunJSTypeLibraryPackDependency,
  RunJSTypeLibraryRequest,
  RunJSTypeLibraryUsageDefinition,
} from '../typescript-library';
import { selectRunJSTypeLibraryRequests } from '../typescript-library';
import {
  createRunJSAntdIconsTypeLibraryPackDefinitions,
  RUNJS_ANTD_ICONS_FULL_PACK_ID,
} from '../type-packs/antd-icons';
import { createRunJSAntdTypeLibraryPackDefinitions, RUNJS_ANTD_FULL_PACK_ID } from '../type-packs/antd';
import { RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION } from '../type-packs/dayjs';
import { RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION } from '../type-packs/formulajs';
import { collectRunJSTypeDeclarationGraphSync, type RunJSTypeLibraryPackDefinition } from '../type-packs/generator';
import { RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION } from '../type-packs/mathjs';
import {
  RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_PATH,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
  RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_PATH,
} from '../typescript-project';

export interface NodeRunJSTypeLibraryFiles {
  dependencyFiles: readonly RunJSTypeLibraryFile[];
  rootFiles: readonly RunJSTypeLibraryFile[];
}

export interface NodeRunJSTypeLibraryLoadResult extends NodeRunJSTypeLibraryFiles {
  contracts: RunJSTypeDependencyContract[];
}

export interface NodeRunJSTypeLibraryProvider {
  id: string;
  libraryName: string;
  load(request: RunJSTypeLibraryRequest): NodeRunJSTypeLibraryFiles;
  version?: string;
  contentHash?: string;
  dependencies?: readonly RunJSTypeLibraryPackDependency[];
  moduleNames?: readonly string[];
  topLevelNames?: readonly string[];
}

type StoredProvider = NodeRunJSTypeLibraryProvider & { token: symbol };

const emptyFiles: NodeRunJSTypeLibraryFiles = { dependencyFiles: [], rootFiles: [] };

export class NodeRunJSTypeLibraryRegistry {
  private readonly providers = new Map<string, StoredProvider>();
  private readonly loadedFullFiles = new Map<string, { id: string; files: NodeRunJSTypeLibraryFiles }>();
  private disposed = false;

  constructor(private readonly parent?: NodeRunJSTypeLibraryRegistry) {}

  register(provider: NodeRunJSTypeLibraryProvider): () => void {
    this.assertActive();
    const id = normalizeRequired(provider.id, 'Node RunJS TypeScript library id');
    const libraryName = normalizeRequired(provider.libraryName, 'Node RunJS TypeScript library name');
    if (this.has(id)) throw new Error(`Node RunJS TypeScript library is already registered: ${id}`);
    const stored: StoredProvider = { ...provider, id, libraryName, token: Symbol(id) };
    this.providers.set(id, stored);
    return () => {
      if (this.providers.get(id)?.token === stored.token) {
        this.providers.delete(id);
        for (const [libraryName, full] of this.loadedFullFiles) {
          if (full.id === id) this.loadedFullFiles.delete(libraryName);
        }
      }
    };
  }

  has(id: string): boolean {
    return this.providers.has(id) || Boolean(this.parent?.has(id));
  }

  getUsageDefinitions(): RunJSTypeLibraryUsageDefinition[] {
    const definitions = new Map<string, RunJSTypeLibraryUsageDefinition>();
    for (const definition of this.parent?.getUsageDefinitions() || [])
      definitions.set(definition.libraryName, definition);
    for (const provider of this.providers.values()) {
      definitions.set(provider.libraryName, {
        libraryName: provider.libraryName,
        moduleNames: provider.moduleNames,
        packId: provider.id,
        topLevelNames: provider.topLevelNames,
      });
    }
    return [...definitions.values()].sort((left, right) => left.libraryName.localeCompare(right.libraryName));
  }

  createExplicitRequests(ids: readonly string[]): RunJSTypeLibraryRequest[] {
    return [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))].sort().map((id) => {
      const provider = this.resolve(id);
      if (!provider) throw new Error(`Node RunJS TypeScript library is not registered: ${id}`);
      return id.endsWith('/full')
        ? { kind: 'full', libraryName: provider.libraryName, packId: provider.id }
        : { kind: 'library', libraryName: provider.libraryName, packId: provider.id };
    });
  }

  load(
    requests: readonly RunJSTypeLibraryRequest[],
    typeLibraryIds: readonly string[] = [],
  ): NodeRunJSTypeLibraryFiles {
    return this.loadWithContracts(requests, typeLibraryIds);
  }

  loadWithContracts(
    requests: readonly RunJSTypeLibraryRequest[],
    typeLibraryIds: readonly string[] = [],
  ): NodeRunJSTypeLibraryLoadResult {
    this.assertActive();
    const allRequests = new Map(requests.map((request) => [request.packId, request]));
    for (const request of this.createExplicitRequests(typeLibraryIds)) allRequests.set(request.packId, request);
    const loadedFullPackIds = new Map<string, string>();
    for (const request of allRequests.values()) {
      const full = this.resolveLoadedFullFiles(request.libraryName);
      if (full) loadedFullPackIds.set(request.libraryName, full.id);
    }
    const loaded = new Map<string, NodeRunJSTypeLibraryFiles>();
    for (const request of selectRunJSTypeLibraryRequests([...allRequests.values()], loadedFullPackIds)) {
      if (this.has(request.packId)) this.collect(request, new Set<string>(), loaded);
    }
    const files = loaded.size ? mergePacks(loaded.values()) : emptyFiles;
    return {
      ...files,
      contracts: [...loaded.entries()]
        .map(([id, packFiles]) => {
          const provider = this.resolve(id);
          return {
            id: `runjs:type-library:${id}`,
            ...(provider?.version ? { version: provider.version } : {}),
            contentHash:
              provider?.contentHash ||
              sha256Hex(
                stableSerialize({
                  dependencyFiles: packFiles.dependencyFiles.map((file) => ({
                    path: file.path,
                    contentHash: file.contentHash,
                  })),
                  rootFiles: packFiles.rootFiles.map((file) => ({ path: file.path, contentHash: file.contentHash })),
                }),
              ),
          };
        })
        .sort((left, right) => left.id.localeCompare(right.id)),
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.providers.clear();
    this.loadedFullFiles.clear();
  }

  getDebugState(): { disposed: boolean; providerCount: number } {
    return { disposed: this.disposed, providerCount: this.providers.size };
  }

  private collect(
    request: RunJSTypeLibraryRequest,
    ancestors: ReadonlySet<string>,
    loaded: Map<string, NodeRunJSTypeLibraryFiles>,
  ): void {
    if (loaded.has(request.packId) || ancestors.has(request.packId)) return;
    const cachedFull = request.kind === 'full' ? this.resolveLoadedFullFiles(request.libraryName) : undefined;
    if (cachedFull?.id === request.packId) {
      loaded.set(cachedFull.id, cachedFull.files);
      return;
    }
    const provider = this.resolve(request.packId);
    if (!provider) return;
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(provider.id);
    for (const dependency of provider.dependencies || []) {
      if (nextAncestors.has(dependency.id)) continue;
      const dependencyProvider = this.resolve(dependency.id);
      if (!dependencyProvider)
        throw new Error(`Node RunJS TypeScript library dependency is not registered: ${dependency.id}`);
      if (
        (dependencyProvider.version && dependencyProvider.version !== dependency.version) ||
        (dependencyProvider.contentHash && dependencyProvider.contentHash !== dependency.contentHash)
      ) {
        throw new Error(`Node RunJS TypeScript library dependency mismatch: ${dependency.id}`);
      }
      this.collect(
        { kind: 'library', libraryName: dependencyProvider.libraryName, packId: dependency.id },
        nextAncestors,
        loaded,
      );
    }
    const files = provider.load(request);
    loaded.set(provider.id, files);
    if (request.kind === 'full') this.loadedFullFiles.set(request.libraryName, { files, id: provider.id });
  }

  private resolve(id: string): StoredProvider | undefined {
    return this.providers.get(id) || this.parent?.resolve(id);
  }

  private assertActive(): void {
    if (this.disposed) throw new Error('Node RunJS TypeScript library registry has been disposed.');
  }

  private resolveLoadedFullFiles(libraryName: string): { id: string; files: NodeRunJSTypeLibraryFiles } | undefined {
    return this.loadedFullFiles.get(libraryName) || this.parent?.resolveLoadedFullFiles(libraryName);
  }
}

const reactTypeLibraryDefinition: RunJSTypeLibraryPackDefinition = {
  id: 'react',
  libraryName: 'React',
  entry: 'react',
  rootFiles: [{ content: RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION, path: RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH }],
};
const reactDOMTypeLibraryDefinition: RunJSTypeLibraryPackDefinition = {
  id: 'react-dom/client',
  libraryName: 'ReactDOM',
  entry: 'react-dom/client',
  dependencies: ['react'],
  rootFiles: [{ content: RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION, path: RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_PATH }],
};
const clientSdkTypeLibraryDefinition: RunJSTypeLibraryPackDefinition = {
  id: '@nocobase/sdk/client',
  libraryName: 'clientSdk',
  entry: '@nocobase/sdk/client',
  rootFiles: [
    {
      content: RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_DECLARATION,
      path: RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_PATH,
    },
  ],
};

const declarationCache = new Map<string, NodeRunJSTypeLibraryFiles>();

function loadDeclaration(definition: RunJSTypeLibraryPackDefinition, projectRoot = process.cwd()) {
  const normalizedRoot = path.resolve(projectRoot);
  const cacheKey = `${normalizedRoot}:${definition.id}`;
  const cached = declarationCache.get(cacheKey);
  if (cached) return cached;
  const graph = collectRunJSTypeDeclarationGraphSync(normalizedRoot, definition.entry);
  const files: NodeRunJSTypeLibraryFiles = {
    dependencyFiles: graph.dependencyFiles,
    rootFiles: (definition.rootFiles || []).map((file) => ({
      content: file.content,
      contentHash: sha256Hex(file.content),
      path: file.path,
    })),
  };
  declarationCache.set(cacheKey, files);
  return files;
}

function loadDeclarationSet(
  request: RunJSTypeLibraryRequest,
  definitions: readonly RunJSTypeLibraryPackDefinition[],
): NodeRunJSTypeLibraryFiles {
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  const selected = new Map<string, RunJSTypeLibraryPackDefinition>();
  const collect = (id: string): void => {
    if (selected.has(id)) return;
    const definition = definitionsById.get(id);
    if (!definition) return;
    selected.set(id, definition);
    definition.dependencies?.forEach(collect);
  };
  collect(request.packId);
  return selected.size
    ? mergePacks([...selected.values()].sort(byId).map((definition) => loadDeclaration(definition)))
    : emptyFiles;
}

function byId(left: RunJSTypeLibraryPackDefinition, right: RunJSTypeLibraryPackDefinition): number {
  return left.id.localeCompare(right.id);
}

const defaultNodeRunJSTypeLibraryRegistry = new NodeRunJSTypeLibraryRegistry();
const antdTypeLibraryDefinitions = createRunJSAntdTypeLibraryPackDefinitions(generatedRunJSAntdCompletionCatalog);
const antdIconsTypeLibraryDefinitions = createRunJSAntdIconsTypeLibraryPackDefinitions(
  generatedRunJSAntdIconsCompletionCatalog,
);

defaultNodeRunJSTypeLibraryRegistry.register({
  id: 'react',
  libraryName: 'React',
  load: () => loadDeclaration(reactTypeLibraryDefinition),
  moduleNames: ['react'],
  topLevelNames: ['React'],
});
defaultNodeRunJSTypeLibraryRegistry.register({
  id: 'react-dom/client',
  libraryName: 'ReactDOM',
  load: (request) => loadDeclarationSet(request, [reactTypeLibraryDefinition, reactDOMTypeLibraryDefinition]),
  moduleNames: ['react-dom', 'react-dom/client'],
  topLevelNames: ['ReactDOM'],
});
defaultNodeRunJSTypeLibraryRegistry.register({
  id: 'dayjs',
  libraryName: 'dayjs',
  load: () => loadDeclaration(RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION),
  moduleNames: ['dayjs'],
  topLevelNames: ['dayjs'],
});
defaultNodeRunJSTypeLibraryRegistry.register({
  id: 'lodash',
  libraryName: 'lodash',
  load: () => loadDeclaration(RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION),
  moduleNames: ['lodash'],
});
defaultNodeRunJSTypeLibraryRegistry.register({
  id: 'mathjs',
  libraryName: 'math',
  load: () => loadDeclaration(RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION),
  moduleNames: ['mathjs'],
});
defaultNodeRunJSTypeLibraryRegistry.register({
  id: 'formulajs',
  libraryName: 'formula',
  load: () => loadDeclaration(RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION),
  moduleNames: ['@formulajs/formulajs'],
});
defaultNodeRunJSTypeLibraryRegistry.register({
  id: '@nocobase/sdk/client',
  libraryName: 'clientSdk',
  load: () => loadDeclaration(clientSdkTypeLibraryDefinition),
  moduleNames: ['@nocobase/sdk/client'],
});
for (const definition of antdTypeLibraryDefinitions) {
  defaultNodeRunJSTypeLibraryRegistry.register({
    id: definition.id,
    libraryName: 'antd',
    load: (request) => loadDeclarationSet(request, antdTypeLibraryDefinitions),
  });
}
for (const definition of antdIconsTypeLibraryDefinitions) {
  defaultNodeRunJSTypeLibraryRegistry.register({
    id: definition.id,
    libraryName: 'antdIcons',
    load: (request) => loadDeclarationSet(request, antdIconsTypeLibraryDefinitions),
  });
}

export function createNodeRunJSTypeLibraryRegistry(): NodeRunJSTypeLibraryRegistry {
  return new NodeRunJSTypeLibraryRegistry(defaultNodeRunJSTypeLibraryRegistry);
}

export function registerNodeRunJSTypeLibrary(provider: NodeRunJSTypeLibraryProvider): () => void {
  return defaultNodeRunJSTypeLibraryRegistry.register(provider);
}

export function getDefaultNodeRunJSTypeLibraryRegistry(): NodeRunJSTypeLibraryRegistry {
  return defaultNodeRunJSTypeLibraryRegistry;
}

export function loadNodeRunJSTypeLibraryFiles(
  requests: readonly RunJSTypeLibraryRequest[],
  options: { registry?: NodeRunJSTypeLibraryRegistry; typeLibraryIds?: readonly string[] } = {},
): NodeRunJSTypeLibraryFiles {
  return (options.registry || defaultNodeRunJSTypeLibraryRegistry).load(requests, options.typeLibraryIds);
}

export function loadNodeRunJSTypeLibraryFilesWithContracts(
  requests: readonly RunJSTypeLibraryRequest[],
  options: { registry?: NodeRunJSTypeLibraryRegistry; typeLibraryIds?: readonly string[] } = {},
): NodeRunJSTypeLibraryLoadResult {
  return (options.registry || defaultNodeRunJSTypeLibraryRegistry).loadWithContracts(requests, options.typeLibraryIds);
}

export function buildDefaultNodeRunJSTypeLibraryFingerprint(projectRoot = process.cwd()): string {
  const allDefinitions: RunJSTypeLibraryPackDefinition[] = [
    reactTypeLibraryDefinition,
    reactDOMTypeLibraryDefinition,
    clientSdkTypeLibraryDefinition,
    RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION,
    RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION,
    RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION,
    RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION,
    ...antdTypeLibraryDefinitions,
    ...antdIconsTypeLibraryDefinitions,
  ];
  const representativeDefinitions = [
    reactTypeLibraryDefinition,
    reactDOMTypeLibraryDefinition,
    clientSdkTypeLibraryDefinition,
    RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION,
    RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION,
    RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION,
    RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION,
    requireDefinition(antdTypeLibraryDefinitions, RUNJS_ANTD_FULL_PACK_ID),
    requireDefinition(antdIconsTypeLibraryDefinitions, RUNJS_ANTD_ICONS_FULL_PACK_ID),
  ];
  return sha256Hex(
    stableSerialize({
      definitions: allDefinitions.sort(byId).map((definition) => ({
        id: definition.id,
        entry: definition.entry,
        dependencies: [...(definition.dependencies || [])].sort(),
        rootFiles: [...(definition.rootFiles || [])]
          .map((file) => ({ path: file.path, contentHash: sha256Hex(file.content) }))
          .sort((left, right) => left.path.localeCompare(right.path)),
        metadata: definition.metadata,
      })),
      declarationFiles: mergePacks(
        representativeDefinitions.map((definition) => loadDeclaration(definition, projectRoot)),
      ),
    }),
  );
}

function requireDefinition(definitions: RunJSTypeLibraryPackDefinition[], id: string): RunJSTypeLibraryPackDefinition {
  const definition = definitions.find((item) => item.id === id);
  if (!definition) {
    throw new Error(`Node RunJS TypeScript library definition was not found: ${id}`);
  }
  return definition;
}

function mergePacks(packs: Iterable<NodeRunJSTypeLibraryFiles>): NodeRunJSTypeLibraryFiles {
  const rootFiles = new Map<string, RunJSTypeLibraryFile>();
  const dependencyFiles = new Map<string, RunJSTypeLibraryFile>();
  for (const pack of packs) {
    for (const file of pack.rootFiles) mergeFile(rootFiles, file);
    for (const file of pack.dependencyFiles) mergeFile(dependencyFiles, file);
  }
  return {
    dependencyFiles: [...dependencyFiles.values()].sort((left, right) => left.path.localeCompare(right.path)),
    rootFiles: [...rootFiles.values()].sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function mergeFile(files: Map<string, RunJSTypeLibraryFile>, file: RunJSTypeLibraryFile): void {
  const existing = files.get(file.path);
  if (existing && existing.contentHash !== file.contentHash) {
    throw new Error(`Conflicting Node RunJS type library file: ${file.path}`);
  }
  files.set(file.path, file);
}

function normalizeRequired(value: string, label: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}
