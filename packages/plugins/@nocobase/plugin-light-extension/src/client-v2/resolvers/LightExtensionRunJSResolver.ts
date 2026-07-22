/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  RunJSSourceResolverError,
  type RunJSSourceMenuInput,
  type RunJSSourceMenuItem,
  type RunJSSourceResolver,
  type RunJSSourceResolverInput,
  type RunJSSourceResolverResult,
  type RunJSSourceSettingsDescriptor,
} from '@nocobase/client-v2';
import {
  extractRunJSSettingsDefaults,
  normalizeLightExtensionEntrySelection,
  normalizeLightExtensionSettings,
} from '@nocobase/runjs/settings';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionRepoRecord,
  LightExtensionRuntimeArtifactRecord,
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntrySummary,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  listLightExtensionRepos,
  listSelectableLightExtensionEntries,
  unwrapResourceResponse,
} from '../api/lightExtensionEntriesRequests';
import {
  getLightExtensionSettingsDescriptorCache,
  type LightExtensionSettingsDescriptorCache,
} from './LightExtensionSettingsDescriptorCache';
import { getOrCreateLightExtensionRuntimeCache } from './LightExtensionRuntimeCacheRegistry';

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export type LightExtensionRunJSSourceResolver = RunJSSourceResolver & {
  invalidateCache(repoId?: string): void;
};

export function createLightExtensionRunJSResolver(api: ApiClientLike): LightExtensionRunJSSourceResolver {
  const runtimeCache = getOrCreateLightExtensionRuntimeCache(api, () => new LightExtensionRuntimeCache());
  const settingsDescriptorCache = getLightExtensionSettingsDescriptorCache(api);

  return {
    sourceMode: 'light-extension',
    invalidateCache(repoId) {
      if (repoId) {
        runtimeCache.invalidateRepo(repoId);
        settingsDescriptorCache.invalidateRepo(repoId);
        return;
      }
      runtimeCache.clear();
      settingsDescriptorCache.clear();
    },
    async resolve(input) {
      const binding = isLightExtensionRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : undefined;
      const kind = toSupportedKind(binding?.kind);
      const settingsDescriptor =
        binding && kind
          ? settingsDescriptorCache.get({ repoId: binding.repoId, entryId: binding.entryId, kind })
          : undefined;
      const runtime = await resolveLightExtensionRuntimeSource(api, input, runtimeCache, settingsDescriptor);
      return {
        code: runtime.code,
        version: runtime.version,
        sourceMap: runtime.sourceMap,
        settings: runtime.settings,
        context: {
          ...(input.context || {}),
          lightExtension: {
            entryId: runtime.entryId,
            entryPath: runtime.entryPath,
            artifactHash: runtime.artifactHash,
            runtimeCodeHash: runtime.runtimeCodeHash,
          },
        },
      } satisfies RunJSSourceResolverResult;
    },
    async getBindingTitle(input) {
      const binding = isLightExtensionRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : undefined;
      if (!binding?.repoId || !binding.entryId) {
        return undefined;
      }
      const kind = toSupportedKind(binding.kind);
      if (!kind) {
        return undefined;
      }

      const [entries, repos] = await Promise.all([
        listSelectableLightExtensionEntries(api, {
          repoId: binding.repoId,
          kind,
        }),
        listLightExtensionRepos(api).catch(() => [] as LightExtensionRepoRecord[]),
      ]);
      settingsDescriptorCache.primeScope(binding.repoId, kind, entries);
      const entry = entries.find((item) => item.id === binding.entryId);
      if (!entry || entry.kind !== kind) {
        return undefined;
      }

      const repo = repos.find((item) => item.id === binding.repoId);
      return `${repo ? getRepoLabel(repo) : binding.repoId} / ${getEntryLabel(entry)}`;
    },
    async getSettingsDescriptor(input) {
      const binding = isLightExtensionRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : undefined;
      if (!binding?.repoId || !binding.entryId) {
        return undefined;
      }
      const kind = toSupportedKind(binding.kind);
      if (!kind) {
        return undefined;
      }

      return settingsDescriptorCache.getOrLoad(
        {
          repoId: binding.repoId,
          entryId: binding.entryId,
          kind,
        },
        () =>
          listSelectableLightExtensionEntries(api, {
            repoId: binding.repoId,
            kind,
          }),
      );
    },
    async listSourceMenuItems(input) {
      return listLightExtensionSourceMenuItems(api, input, settingsDescriptorCache);
    },
  };
}

