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
  stableSerialize,
} from '@nocobase/client-v2';
import { extractRunJSSettingsDefaults, normalizeLightExtensionEntrySelection } from '@nocobase/runjs/settings';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import {
  createJsTemplateRuntimeSourceBinding,
  JS_TEMPLATE_SOURCE_BINDING_TYPE,
  JS_TEMPLATE_SOURCE_MODE,
} from '../../shared/jsTemplateRunJSPersistence';
import type {
  LightExtensionKind,
  LightExtensionRuntimeArtifactRecord,
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntrySummary,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  listSelectableJsTemplateEntries,
  listSelectableLightExtensionEntries,
  unwrapResourceResponse,
} from '../api/lightExtensionEntriesRequests';
import {
  JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT,
  JS_TEMPLATE_RUNJS_HTTP_ALIASES,
} from '../jsTemplateRunJSIntegrationContract';
import {
  getLightExtensionSettingsDescriptorCache,
  type LightExtensionSettingsDescriptorCache,
} from './LightExtensionSettingsDescriptorCache';
import {
  getLightExtensionRuntimeIdentity,
  getOrCreateLightExtensionRuntimeCache,
  invalidateLightExtensionRuntimeCache,
  LightExtensionCacheGeneration,
  type LightExtensionCacheGenerationSnapshot,
} from './LightExtensionRuntimeCacheRegistry';

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export type JsTemplateRunJSSourceResolver = RunJSSourceResolver & {
  invalidateCache(repoId?: string): void;
};

export type LightExtensionRunJSSourceResolver = JsTemplateRunJSSourceResolver;

type SelectableEntryLoader = typeof listSelectableJsTemplateEntries;

type RuntimeTransport = {
  listSelectableEntries: SelectableEntryLoader;
  requestRuntimeResolve: (
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: LightExtensionRuntimeSourceBinding,
  ) => Promise<LightExtensionRuntimeResolveResult>;
  requestRuntimeArtifact: (
    api: ApiClientLike,
    response: LightExtensionRuntimeResolveResult,
  ) => Promise<LightExtensionRuntimeArtifactRecord>;
};

const jsTemplateRuntimeTransport: RuntimeTransport = {
  listSelectableEntries: listSelectableJsTemplateEntries,
  requestRuntimeResolve: requestJsTemplateRuntimeResolve,
  requestRuntimeArtifact: requestJsTemplateRuntimeArtifact,
};

const lightExtensionRuntimeTransport: RuntimeTransport = {
  listSelectableEntries: listSelectableLightExtensionEntries,
  requestRuntimeResolve: requestLightExtensionRuntimeResolve,
  requestRuntimeArtifact: requestLightExtensionRuntimeArtifact,
};

export function createJsTemplateRunJSResolver(api: ApiClientLike): JsTemplateRunJSSourceResolver {
  return createRunJSResolver(api, jsTemplateRuntimeTransport);
}

export function createLightExtensionRunJSResolver(api: ApiClientLike): LightExtensionRunJSSourceResolver {
  return createRunJSResolver(api, lightExtensionRuntimeTransport);
}

