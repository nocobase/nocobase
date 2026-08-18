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
  JsTemplateKind,
  JsTemplateRuntimeSourceBinding,
  JsTemplateSelectableTemplateSummary,
} from '../../shared/types';
import {
  getJsTemplateCacheGeneration,
  JsTemplateCacheGeneration,
  type JsTemplateCacheGenerationSnapshot,
} from './JsTemplateRuntimeCacheRegistry';

type DescriptorBinding = Pick<JsTemplateRuntimeSourceBinding, 'projectId' | 'templateId'> & {
  kind: JsTemplateKind;
};

type DescriptorScope = {
  projectId: string;
  kind: JsTemplateKind;
};

type ScopeState = DescriptorScope & {
  descriptorKeys: Set<string>;
  generation: JsTemplateCacheGenerationSnapshot;
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

function toDescriptor(template: JsTemplateSelectableTemplateSummary): RunJSSourceSettingsDescriptor {
  return {
    entryId: template.id,
    settingsSchemaHash: template.settingsSchemaHash,
    schema: template.settingsSchema ? cloneRecord(template.settingsSchema) : null,
    defaults: extractRunJSSettingsDefaults(template.settingsSchema),
  };
}

function getScopeKey(scope: DescriptorScope): string {
  return JSON.stringify([scope.projectId, scope.kind]);
}

function getDescriptorKey(binding: DescriptorBinding): string {
  return JSON.stringify([binding.projectId, binding.kind, binding.templateId]);
}

export class JsTemplateSettingsDescriptorCache {
  private readonly descriptors = new Map<string, RunJSSourceSettingsDescriptor>();
  private readonly scopes = new Map<string, ScopeState>();
  private readonly inFlightScopeLoads = new Map<string, InFlightScopeLoad>();

  constructor(private readonly generation = new JsTemplateCacheGeneration()) {}

  get(binding: DescriptorBinding): RunJSSourceSettingsDescriptor | undefined {
    this.syncScopeGeneration(this.getScope(binding.projectId, binding.kind));
    const descriptor = this.descriptors.get(getDescriptorKey(binding));
    return descriptor ? cloneDescriptor(descriptor) : undefined;
  }

  async getOrLoad(
    binding: DescriptorBinding,
    loadTemplates: () => Promise<JsTemplateSelectableTemplateSummary[]>,
  ): Promise<RunJSSourceSettingsDescriptor | undefined> {
    let descriptor = this.get(binding);
    let scope = this.getScope(binding.projectId, binding.kind);
    while (!descriptor && !scope.loaded) {
      await this.loadScope(scope, loadTemplates);
      descriptor = this.get(binding);
      scope = this.getScope(binding.projectId, binding.kind);
    }

    return descriptor;
  }

  primeScope(projectId: string, kind: JsTemplateKind, templates: JsTemplateSelectableTemplateSummary[]): void {
    const scope = this.getScope(projectId, kind);
    this.syncScopeGeneration(scope);
    scope.version += 1;
    this.writeScope(scope, templates);
  }

  invalidateProject(projectId: string): void {
    this.generation.invalidateProject(projectId);
    for (const scope of this.scopes.values()) {
      if (scope.projectId !== projectId) {
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

  private getScope(projectId: string, kind: JsTemplateKind): ScopeState {
    const scopeKey = getScopeKey({ projectId, kind });
    const existing = this.scopes.get(scopeKey);
    if (existing) {
      return existing;
    }
    const scope: ScopeState = {
      projectId,
      kind,
      descriptorKeys: new Set<string>(),
      generation: this.generation.get(projectId),
      loaded: false,
      version: 0,
    };
    this.scopes.set(scopeKey, scope);
    return scope;
  }

  private async loadScope(
    scope: ScopeState,
    loadTemplates: () => Promise<JsTemplateSelectableTemplateSummary[]>,
  ): Promise<void> {
    this.syncScopeGeneration(scope);
    const scopeKey = getScopeKey(scope);
    const existing = this.inFlightScopeLoads.get(scopeKey);
    if (existing?.version === scope.version) {
      await existing.promise;
      return;
    }

    const loadVersion = scope.version;
    const promise = loadTemplates().then((templates) => {
      if (scope.version === loadVersion) {
        this.writeScope(scope, templates);
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

  private writeScope(scope: ScopeState, templates: JsTemplateSelectableTemplateSummary[]): void {
    this.clearScopeDescriptors(scope);
    for (const template of templates) {
      if (template.projectId !== scope.projectId || template.kind !== scope.kind) {
        continue;
      }
      const descriptorKey = getDescriptorKey({
        projectId: template.projectId,
        templateId: template.id,
        kind: scope.kind,
      });
      this.descriptors.set(descriptorKey, toDescriptor(template));
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
    const generation = this.generation.get(scope.projectId);
    if (generation.global === scope.generation.global && generation.project === scope.generation.project) {
      return;
    }
    scope.version += 1;
    scope.generation = generation;
    this.clearScopeDescriptors(scope);
    scope.loaded = false;
  }
}

const descriptorCaches = new WeakMap<object, JsTemplateSettingsDescriptorCache>();

export function getJsTemplateSettingsDescriptorCache(api: object): JsTemplateSettingsDescriptorCache {
  let cache = descriptorCaches.get(api);
  if (!cache) {
    cache = new JsTemplateSettingsDescriptorCache(getJsTemplateCacheGeneration(api));
    descriptorCaches.set(api, cache);
  }
  return cache;
}

export function invalidateJsTemplateSettingsDescriptorCache(api: object, projectId?: string): void {
  const cache = descriptorCaches.get(api);
  if (!cache) {
    return;
  }
  if (projectId) {
    cache.invalidateProject(projectId);
  } else {
    cache.clear();
  }
}
