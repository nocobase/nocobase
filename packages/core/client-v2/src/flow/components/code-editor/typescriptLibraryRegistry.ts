/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { selectRunJSTypeLibraryRequests } from '@nocobase/runjs/client-v2';
import type {
  RunJSTypeLibraryPack,
  RunJSTypeLibraryPackDependency,
  RunJSTypeLibraryRequest,
  RunJSTypeLibraryUsageDefinition,
} from '@nocobase/runjs/client-v2';

export type RunJSTypeLibraryPackLoader = (
  request: RunJSTypeLibraryRequest,
) => Promise<RunJSTypeLibraryPack> | RunJSTypeLibraryPack;

export interface RunJSTypeLibraryLoadObserver {
  now(): number;
  onCacheHit(packId: string): void;
  onLoadEnd(packId: string, durationMs: number): void;
}

export interface RunJSTypeLibraryCompletionCatalogEntry {
  label: string;
  detail?: string;
  type?: string;
}

export type RunJSTypeLibraryCompletionCatalogLoader = () =>
  | Promise<readonly RunJSTypeLibraryCompletionCatalogEntry[]>
  | readonly RunJSTypeLibraryCompletionCatalogEntry[];

export interface RunJSTypeLibraryRegistration {
  id: string;
  libraryName: string;
  loader: RunJSTypeLibraryPackLoader;
  version?: string;
  contentHash?: string;
  moduleNames?: readonly string[];
  topLevelNames?: readonly string[];
  completionCatalog?: RunJSTypeLibraryCompletionCatalogLoader;
}

type StoredRegistration = RunJSTypeLibraryRegistration & { token: symbol };

let registrySequence = 0;

export class RunJSTypeLibraryRegistry {
  private readonly registrations = new Map<string, StoredRegistration>();
  private readonly loadingPacks = new Map<string, Promise<RunJSTypeLibraryPack>>();
  private readonly loadingCatalogs = new Map<string, Promise<readonly RunJSTypeLibraryCompletionCatalogEntry[]>>();
  private readonly loadedFullPacks = new Map<string, RunJSTypeLibraryPack>();
  private disposed = false;
  private revision = 0;
  private readonly registryId = ++registrySequence;

  constructor(private readonly parent?: RunJSTypeLibraryRegistry) {}

  register(registration: RunJSTypeLibraryRegistration): () => void {
    this.assertActive();
    const id = normalizeRequired(registration.id, 'RunJS TypeScript library id');
    const libraryName = normalizeRequired(registration.libraryName, 'RunJS TypeScript library name');
    if (this.has(id)) {
      throw new Error(`RunJS TypeScript library is already registered: ${id}`);
    }
    const stored: StoredRegistration = { ...registration, id, libraryName, token: Symbol(id) };
    this.registrations.set(id, stored);
    this.revision += 1;
    return () => {
      if (this.registrations.get(id)?.token !== stored.token) return;
      this.registrations.delete(id);
      this.loadingPacks.delete(id);
      this.loadingCatalogs.delete(id);
      for (const [libraryName, pack] of this.loadedFullPacks) {
        if (pack.id === id) this.loadedFullPacks.delete(libraryName);
      }
      this.revision += 1;
    };
  }

  has(id: string): boolean {
    return this.registrations.has(id) || Boolean(this.parent?.has(id));
  }

  getUsageDefinitions(): RunJSTypeLibraryUsageDefinition[] {
    const definitions = new Map<string, RunJSTypeLibraryUsageDefinition>();
    for (const definition of this.parent?.getUsageDefinitions() || [])
      definitions.set(definition.libraryName, definition);
    for (const registration of this.registrations.values()) {
      definitions.set(registration.libraryName, {
        libraryName: registration.libraryName,
        moduleNames: registration.moduleNames,
        packId: registration.id,
        topLevelNames: registration.topLevelNames,
      });
    }
    return [...definitions.values()].sort((left, right) => left.libraryName.localeCompare(right.libraryName));
  }