interface ResolvedLightExtensionRuntimeSource extends LightExtensionRuntimeArtifactRecord {
  entryId: string;
  settings: Record<string, unknown>;
}

export class LightExtensionRuntimeCache {
  private readonly artifacts = new Map<string, LightExtensionRuntimeArtifactRecord>();
  private readonly inFlight = new Map<string, Promise<LightExtensionRuntimeArtifactRecord>>();
  private readonly bindings = new Map<
    string,
    {
      sourceBinding: LightExtensionRuntimeSourceBinding;
      response: LightExtensionRuntimeResolveResult;
      artifact: LightExtensionRuntimeArtifactRecord;
    }
  >();

  resolve(
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: LightExtensionRuntimeSourceBinding,
    settingsDescriptor?: RunJSSourceSettingsDescriptor,
  ): Promise<ResolvedLightExtensionRuntimeSource> {
    const bindingKey = getRuntimeBindingKey(sourceBinding);
    const cached = this.bindings.get(bindingKey);
    if (cached && settingsDescriptor?.entryId === sourceBinding.entryId) {
      return Promise.resolve(
        toResolvedRuntime(
          {
            ...cached.response,
            settings: normalizeLightExtensionSettings(settingsDescriptor, input.settings),
          },
          cached.artifact,
        ),
      );
    }
    return this.resolveUncached(api, input, sourceBinding, bindingKey);
  }

  invalidateRepo(repoId: string): void {
    for (const [bindingKey, cached] of this.bindings) {
      if (cached.sourceBinding.repoId === repoId) {
        this.bindings.delete(bindingKey);
      }
    }
  }

  clear(): void {
    this.artifacts.clear();
    this.inFlight.clear();
    this.bindings.clear();
  }

  private async resolveUncached(
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: LightExtensionRuntimeSourceBinding,
    bindingKey: string,
  ): Promise<ResolvedLightExtensionRuntimeSource> {
    const response = await requestRuntimeResolve(api, input, sourceBinding);
    try {
      const artifact = await this.getArtifact(api, response);
      this.bindings.set(bindingKey, { sourceBinding, response, artifact });
      return toResolvedRuntime(response, artifact);
    } catch (error) {
      if (!isArtifactNotFoundError(error)) {
        throw error;
      }
    }
    const retryResponse = await requestRuntimeResolve(api, input, sourceBinding);
    const retryArtifact = await this.getArtifact(api, retryResponse);
    this.bindings.set(bindingKey, { sourceBinding, response: retryResponse, artifact: retryArtifact });
    return toResolvedRuntime(retryResponse, retryArtifact);
  }

  private getArtifact(
    api: ApiClientLike,
    response: LightExtensionRuntimeResolveResult,
  ): Promise<LightExtensionRuntimeArtifactRecord> {
    const cached = this.artifacts.get(response.artifactHash);
    if (cached) {
      return Promise.resolve(cached);
    }
    const existing = this.inFlight.get(response.artifactHash);
    if (existing) {
      return existing;
    }
    const request = requestRuntimeArtifact(api, response).then((artifact) => {
      this.artifacts.set(response.artifactHash, artifact);
      return artifact;
    });
    this.inFlight.set(response.artifactHash, request);
    return request.finally(() => {
      if (this.inFlight.get(response.artifactHash) === request) {
        this.inFlight.delete(response.artifactHash);
      }
    });
  }
}

export async function resolveLightExtensionRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  runtimeCache = new LightExtensionRuntimeCache(),
  settingsDescriptor?: RunJSSourceSettingsDescriptor,
): Promise<ResolvedLightExtensionRuntimeSource> {
  if (!isLightExtensionRuntimeSourceBinding(input.sourceBinding)) {
    throw new RunJSSourceResolverError("RunJS source 'light-extension' requires a valid sourceBinding", {
      code: 'RUNJS_SOURCE_BINDING_REQUIRED',
      sourceMode: 'light-extension',
    });
  }
  return runtimeCache.resolve(api, input, input.sourceBinding, settingsDescriptor);
}

