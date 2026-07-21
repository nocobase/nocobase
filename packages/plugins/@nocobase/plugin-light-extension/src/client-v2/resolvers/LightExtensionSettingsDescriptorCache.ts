/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSourceSettingsDescriptor } from '@nocobase/client-v2';
import { extractRunJSSettingsDefaults } from '@nocobase/runjs/settings';

import type {
  LightExtensionKind,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntrySummary,
} from '../../shared/types';
import {
  getLightExtensionCacheGeneration,
  LightExtensionCacheGeneration,
  type LightExtensionCacheGenerationSnapshot,
} from './LightExtensionRuntimeCacheRegistry';

type DescriptorBinding = Pick<LightExtensionRuntimeSourceBinding, 'repoId' | 'entryId'> & {
  kind: LightExtensionKind;
};

type DescriptorScope = {
  repoId: string;
  kind: LightExtensionKind;
};

type ScopeState = DescriptorScope & {
  descriptorKeys: Set<string>;
  generation: LightExtensionCacheGenerationSnapshot;
  loaded: boolean;
  version: number;
};

type InFlightScopeLoad = {
  version: number;
  promise: Promise<void>;
};

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneDescriptor(descriptor: RunJSSourceSettingsDescriptor): RunJSSourceSettingsDescriptor {
  return {
    entryId: descriptor.entryId,
    settingsSchemaHash: descriptor.settingsSchemaHash,
    schema: descriptor.schema ? cloneRecord(descriptor.schema) : null,
    defaults: cloneRecord(descriptor.defaults),
  };
}

function toDescriptor(entry: LightExtensionSelectableEntrySummary): RunJSSourceSettingsDescriptor {
  return {
    entryId: entry.id,
    settingsSchemaHash: entry.settingsSchemaHash,
    schema: entry.settingsSchema ? cloneRecord(entry.settingsSchema) : null,
    defaults: extractRunJSSettingsDefaults(entry.settingsSchema),
  };
}

function getScopeKey(scope: DescriptorScope): string {
  return JSON.stringify([scope.repoId, scope.kind]);
}

function getDescriptorKey(binding: DescriptorBinding): string {
  return JSON.stringify([binding.repoId, binding.kind, binding.entryId]);
}

export class LightExtensionSettingsDescriptorCache {
  private readonly descriptors = new Map<string, RunJSSourceSettingsDescriptor>();
  private readonly scopes = new Map<string, ScopeState>();
  private readonly inFlightScopeLoads = new Map<string, InFlightScopeLoad>();

  constructor(private readonly generation = new LightExtensionCacheGeneration()) {}

  get(binding: DescriptorBinding): RunJSSourceSettingsDescriptor | undefined {
    this.syncScopeGeneration(this.getScope(binding.repoId, binding.kind));
    const descriptor = this.descriptors.get(getDescriptorKey(binding));
    return descriptor ? cloneDescriptor(descriptor) : undefined;
  }

  async getOrLoad(
    binding: DescriptorBinding,
    loadEntries: () => Promise<LightExtensionSelectableEntrySummary[]>,
  ): Promise<RunJSSourceSettingsDescriptor | undefined> {
    let descriptor = this.get(binding);
    let scope = this.getScope(binding.repoId, binding.kind);
    while (!descriptor && !scope.loaded) {
      await this.loadScope(scope, loadEntries);
      descriptor = this.get(binding);
      scope = this.getScope(binding.repoId, binding.kind);
    }

    return descriptor;
  }

  primeScope(repoId: string, kind: LightExtensionKind, entries: LightExtensionSelectableEntrySummary[]): void {
    const scope = this.getScope(repoId, kind);
    this.syncScopeGeneration(scope);
    scope.version += 1;
    this.writeScope(scope, entries);
  }

  invalidateRepo(repoId: string): void {
    this.generation.invalidateRepo(repoId);
    for (const scope of this.scopes.values()) {
      if (scope.repoId !== repoId) {
        continue;
      }
      this.syncScopeGeneration(scope);
    }
  }

  clear(): void {
    this.generation.clear();
    for (const scope of this.scopes.values()) {
      this.syncScopeGeneration(scope);
    }
  }

  private getScope(repoId: string, kind: LightExtensionKind): ScopeState {
    const scopeKey = getScopeKey({ repoId, kind });
    const existing = this.scopes.get(scopeKey);
    if (existing) {
      return existing;
    }
    const scope: ScopeState = {
      repoId,
      kind,
      descriptorKeys: new Set<string>(),
      generation: this.generation.get(repoId),
      loaded: false,
      version: 0,
    };
    this.scopes.set(scopeKey, scope);
    return scope;
  }

  private async loadScope(
    scope: ScopeState,
    loadEntries: () => Promise<LightExtensionSelectableEntrySummary[]>,
  ): Promise<void> {
    this.syncScopeGeneration(scope);
    const scopeKey = getScopeKey(scope);
    const existing = this.inFlightScopeLoads.get(scopeKey);
    if (existing?.version === scope.version) {
      await existing.promise;
      return;
    }

    const loadVersion = scope.version;
    const promise = loadEntries().then((entries) => {
      if (scope.version === loadVersion) {
        this.writeScope(scope, entries);
      }
    });
    const inFlight = { version: loadVersion, promise };
    this.inFlightScopeLoads.set(scopeKey, inFlight);
    try {
      await promise;
    } finally {
      if (this.inFlightScopeLoads.get(scopeKey) === inFlight) {
        this.inFlightScopeLoads.delete(scopeKey);
      }
    }
  }

  private writeScope(scope: ScopeState, entries: LightExtensionSelectableEntrySummary[]): void {
    this.clearScopeDescriptors(scope);
    for (const entry of entries) {
      if (entry.repoId !== scope.repoId || entry.kind !== scope.kind) {
        continue;
      }
      const descriptorKey = getDescriptorKey({
        repoId: entry.repoId,
        entryId: entry.id,
        kind: scope.kind,
      });
      this.descriptors.set(descriptorKey, toDescriptor(entry));
      scope.descriptorKeys.add(descriptorKey);
    }
    scope.loaded = true;
  }

  private clearScopeDescriptors(scope: ScopeState): void {
    for (const descriptorKey of scope.descriptorKeys) {
      this.descriptors.delete(descriptorKey);
    }
    scope.descriptorKeys.clear();
  }

  private syncScopeGeneration(scope: ScopeState): void {
    const generation = this.generation.get(scope.repoId);
    if (generation.global === scope.generation.global && generation.repo === scope.generation.repo) {
      return;
    }
    scope.version += 1;
    scope.generation = generation;
    this.clearScopeDescriptors(scope);
    scope.loaded = false;
  }
}

const descriptorCaches = new WeakMap<object, LightExtensionSettingsDescriptorCache>();

export function getLightExtensionSettingsDescriptorCache(api: object): LightExtensionSettingsDescriptorCache {
  const existing = descriptorCaches.get(api);
  if (existing) {
    return existing;
  }
  const cache = new LightExtensionSettingsDescriptorCache(getLightExtensionCacheGeneration(api));
  descriptorCaches.set(api, cache);
  return cache;
}

export function invalidateLightExtensionSettingsDescriptorCache(api: object, repoId?: string): void {
  const cache = descriptorCaches.get(api);
  if (!cache) {
    return;
  }
  if (repoId) {
    cache.invalidateRepo(repoId);
    return;
  }
  cache.clear();
}