  createExplicitRequests(ids: readonly string[]): RunJSTypeLibraryRequest[] {
    return [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))].sort().map((id) => {
      const registration = this.resolve(id);
      if (!registration) throw new Error(`RunJS TypeScript library is not registered: ${id}`);
      const libraryName = inferLibraryName(id, registration.libraryName);
      return id.endsWith('/full')
        ? { kind: 'full', libraryName, packId: id }
        : { kind: 'library', libraryName, packId: id };
    });
  }

  async loadPacks(
    requests: readonly RunJSTypeLibraryRequest[],
    observer?: RunJSTypeLibraryLoadObserver,
  ): Promise<RunJSTypeLibraryPack[]> {
    this.assertActive();
    const packs = new Map<string, RunJSTypeLibraryPack>();
    const loadedFullPackIds = new Map<string, string>();
    for (const request of requests) {
      const fullPack = this.resolveLoadedFullPack(request.libraryName);
      if (fullPack) loadedFullPackIds.set(request.libraryName, fullPack.id);
    }
    const registeredRequests = selectRunJSTypeLibraryRequests(requests, loadedFullPackIds)
      .filter((request) => this.has(request.packId))
      .sort((left, right) => left.packId.localeCompare(right.packId));
    for (const request of registeredRequests) {
      await this.collectPackWithDependencies(request, new Set<string>(), packs, observer);
    }
    return [...packs.values()].sort((left, right) => left.id.localeCompare(right.id));
  }

  /**
   * Loads one pack for the TypeScript worker without retaining a second copy in
   * the main-thread registry cache. Dependency traversal and caching belong to
   * the worker in this mode.
   */
  async loadPackForWorker(
    request: RunJSTypeLibraryRequest,
    observer?: RunJSTypeLibraryLoadObserver,
  ): Promise<RunJSTypeLibraryPack> {
    this.assertActive();
    const owner = this.registrations.has(request.packId) ? this : this.parent;
    if (owner && owner !== this) return await owner.loadPackForWorker(request, observer);
    const registration = this.registrations.get(request.packId);
    if (!registration) throw new Error(`RunJS TypeScript library pack loader is not registered: ${request.packId}`);
    const startedAt = observer?.now();
    const pack = await registration.loader(request);
    assertRegistrationMatches(registration, pack);
    if (typeof startedAt === 'number') observer?.onLoadEnd(request.packId, Math.max(0, observer.now() - startedAt));
    return pack;
  }

  async loadCompletionCatalog(id: string): Promise<readonly RunJSTypeLibraryCompletionCatalogEntry[]> {
    this.assertActive();
    const local = this.registrations.get(id);
    if (!local) {
      return (await this.parent?.loadCompletionCatalog(id)) || [];
    }
    if (!local.completionCatalog) return [];
    let loading = this.loadingCatalogs.get(id);
    if (!loading) {
      loading = Promise.resolve().then(local.completionCatalog);
      this.loadingCatalogs.set(id, loading);
    }
    return await loading;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.registrations.clear();
    this.loadingPacks.clear();
    this.loadingCatalogs.clear();
    this.loadedFullPacks.clear();
    this.revision += 1;
  }

  clearForTests(): void {
    this.disposed = false;
    this.registrations.clear();
    this.loadingPacks.clear();
    this.loadingCatalogs.clear();
    this.loadedFullPacks.clear();
    this.revision += 1;
  }

  getDebugState(): { disposed: boolean; loadingPackCount: number; registrationCount: number } {
    return {
      disposed: this.disposed,
      loadingPackCount: this.loadingPacks.size,
      registrationCount: this.registrations.size,
    };
  }

  getCacheKey(): string {
    return `${this.registryId}:${this.revision}:${this.parent?.getCacheKey() || ''}`;
  }

  private resolve(id: string): StoredRegistration | undefined {
    return this.registrations.get(id) || this.parent?.resolve(id);
  }

  private async collectPackWithDependencies(
    request: RunJSTypeLibraryRequest,
    ancestors: ReadonlySet<string>,
    packs: Map<string, RunJSTypeLibraryPack>,
    observer?: RunJSTypeLibraryLoadObserver,
  ): Promise<void> {
    if (packs.has(request.packId) || ancestors.has(request.packId)) return;
    const pack = await this.loadPack(request, observer);
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(pack.id);
    for (const dependency of [...pack.dependencies].sort((left, right) => left.id.localeCompare(right.id))) {
      if (nextAncestors.has(dependency.id)) continue;
      const dependencyRequest = toDependencyRequest(dependency);
      await this.collectPackWithDependencies(dependencyRequest, nextAncestors, packs, observer);
      const dependencyPack = packs.get(dependency.id);
      if (dependencyPack) assertDependencyMatches(dependency, dependencyPack);
    }
    packs.set(pack.id, pack);
  }

  private async loadPack(
    request: RunJSTypeLibraryRequest,
    observer?: RunJSTypeLibraryLoadObserver,
  ): Promise<RunJSTypeLibraryPack> {
    const owner = this.registrations.has(request.packId) ? this : this.parent;
    if (owner && owner !== this) return await owner.loadPack(request, observer);
    const registration = this.registrations.get(request.packId);
    if (!registration) throw new Error(`RunJS TypeScript library pack loader is not registered: ${request.packId}`);
    const existing = this.loadingPacks.get(request.packId);
    if (existing) {
      observer?.onCacheHit(request.packId);
      return await existing;
    }
    const startedAt = observer?.now();
    const loading = Promise.resolve()
      .then(() => registration.loader(request))
      .then((pack) => {
        assertRegistrationMatches(registration, pack);
        if (request.kind === 'full') this.loadedFullPacks.set(request.libraryName, pack);
        if (typeof startedAt === 'number') observer?.onLoadEnd(request.packId, Math.max(0, observer.now() - startedAt));
        return pack;
      })
      .catch((error: unknown) => {
        if (this.loadingPacks.get(request.packId) === loading) this.loadingPacks.delete(request.packId);
        throw error;
      });
    this.loadingPacks.set(request.packId, loading);
    return await loading;
  }

  private assertActive(): void {
    if (this.disposed) throw new Error('RunJS TypeScript library registry has been disposed.');
  }

  private resolveLoadedFullPack(libraryName: string): RunJSTypeLibraryPack | undefined {
    return this.loadedFullPacks.get(libraryName) || this.parent?.resolveLoadedFullPack(libraryName);
  }
}

