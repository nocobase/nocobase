/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSTypeLibraryPack,
  RunJSTypeLibraryPackDependency,
  RunJSTypeLibraryRequest,
} from '@nocobase/runjs/client-v2';

export type RunJSTypeLibraryPackLoader = (
  request: RunJSTypeLibraryRequest,
) => Promise<RunJSTypeLibraryPack> | RunJSTypeLibraryPack;

const loaders = new Map<string, RunJSTypeLibraryPackLoader>();
const loadingPacks = new Map<string, Promise<RunJSTypeLibraryPack>>();

export function registerRunJSTypeLibraryPackLoader(packId: string, loader: RunJSTypeLibraryPackLoader): () => void {
  const normalizedPackId = String(packId || '').trim();
  if (!normalizedPackId) {
    throw new Error('RunJS TypeScript library pack id is required.');
  }
  if (loaders.has(normalizedPackId)) {
    throw new Error(`RunJS TypeScript library pack loader is already registered: ${normalizedPackId}`);
  }

  loaders.set(normalizedPackId, loader);
  return () => {
    if (loaders.get(normalizedPackId) === loader) {
      loaders.delete(normalizedPackId);
      loadingPacks.delete(normalizedPackId);
    }
  };
}

export function hasRunJSTypeLibraryPackLoader(packId: string): boolean {
  return loaders.has(packId);
}

export async function loadRunJSTypeLibraryPacks(
  requests: readonly RunJSTypeLibraryRequest[],
): Promise<RunJSTypeLibraryPack[]> {
  const packs = new Map<string, RunJSTypeLibraryPack>();
  const registeredRequests = requests
    .filter((request) => loaders.has(request.packId))
    .sort((left, right) => left.packId.localeCompare(right.packId));
  for (const request of registeredRequests) {
    await collectPackWithDependencies(request, new Set<string>(), packs);
  }
  return Array.from(packs.values()).sort((left, right) => left.id.localeCompare(right.id));
}

async function collectPackWithDependencies(
  request: RunJSTypeLibraryRequest,
  ancestors: ReadonlySet<string>,
  packs: Map<string, RunJSTypeLibraryPack>,
): Promise<void> {
  if (packs.has(request.packId) || ancestors.has(request.packId)) {
    return;
  }
  const pack = await loadRunJSTypeLibraryPack(request);
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(pack.id);
  const dependencies = [...pack.dependencies].sort((left, right) => left.id.localeCompare(right.id));
  for (const dependency of dependencies) {
    if (nextAncestors.has(dependency.id)) continue;
    const dependencyPack = await loadRunJSTypeLibraryPack(toDependencyRequest(dependency));
    assertDependencyMatches(dependency, dependencyPack);
    await collectPackWithDependencies(toDependencyRequest(dependency), nextAncestors, packs);
  }
  packs.set(pack.id, pack);
}

function toDependencyRequest(dependency: RunJSTypeLibraryPackDependency): RunJSTypeLibraryRequest {
  return {
    kind: 'library',
    libraryName: dependency.id,
    packId: dependency.id,
  };
}

function assertDependencyMatches(dependency: RunJSTypeLibraryPackDependency, pack: RunJSTypeLibraryPack): void {
  if (dependency.version !== pack.version || dependency.contentHash !== pack.contentHash) {
    throw new Error(`RunJS TypeScript library pack dependency mismatch: ${dependency.id}`);
  }
}

async function loadRunJSTypeLibraryPack(request: RunJSTypeLibraryRequest): Promise<RunJSTypeLibraryPack> {
  const existing = loadingPacks.get(request.packId);
  if (existing) {
    return await existing;
  }

  const loader = loaders.get(request.packId);
  if (!loader) {
    throw new Error(`RunJS TypeScript library pack loader is not registered: ${request.packId}`);
  }

  const loading = Promise.resolve()
    .then(() => loader(request))
    .then((pack) => {
      if (pack.id !== request.packId) {
        throw new Error(`RunJS TypeScript library pack id mismatch: expected ${request.packId}, received ${pack.id}`);
      }
      return pack;
    })
    .catch((error: unknown) => {
      if (loadingPacks.get(request.packId) === loading) {
        loadingPacks.delete(request.packId);
      }
      throw error;
    });
  loadingPacks.set(request.packId, loading);
  return await loading;
}

export function clearRunJSTypeLibraryPackRegistryForTests(): void {
  loaders.clear();
  loadingPacks.clear();
}

export function getRunJSTypeLibraryPackRegistryDebugState(): {
  loaderCount: number;
  loadingPackCount: number;
} {
  return {
    loaderCount: loaders.size,
    loadingPackCount: loadingPacks.size,
  };
}