async function requestRuntimeResolve(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  sourceBinding: LightExtensionRuntimeSourceBinding,
): Promise<LightExtensionRuntimeResolveResult> {
  const payload: LightExtensionRuntimeResolveInput = {
    sourceMode: 'light-extension',
    sourceBinding,
    settings: input.settings || {},
  };
  const response = await api.request<ResourceResponse<LightExtensionRuntimeResolveResult>>({
    url: '/light-extension-runtime/resolve',
    method: 'post',
    data: payload,
  });

  return unwrapResourceResponse(response);
}

async function requestRuntimeArtifact(
  api: ApiClientLike,
  response: LightExtensionRuntimeResolveResult,
): Promise<LightExtensionRuntimeArtifactRecord> {
  const artifactResponse = await api.request<ResourceResponse<LightExtensionRuntimeArtifactRecord>>({
    url: getRuntimeArtifactRequestUrl(response.artifactHash),
    method: 'get',
  });
  const artifact = unwrapResourceResponse(artifactResponse);
  if (!artifact?.code || artifact.artifactHash !== response.artifactHash) {
    throw new RunJSSourceResolverError(`Light extension artifact '${response.artifactHash}' is invalid`, {
      code: 'RUNJS_SOURCE_CODE_REQUIRED',
      sourceMode: 'light-extension',
    });
  }
  return artifact;
}

function getRuntimeArtifactRequestUrl(artifactHash: string): string {
  return `/light-extension-runtime/artifacts/${encodeURIComponent(artifactHash)}`;
}

function getRuntimeBindingKey(sourceBinding: LightExtensionRuntimeSourceBinding): string {
  return JSON.stringify([sourceBinding.repoId, sourceBinding.entryId, sourceBinding.kind]);
}

function toResolvedRuntime(
  response: LightExtensionRuntimeResolveResult,
  artifact: LightExtensionRuntimeArtifactRecord,
): ResolvedLightExtensionRuntimeSource {
  return {
    ...artifact,
    entryId: response.entryId,
    entryPath: response.entryPath || artifact.entryPath,
    runtimeCodeHash: response.runtimeCodeHash,
    version: response.version || artifact.version,
    settings: response.settings,
  };
}

function isArtifactNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { status?: unknown; response?: { status?: unknown } };
  return candidate.status === 404 || candidate.response?.status === 404;
}

function getEntryLabel(entry: LightExtensionSelectableEntrySummary): string {
  return entry.entryName || entry.id;
}

async function listLightExtensionSourceMenuItems(
  api: ApiClientLike,
  input: RunJSSourceMenuInput,
  settingsDescriptorCache: LightExtensionSettingsDescriptorCache,
): Promise<RunJSSourceMenuItem[]> {
  const kind = toSupportedKind(input.kind);
  if (!kind) {
    return [];
  }

  const [entries, repos] = await Promise.all([
    listSelectableLightExtensionEntries(api, { kind }),
    listLightExtensionRepos(api).catch(() => [] as LightExtensionRepoRecord[]),
  ]);
  const selectableEntries = entries.filter((entry) => entry.kind === kind && entry.runtimeAvailable === true);
  const t = input.t || ((key: string) => key);
  const currentBinding = isLightExtensionRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : null;
  const repoLabels = new Map(repos.map((repo) => [repo.id, getRepoLabel(repo)]));
  const entriesByRepo = selectableEntries.reduce((groups, entry) => {
    const entriesInRepo = groups.get(entry.repoId);
    if (entriesInRepo) {
      entriesInRepo.push(entry);
    } else {
      groups.set(entry.repoId, [entry]);
    }
    return groups;
  }, new Map<string, LightExtensionSelectableEntrySummary[]>());
  for (const [repoId, entriesInRepo] of entriesByRepo) {
    settingsDescriptorCache.primeScope(repoId, kind, entriesInRepo);
  }
  const sourceItems = Array.from(entriesByRepo.entries()).map(([repoId, entriesInRepo]) => {
    const repoLabel = repoLabels.get(repoId) || repoId;
    const entryItems = entriesInRepo.map((entry) => createEntryMenuItem(entry, currentBinding, input, t, repoLabel));
    return {
      key: `repo:${repoId}`,
      label: repoLabel,
      searchText: [repoId, repoLabel, ...entriesInRepo.map((entry) => getEntryLabel(entry))].join(' '),
      children: entryItems,
    };
  });

  return [
    {
      key: 'light-extension',
      label: t('Light extensions'),
      searchText: [t('Light extensions'), ...selectableEntries.map((entry) => getEntryLabel(entry))].join(' '),
      disabled: true,
    },
    ...sourceItems,
  ];
}