function createRunJSResolver(api: ApiClientLike, transport: RuntimeTransport): JsTemplateRunJSSourceResolver {
  const runtimeCache = getOrCreateLightExtensionRuntimeCache(
    api,
    (generation) => new LightExtensionRuntimeCache(generation),
  );
  const settingsDescriptorCache = getLightExtensionSettingsDescriptorCache(api);

  return {
    sourceMode: JS_TEMPLATE_SOURCE_MODE,
    invalidateCache(repoId) {
      invalidateLightExtensionRuntimeCache(api, repoId);
      if (repoId) {
        settingsDescriptorCache.invalidateRepo(repoId);
      } else {
        settingsDescriptorCache.clear();
      }
    },
    async resolve(input) {
      const runtime = await resolveRuntimeSource(api, input, runtimeCache, transport);
      return {
        code: runtime.code,
        version: runtime.version,
        sourceMap: runtime.sourceMap,
        settings: runtime.settings,
        context: {
          ...(input.context || {}),
          [JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT.runtimeContextKey]: {
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

      const entries = await transport.listSelectableEntries(api, {
        repoId: binding.repoId,
        kind,
      });
      settingsDescriptorCache.primeScope(binding.repoId, kind, entries);
      const entry = entries.find((item) => item.id === binding.entryId);
      if (!entry || entry.kind !== kind) {
        return undefined;
      }

      return `${getRepoLabel(entry)} / ${getEntryLabel(entry)}`;
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
          transport.listSelectableEntries(api, {
            repoId: binding.repoId,
            kind,
          }),
      );
    },
    async listSourceMenuItems(input) {
      return listSourceMenuItems(api, input, settingsDescriptorCache, transport.listSelectableEntries);
    },
  };
}

interface ResolvedLightExtensionRuntimeSource extends LightExtensionRuntimeArtifactRecord {
  entryId: string;
  settings: Record<string, unknown>;
}

export class LightExtensionRuntimeCache {
  static readonly POSITIVE_TTL_MS = 30_000;

  private readonly artifacts = new Map<string, LightExtensionRuntimeArtifactRecord>();
  private readonly artifactInFlight = new Map<string, Promise<LightExtensionRuntimeArtifactRecord>>();
  private readonly resolveInFlight = new Map<string, Promise<ResolvedLightExtensionRuntimeSource>>();
  private readonly bindings = new Map<
    string,
    {
      sourceBinding: LightExtensionRuntimeSourceBinding;
      response: LightExtensionRuntimeResolveResult;
      artifact: LightExtensionRuntimeArtifactRecord;
      expiresAt: number;
    }
  >();

  constructor(private readonly generation = new LightExtensionCacheGeneration()) {}

  resolve(
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: LightExtensionRuntimeSourceBinding,
    transport: RuntimeTransport = lightExtensionRuntimeTransport,
  ): Promise<ResolvedLightExtensionRuntimeSource> {
    const requestInput = {
      ...input,
      settings: JSON.parse(JSON.stringify(input.settings || {})) as Record<string, unknown>,
    };
    const requestSourceBinding = { ...sourceBinding };
    const identity = getLightExtensionRuntimeIdentity(api);
    const generation = this.generation.get(requestSourceBinding.repoId);
    const bindingKey = getRuntimeBindingKey(requestSourceBinding, requestInput.settings, identity, generation);
    const cached = this.bindings.get(bindingKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(toResolvedRuntime(cached.response, cached.artifact));
    }
    if (cached) {
      this.bindings.delete(bindingKey);
    }
    const existing = this.resolveInFlight.get(bindingKey);
    if (existing) {
      return existing;
    }
    const request = this.resolveUncached(
      api,
      requestInput,
      requestSourceBinding,
      bindingKey,
      identity,
      generation,
      transport,
    );
    this.resolveInFlight.set(bindingKey, request);
    return request.finally(() => {
      if (this.resolveInFlight.get(bindingKey) === request) {
        this.resolveInFlight.delete(bindingKey);
      }
    });
  }

  invalidateRepo(repoId: string): void {
    this.generation.invalidateRepo(repoId);
    for (const [bindingKey, cached] of this.bindings) {
      if (cached.sourceBinding.repoId === repoId) {
        this.bindings.delete(bindingKey);
      }
    }
  }

  clear(): void {
    this.generation.clear();
    this.artifacts.clear();
    this.artifactInFlight.clear();
    this.resolveInFlight.clear();
    this.bindings.clear();
  }

  private async resolveUncached(
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: LightExtensionRuntimeSourceBinding,
    bindingKey: string,
    identity: string,
    generation: LightExtensionCacheGenerationSnapshot,
    transport: RuntimeTransport,
  ): Promise<ResolvedLightExtensionRuntimeSource> {
    const response = await transport.requestRuntimeResolve(api, input, sourceBinding);
    if (!this.isCurrent(api, sourceBinding.repoId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    try {
      const artifact = await this.getArtifact(api, response, transport, () =>
        this.isCurrent(api, sourceBinding.repoId, identity, generation),
      );
      return this.cacheOrResolveCurrent(
        api,
        input,
        sourceBinding,
        bindingKey,
        identity,
        generation,
        response,
        artifact,
        transport,
      );
    } catch (error) {
      if (!isArtifactNotFoundError(error)) {
        throw error;
      }
    }
    if (!this.isCurrent(api, sourceBinding.repoId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    const retryResponse = await transport.requestRuntimeResolve(api, input, sourceBinding);
    if (!this.isCurrent(api, sourceBinding.repoId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    const retryArtifact = await this.getArtifact(api, retryResponse, transport, () =>
      this.isCurrent(api, sourceBinding.repoId, identity, generation),
    );
    return this.cacheOrResolveCurrent(
      api,
      input,
      sourceBinding,
      bindingKey,
      identity,
      generation,
      retryResponse,
      retryArtifact,
      transport,
    );
  }

  private getArtifact(
    api: ApiClientLike,
    response: LightExtensionRuntimeResolveResult,
    transport: RuntimeTransport,
    canCache: () => boolean,
  ): Promise<LightExtensionRuntimeArtifactRecord> {
    const cached = this.artifacts.get(response.artifactHash);
    if (cached) {
      return Promise.resolve(cached);
    }
    const existing = this.artifactInFlight.get(response.artifactHash);
    const request = existing || transport.requestRuntimeArtifact(api, response);
    if (!existing) {
      this.artifactInFlight.set(response.artifactHash, request);
    }
    return request
      .then((artifact) => {
        if (canCache()) {
          this.artifacts.set(response.artifactHash, artifact);
        }
        return artifact;
      })
      .finally(() => {
        if (!existing && this.artifactInFlight.get(response.artifactHash) === request) {
          this.artifactInFlight.delete(response.artifactHash);
        }
      });
  }

  private cacheOrResolveCurrent(
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: LightExtensionRuntimeSourceBinding,
    bindingKey: string,
    identity: string,
    generation: LightExtensionCacheGenerationSnapshot,
    response: LightExtensionRuntimeResolveResult,
    artifact: LightExtensionRuntimeArtifactRecord,
    transport: RuntimeTransport,
  ): Promise<ResolvedLightExtensionRuntimeSource> {
    if (!this.isCurrent(api, sourceBinding.repoId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    this.bindings.set(bindingKey, {
      sourceBinding,
      response,
      artifact,
      expiresAt: Date.now() + LightExtensionRuntimeCache.POSITIVE_TTL_MS,
    });
    return Promise.resolve(toResolvedRuntime(response, artifact));
  }

  private isCurrent(
    api: ApiClientLike,
    repoId: string,
    identity: string,
    generation: LightExtensionCacheGenerationSnapshot,
  ): boolean {
    return this.generation.isCurrent(repoId, generation) && getLightExtensionRuntimeIdentity(api) === identity;
  }
}

export async function resolveLightExtensionRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  runtimeCache = new LightExtensionRuntimeCache(),
): Promise<ResolvedLightExtensionRuntimeSource> {
  return resolveRuntimeSource(api, input, runtimeCache, lightExtensionRuntimeTransport);
}

export async function resolveJsTemplateRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  runtimeCache = new LightExtensionRuntimeCache(),
): Promise<ResolvedLightExtensionRuntimeSource> {
  return resolveRuntimeSource(api, input, runtimeCache, jsTemplateRuntimeTransport);
}

async function resolveRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  runtimeCache: LightExtensionRuntimeCache,
  transport: RuntimeTransport,
): Promise<ResolvedLightExtensionRuntimeSource> {
  if (!isLightExtensionRuntimeSourceBinding(input.sourceBinding)) {
    throw new RunJSSourceResolverError("RunJS source 'light-extension' requires a valid sourceBinding", {
      code: 'RUNJS_SOURCE_BINDING_REQUIRED',
      sourceMode: JS_TEMPLATE_SOURCE_MODE,
    });
  }
  return runtimeCache.resolve(api, input, input.sourceBinding, transport);
}

async function requestLightExtensionRuntimeResolve(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  sourceBinding: LightExtensionRuntimeSourceBinding,
): Promise<LightExtensionRuntimeResolveResult> {
  const payload: LightExtensionRuntimeResolveInput = {
    sourceMode: JS_TEMPLATE_SOURCE_MODE,
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

async function requestJsTemplateRuntimeResolve(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  sourceBinding: LightExtensionRuntimeSourceBinding,
): Promise<LightExtensionRuntimeResolveResult> {
  const payload: LightExtensionRuntimeResolveInput = {
    sourceMode: JS_TEMPLATE_SOURCE_MODE,
    sourceBinding,
    settings: input.settings || {},
  };
  const response = await api.request<ResourceResponse<LightExtensionRuntimeResolveResult>>({
    url: JS_TEMPLATE_RUNJS_HTTP_ALIASES.runtimeResolve,
    method: 'post',
    data: payload,
  });

  return unwrapResourceResponse(response);
}

async function requestLightExtensionRuntimeArtifact(
  api: ApiClientLike,
  response: LightExtensionRuntimeResolveResult,
): Promise<LightExtensionRuntimeArtifactRecord> {
  const artifactResponse = await api.request<ResourceResponse<LightExtensionRuntimeArtifactRecord>>({
    url: getRuntimeArtifactRequestUrl(response.artifactHash),
    method: 'get',
  });
  const artifact = unwrapResourceResponse(artifactResponse);
  if (!artifact?.code || artifact.artifactHash !== response.artifactHash) {
    throw new RunJSSourceResolverError(`JS Template artifact '${response.artifactHash}' is invalid`, {
      code: 'RUNJS_SOURCE_CODE_REQUIRED',
      sourceMode: JS_TEMPLATE_SOURCE_MODE,
    });
  }
  return artifact;
}

async function requestJsTemplateRuntimeArtifact(
  api: ApiClientLike,
  response: LightExtensionRuntimeResolveResult,
): Promise<LightExtensionRuntimeArtifactRecord> {
  const artifactResponse = await api.request<ResourceResponse<LightExtensionRuntimeArtifactRecord>>({
    url: JS_TEMPLATE_RUNJS_HTTP_ALIASES.runtimeGetArtifact,
    method: 'post',
    data: { artifactHash: response.artifactHash },
  });
  const artifact = unwrapResourceResponse(artifactResponse);
  if (!artifact?.code || artifact.artifactHash !== response.artifactHash) {
    throw new RunJSSourceResolverError(`JS Template artifact '${response.artifactHash}' is invalid`, {
      code: 'RUNJS_SOURCE_CODE_REQUIRED',
      sourceMode: JS_TEMPLATE_SOURCE_MODE,
    });
  }
  return artifact;
}

function getRuntimeArtifactRequestUrl(artifactHash: string): string {
  return `/light-extension-runtime/artifacts/${encodeURIComponent(artifactHash)}`;
}

function getRuntimeBindingKey(
  sourceBinding: LightExtensionRuntimeSourceBinding,
  settings: unknown,
  identity: string,
  generation: LightExtensionCacheGenerationSnapshot,
): string {
  return JSON.stringify([
    identity,
    generation.global,
    generation.repo,
    sourceBinding.repoId,
    sourceBinding.entryId,
    sourceBinding.kind,
    stableSerialize(settings || {}),
  ]);
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

async function listSourceMenuItems(
  api: ApiClientLike,
  input: RunJSSourceMenuInput,
  settingsDescriptorCache: LightExtensionSettingsDescriptorCache,
  listSelectableEntries: SelectableEntryLoader,
): Promise<RunJSSourceMenuItem[]> {
  const kind = toSupportedKind(input.kind);
  if (!kind) {
    return [];
  }

  const entries = await listSelectableEntries(api, { kind });
  const selectableEntries = entries.filter((entry) => entry.kind === kind && entry.runtimeAvailable === true);
  const t = input.t || ((key: string) => key);
  const currentBinding = isLightExtensionRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : null;
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
    const repoLabel = getRepoLabel(entriesInRepo[0]);
    const entryItems = entriesInRepo.map((entry) => createEntryMenuItem(entry, currentBinding, input, t, repoLabel));
    return {
      key: `repo:${repoId}`,
      label: repoLabel,
      searchText: [
        repoId,
        repoLabel,
        ...entriesInRepo.flatMap((entry) => [getEntryLabel(entry), entry.entryName, entry.entryPath]),
      ].join(' '),
      children: entryItems,
    };
  });

  return [
    {
      key: JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT.sourceMenuGroupKey,
      label: t('JS Templates'),
      searchText: [t('JS Templates'), ...selectableEntries.map((entry) => getEntryLabel(entry))].join(' '),
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
      input.sourceMode === JS_TEMPLATE_SOURCE_MODE &&
      currentBinding?.repoId === entry.repoId &&
      currentBinding.entryId === entry.id &&
      currentBinding.kind === entry.kind,
    onSelect({ params, defaultParams }) {
      return {
        ...defaultParams,
        ...params,
        sourceMode: JS_TEMPLATE_SOURCE_MODE,
        sourceBinding: createRuntimeSourceBinding(entry),
        settings: normalizeLightExtensionEntrySelection({
          currentBinding: params.sourceBinding,
          currentSettings: params.settings,
          nextBinding: createRuntimeSourceBinding(entry),
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

function createRuntimeSourceBinding(entry: LightExtensionSelectableEntrySummary): LightExtensionRuntimeSourceBinding {
  return createJsTemplateRuntimeSourceBinding({
    repoId: entry.repoId,
    ...(typeof entry.repoName !== 'undefined' ? { repoName: entry.repoName } : {}),
    ...(typeof entry.repoTitle !== 'undefined' ? { repoTitle: entry.repoTitle } : {}),
    entryId: entry.id,
    entryTitle: getEntryLabel(entry),
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    kind: entry.kind,
  });
}

function getRepoLabel(entry?: LightExtensionSelectableEntrySummary): string {
  return entry?.repoTitle?.trim() || entry?.repoName?.trim() || entry?.repoId || '';
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
    value.type === JS_TEMPLATE_SOURCE_BINDING_TYPE &&
    typeof value.repoId === 'string' &&
    value.repoId.trim().length > 0 &&
    typeof value.entryId === 'string' &&
    value.entryId.trim().length > 0 &&
    typeof value.kind === 'string' &&
    value.kind.trim().length > 0 &&
    Object.keys(value).every((key) => LIGHT_EXTENSION_SOURCE_BINDING_KEYS.has(key))
  );
}

export const isJsTemplateRuntimeSourceBinding = isLightExtensionRuntimeSourceBinding;
export { LightExtensionRuntimeCache as JsTemplateRuntimeCache };

const LIGHT_EXTENSION_SOURCE_BINDING_KEYS = new Set([
  'type',
  'repoId',
  'repoName',
  'repoTitle',
  'entryId',
  'entryTitle',
  'entryName',
  'entryPath',
  'kind',
]);