const defaultRunJSTypeLibraryRegistry = new RunJSTypeLibraryRegistry();

export function createRunJSTypeLibraryRegistry(): RunJSTypeLibraryRegistry {
  return new RunJSTypeLibraryRegistry(defaultRunJSTypeLibraryRegistry);
}

export function registerRunJSTypeLibrary(registration: RunJSTypeLibraryRegistration): () => void {
  return defaultRunJSTypeLibraryRegistry.register(registration);
}

export function registerRunJSTypeLibraryPackLoader(packId: string, loader: RunJSTypeLibraryPackLoader): () => void {
  return registerRunJSTypeLibrary({ id: packId, libraryName: packId, loader });
}

export function hasRunJSTypeLibraryPackLoader(packId: string): boolean {
  return defaultRunJSTypeLibraryRegistry.has(packId);
}

export async function loadRunJSTypeLibraryPacks(
  requests: readonly RunJSTypeLibraryRequest[],
): Promise<RunJSTypeLibraryPack[]> {
  return await defaultRunJSTypeLibraryRegistry.loadPacks(requests);
}

export function clearRunJSTypeLibraryPackRegistryForTests(): void {
  defaultRunJSTypeLibraryRegistry.clearForTests();
}

export function getRunJSTypeLibraryPackRegistryDebugState(): {
  loaderCount: number;
  loadingPackCount: number;
} {
  const state = defaultRunJSTypeLibraryRegistry.getDebugState();
  return { loaderCount: state.registrationCount, loadingPackCount: state.loadingPackCount };
}

export function getDefaultRunJSTypeLibraryRegistry(): RunJSTypeLibraryRegistry {
  return defaultRunJSTypeLibraryRegistry;
}

function normalizeRequired(value: string, label: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function inferLibraryName(packId: string, fallback: string): string {
  if (packId.startsWith('antd-icons/')) return 'antdIcons';
  if (packId.startsWith('antd/')) return 'antd';
  return fallback;
}

function toDependencyRequest(dependency: RunJSTypeLibraryPackDependency): RunJSTypeLibraryRequest {
  return { kind: 'library', libraryName: dependency.id, packId: dependency.id };
}

function assertDependencyMatches(dependency: RunJSTypeLibraryPackDependency, pack: RunJSTypeLibraryPack): void {
  if (dependency.version !== pack.version || dependency.contentHash !== pack.contentHash) {
    throw new Error(`RunJS TypeScript library pack dependency mismatch: ${dependency.id}`);
  }
}

function assertRegistrationMatches(registration: StoredRegistration, pack: RunJSTypeLibraryPack): void {
  if (pack.id !== registration.id) {
    throw new Error(`RunJS TypeScript library pack id mismatch: expected ${registration.id}, received ${pack.id}`);
  }
  if (registration.version && pack.version !== registration.version) {
    throw new Error(`RunJS TypeScript library pack version mismatch: ${registration.id}`);
  }
  if (registration.contentHash && pack.contentHash !== registration.contentHash) {
    throw new Error(`RunJS TypeScript library pack content hash mismatch: ${registration.id}`);
  }
}