function createEntryMenuItem(
  entry: LightExtensionSelectableEntrySummary,
  currentBinding: LightExtensionRuntimeSourceBinding | null,
  input: RunJSSourceMenuInput,
  t: (key: string, options?: Record<string, unknown>) => string,
  repoLabel: string,
): RunJSSourceMenuItem {
  const entryLabel = getEntryLabel(entry);
  const label = entryLabel;
  return {
    key: `entry:${entry.id}`,
    label,
    searchText: [
      label,
      entryLabel,
      entry.entryName,
      entry.entryPath,
      entry.repoId,
      repoLabel,
      getKindLabel(entry.kind as LightExtensionKind, t),
    ]
      .filter(Boolean)
      .join(' '),
    selected:
      input.sourceMode === 'light-extension' &&
      currentBinding?.repoId === entry.repoId &&
      currentBinding.entryId === entry.id &&
      currentBinding.kind === entry.kind,
    onSelect({ params, defaultParams }) {
      return {
        ...defaultParams,
        ...params,
        sourceMode: 'light-extension',
        sourceBinding: createRuntimeSourceBinding(entry, repoLabel),
        settings: normalizeLightExtensionEntrySelection({
          currentBinding: params.sourceBinding,
          currentSettings: params.settings,
          nextBinding: createRuntimeSourceBinding(entry, repoLabel),
          descriptor: {
            entryId: entry.id,
            settingsSchemaHash: entry.settingsSchemaHash,
            schema: entry.settingsSchema,
            defaults: extractRunJSSettingsDefaults(entry.settingsSchema),
          },
        }),
      };
    },
  };
}

function createRuntimeSourceBinding(
  entry: LightExtensionSelectableEntrySummary,
  repoLabel: string,
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: entry.repoId,
    repoTitle: repoLabel,
    entryId: entry.id,
    entryTitle: getEntryLabel(entry),
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    kind: entry.kind,
  };
}

function getRepoLabel(repo: LightExtensionRepoRecord): string {
  return repo.title?.trim() || repo.name || repo.id;
}

function getKindLabel(kind: LightExtensionKind | string, t: (key: string) => string): string {
  if (kind === 'js-block') {
    return t('JS Block');
  }
  if (kind === 'js-page') {
    return t('JS page');
  }
  if (kind === 'js-field') {
    return t('JS Field');
  }
  if (kind === 'js-action') {
    return t('JS Action');
  }
  if (kind === 'js-item') {
    return t('JS Item');
  }
  return String(kind);
}

function toSupportedKind(value: string | undefined): LightExtensionKind | undefined {
  if (value && (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(value)) {
    return value as LightExtensionKind;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isLightExtensionRuntimeSourceBinding(value: unknown): value is LightExtensionRuntimeSourceBinding {
  return (
    isRecord(value) &&
    value.type === 'light-extension-entry' &&
    typeof value.repoId === 'string' &&
    value.repoId.trim().length > 0 &&
    typeof value.entryId === 'string' &&
    value.entryId.trim().length > 0 &&
    typeof value.kind === 'string' &&
    value.kind.trim().length > 0 &&
    Object.keys(value).every((key) => LIGHT_EXTENSION_SOURCE_BINDING_KEYS.has(key))
  );
}

const LIGHT_EXTENSION_SOURCE_BINDING_KEYS = new Set([
  'type',
  'repoId',
  'repoTitle',
  'entryId',
  'entryTitle',
  'entryName',
  'entryPath',
  'kind',
]);
