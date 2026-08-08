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
import { extractRunJSSettingsDefaults, normalizeJsTemplateSelection } from '@nocobase/runjs/settings';

import { JS_TEMPLATE_SUPPORTED_KINDS } from '../../constants';
import {
  createJsTemplateRuntimeSourceBinding,
  JS_TEMPLATE_SOURCE_BINDING_TYPE,
  JS_TEMPLATE_SOURCE_MODE,
} from '../../shared/jsTemplateRunJSPersistence';
import type {
  JsTemplateKind,
  JsTemplateArtifact,
  JsTemplateRuntimeResolveInput,
  JsTemplateRuntimeResolveResult,
  JsTemplateRuntimeSourceBinding,
  JsTemplateSelectableTemplateSummary,
} from '../../shared/types';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { listSelectableJsTemplates, unwrapResourceResponse } from '../api/jsTemplatesRequests';
import { JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT } from '../jsTemplateRunJSIntegrationContract';
import {
  getJsTemplateSettingsDescriptorCache,
  type JsTemplateSettingsDescriptorCache,
} from './JsTemplateSettingsDescriptorCache';
import {
  getJsTemplateRuntimeIdentity,
  getOrCreateJsTemplateRuntimeCache,
  invalidateJsTemplateRuntimeCache,
  JsTemplateCacheGeneration,
  type JsTemplateCacheGenerationSnapshot,
} from './JsTemplateRuntimeCacheRegistry';

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export type JsTemplateRunJSSourceResolver = RunJSSourceResolver & {
  invalidateCache(projectId?: string): void;
};

type SelectableTemplateLoader = typeof listSelectableJsTemplates;

type RuntimeTransport = {
  listSelectableTemplates: SelectableTemplateLoader;
  requestRuntimeResolve: (
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: JsTemplateRuntimeSourceBinding,
  ) => Promise<JsTemplateRuntimeResolveResult>;
  requestRuntimeArtifact: (api: ApiClientLike, response: JsTemplateRuntimeResolveResult) => Promise<JsTemplateArtifact>;
};

const jsTemplateRuntimeTransport: RuntimeTransport = {
  listSelectableTemplates: listSelectableJsTemplates,
  requestRuntimeResolve: requestJsTemplateRuntimeResolve,
  requestRuntimeArtifact: requestJsTemplateArtifact,
};

export function createJsTemplateRunJSResolver(api: ApiClientLike): JsTemplateRunJSSourceResolver {
  return createRunJSResolver(api, jsTemplateRuntimeTransport);
}

function createRunJSResolver(api: ApiClientLike, transport: RuntimeTransport): JsTemplateRunJSSourceResolver {
  const runtimeCache = getOrCreateJsTemplateRuntimeCache(api, (generation) => new JsTemplateRuntimeCache(generation));
  const settingsDescriptorCache = getJsTemplateSettingsDescriptorCache(api);

  return {
    sourceMode: JS_TEMPLATE_SOURCE_MODE,
    invalidateCache(projectId) {
      invalidateJsTemplateRuntimeCache(api, projectId);
      if (projectId) {
        settingsDescriptorCache.invalidateProject(projectId);
      } else {
        settingsDescriptorCache.clear();
      }
    },
    async resolve(input) {
      const runtime = await resolveRuntimeSource(api, input, runtimeCache, transport);
      return {
        code: runtime.code,
        version: runtime.runtimeVersion,
        sourceMap: runtime.sourceMap,
        settings: runtime.settings,
        context: {
          ...(input.context || {}),
          [JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT.runtimeContextKey]: {
            templateId: runtime.templateId,
            entryPath: runtime.entryPath,
            artifactHash: runtime.artifactHash,
            runtimeCodeHash: runtime.runtimeCodeHash,
          },
        },
      } satisfies RunJSSourceResolverResult;
    },
    async getBindingTitle(input) {
      const binding = isJsTemplateRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : undefined;
      if (!binding?.projectId || !binding.templateId) {
        return undefined;
      }
      const kind = toSupportedKind(binding.kind);
      if (!kind) {
        return undefined;
      }

      const templates = await transport.listSelectableTemplates(api, {
        projectId: binding.projectId,
        kind,
      });
      settingsDescriptorCache.primeScope(binding.projectId, kind, templates);
      const template = templates.find((item) => item.id === binding.templateId);
      if (!template || template.kind !== kind) {
        return undefined;
      }

      return `${getProjectLabel(template)} / ${getTemplateLabel(template)}`;
    },
    async getSettingsDescriptor(input) {
      const binding = isJsTemplateRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : undefined;
      if (!binding?.projectId || !binding.templateId) {
        return undefined;
      }
      const kind = toSupportedKind(binding.kind);
      if (!kind) {
        return undefined;
      }

      return settingsDescriptorCache.getOrLoad(
        {
          projectId: binding.projectId,
          templateId: binding.templateId,
          kind,
        },
        () =>
          transport.listSelectableTemplates(api, {
            projectId: binding.projectId,
            kind,
          }),
      );
    },
    async listSourceMenuItems(input) {
      return listSourceMenuItems(api, input, settingsDescriptorCache, transport.listSelectableTemplates);
    },
  };
}

interface ResolvedJsTemplateRuntimeSource extends JsTemplateArtifact {
  templateId: string;
  settings: Record<string, unknown>;
}

export class JsTemplateRuntimeCache {
  static readonly POSITIVE_TTL_MS = 30_000;

  private readonly artifacts = new Map<string, JsTemplateArtifact>();
  private readonly artifactInFlight = new Map<string, Promise<JsTemplateArtifact>>();
  private readonly resolveInFlight = new Map<string, Promise<ResolvedJsTemplateRuntimeSource>>();
  private readonly bindings = new Map<
    string,
    {
      sourceBinding: JsTemplateRuntimeSourceBinding;
      response: JsTemplateRuntimeResolveResult;
      artifact: JsTemplateArtifact;
      expiresAt: number;
    }
  >();

  constructor(private readonly generation = new JsTemplateCacheGeneration()) {}

  resolve(
    api: ApiClientLike,
    input: RunJSSourceResolverInput,
    sourceBinding: JsTemplateRuntimeSourceBinding,
    transport: RuntimeTransport = jsTemplateRuntimeTransport,
  ): Promise<ResolvedJsTemplateRuntimeSource> {
    const requestInput = {
      ...input,
      settings: JSON.parse(JSON.stringify(input.settings || {})) as Record<string, unknown>,
    };
    const requestSourceBinding = { ...sourceBinding };
    const identity = getJsTemplateRuntimeIdentity(api);
    const generation = this.generation.get(requestSourceBinding.projectId);
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

  invalidateProject(projectId: string): void {
    this.generation.invalidateProject(projectId);
    for (const [bindingKey, cached] of this.bindings) {
      if (cached.sourceBinding.projectId === projectId) {
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
    sourceBinding: JsTemplateRuntimeSourceBinding,
    bindingKey: string,
    identity: string,
    generation: JsTemplateCacheGenerationSnapshot,
    transport: RuntimeTransport,
  ): Promise<ResolvedJsTemplateRuntimeSource> {
    const response = await transport.requestRuntimeResolve(api, input, sourceBinding);
    if (!this.isCurrent(api, sourceBinding.projectId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    try {
      const artifact = await this.getArtifact(api, response, transport, () =>
        this.isCurrent(api, sourceBinding.projectId, identity, generation),
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
    if (!this.isCurrent(api, sourceBinding.projectId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    const retryResponse = await transport.requestRuntimeResolve(api, input, sourceBinding);
    if (!this.isCurrent(api, sourceBinding.projectId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    const retryArtifact = await this.getArtifact(api, retryResponse, transport, () =>
      this.isCurrent(api, sourceBinding.projectId, identity, generation),
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
    response: JsTemplateRuntimeResolveResult,
    transport: RuntimeTransport,
    canCache: () => boolean,
  ): Promise<JsTemplateArtifact> {
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
    sourceBinding: JsTemplateRuntimeSourceBinding,
    bindingKey: string,
    identity: string,
    generation: JsTemplateCacheGenerationSnapshot,
    response: JsTemplateRuntimeResolveResult,
    artifact: JsTemplateArtifact,
    transport: RuntimeTransport,
  ): Promise<ResolvedJsTemplateRuntimeSource> {
    if (!this.isCurrent(api, sourceBinding.projectId, identity, generation)) {
      return this.resolve(api, input, sourceBinding, transport);
    }
    this.bindings.set(bindingKey, {
      sourceBinding,
      response,
      artifact,
      expiresAt: Date.now() + JsTemplateRuntimeCache.POSITIVE_TTL_MS,
    });
    return Promise.resolve(toResolvedRuntime(response, artifact));
  }

  private isCurrent(
    api: ApiClientLike,
    projectId: string,
    identity: string,
    generation: JsTemplateCacheGenerationSnapshot,
  ): boolean {
    return this.generation.isCurrent(projectId, generation) && getJsTemplateRuntimeIdentity(api) === identity;
  }
}

export async function resolveJsTemplateRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  runtimeCache = new JsTemplateRuntimeCache(),
): Promise<ResolvedJsTemplateRuntimeSource> {
  return resolveRuntimeSource(api, input, runtimeCache, jsTemplateRuntimeTransport);
}

async function resolveRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  runtimeCache: JsTemplateRuntimeCache,
  transport: RuntimeTransport,
): Promise<ResolvedJsTemplateRuntimeSource> {
  if (!isJsTemplateRuntimeSourceBinding(input.sourceBinding)) {
    throw new RunJSSourceResolverError("RunJS source 'js-template' requires a valid sourceBinding", {
      code: 'RUNJS_SOURCE_BINDING_REQUIRED',
      sourceMode: JS_TEMPLATE_SOURCE_MODE,
    });
  }
  return runtimeCache.resolve(api, input, input.sourceBinding, transport);
}

async function requestJsTemplateRuntimeResolve(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
  sourceBinding: JsTemplateRuntimeSourceBinding,
): Promise<JsTemplateRuntimeResolveResult> {
  const payload: JsTemplateRuntimeResolveInput = {
    sourceMode: JS_TEMPLATE_SOURCE_MODE,
    sourceBinding,
    settings: input.settings || {},
  };
  const response = await api.request<ResourceResponse<JsTemplateRuntimeResolveResult>>({
    url: 'jsTemplateRuntime:resolve',
    method: 'post',
    data: payload,
  });

  return unwrapResourceResponse(response);
}

async function requestJsTemplateArtifact(
  api: ApiClientLike,
  response: JsTemplateRuntimeResolveResult,
): Promise<JsTemplateArtifact> {
  const artifactResponse = await api.request<ResourceResponse<JsTemplateArtifact>>({
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

function getRuntimeArtifactRequestUrl(artifactHash: string): string {
  return `jsTemplateRuntime:getArtifact/${encodeURIComponent(artifactHash)}`;
}

function getRuntimeBindingKey(
  sourceBinding: JsTemplateRuntimeSourceBinding,
  settings: unknown,
  identity: string,
  generation: JsTemplateCacheGenerationSnapshot,
): string {
  return JSON.stringify([
    identity,
    generation.global,
    generation.project,
    sourceBinding.projectId,
    sourceBinding.templateId,
    sourceBinding.kind,
    stableSerialize(settings || {}),
  ]);
}

function toResolvedRuntime(
  response: JsTemplateRuntimeResolveResult,
  artifact: JsTemplateArtifact,
): ResolvedJsTemplateRuntimeSource {
  return {
    ...artifact,
    templateId: response.templateId,
    entryPath: response.entryPath || artifact.entryPath,
    runtimeCodeHash: response.runtimeCodeHash,
    runtimeVersion: response.runtimeVersion || artifact.runtimeVersion,
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

function getTemplateLabel(template: JsTemplateSelectableTemplateSummary): string {
  return template.title?.trim() || template.templateName || template.id;
}

async function listSourceMenuItems(
  api: ApiClientLike,
  input: RunJSSourceMenuInput,
  settingsDescriptorCache: JsTemplateSettingsDescriptorCache,
  listSelectableTemplates: SelectableTemplateLoader,
): Promise<RunJSSourceMenuItem[]> {
  const kind = toSupportedKind(input.kind);
  if (!kind) {
    return [];
  }

  const templates = await listSelectableTemplates(api, { kind });
  const selectableTemplates = templates.filter(
    (template) => template.kind === kind && template.runtimeAvailable === true,
  );
  const t = input.t || ((key: string) => key);
  const currentBinding = isJsTemplateRuntimeSourceBinding(input.sourceBinding) ? input.sourceBinding : null;
  const templatesByProject = selectableTemplates.reduce((groups, template) => {
    const templatesInProject = groups.get(template.projectId);
    if (templatesInProject) {
      templatesInProject.push(template);
    } else {
      groups.set(template.projectId, [template]);
    }
    return groups;
  }, new Map<string, JsTemplateSelectableTemplateSummary[]>());
  for (const [projectId, templatesInProject] of templatesByProject) {
    settingsDescriptorCache.primeScope(projectId, kind, templatesInProject);
  }
  const sourceItems = Array.from(templatesByProject.entries()).map(([projectId, templatesInProject]) => {
    const projectLabel = getProjectLabel(templatesInProject[0]);
    const templateItems = templatesInProject.map((template) =>
      createTemplateMenuItem(template, currentBinding, input, t, projectLabel),
    );
    return {
      key: `project:${projectId}`,
      label: projectLabel,
      searchText: [
        projectId,
        projectLabel,
        ...templatesInProject.flatMap((template) => [
          getTemplateLabel(template),
          template.templateName,
          template.entryPath,
        ]),
      ].join(' '),
      children: templateItems,
    };
  });

  return [
    {
      key: JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT.sourceMenuGroupKey,
      label: t('JS Templates'),
      searchText: [t('JS Templates'), ...selectableTemplates.map((template) => getTemplateLabel(template))].join(' '),
      disabled: true,
    },
    ...sourceItems,
  ];
}

function createTemplateMenuItem(
  template: JsTemplateSelectableTemplateSummary,
  currentBinding: JsTemplateRuntimeSourceBinding | null,
  input: RunJSSourceMenuInput,
  t: (key: string, options?: Record<string, unknown>) => string,
  projectLabel: string,
): RunJSSourceMenuItem {
  const templateLabel = getTemplateLabel(template);
  const label = templateLabel;
  return {
    key: `template:${template.id}`,
    label,
    searchText: [
      label,
      templateLabel,
      template.templateName,
      template.entryPath,
      template.projectId,
      projectLabel,
      getKindLabel(template.kind, t),
    ]
      .filter(Boolean)
      .join(' '),
    selected:
      input.sourceMode === JS_TEMPLATE_SOURCE_MODE &&
      currentBinding?.projectId === template.projectId &&
      currentBinding.templateId === template.id &&
      currentBinding.kind === template.kind,
    onSelect({ params, defaultParams }) {
      return {
        ...defaultParams,
        ...params,
        sourceMode: JS_TEMPLATE_SOURCE_MODE,
        sourceBinding: createRuntimeSourceBinding(template),
        settings: normalizeJsTemplateSelection({
          currentBinding: params.sourceBinding,
          currentSettings: params.settings,
          nextBinding: createRuntimeSourceBinding(template),
          descriptor: {
            entryId: template.id,
            settingsSchemaHash: template.settingsSchemaHash,
            schema: template.settingsSchema,
            defaults: extractRunJSSettingsDefaults(template.settingsSchema),
          },
        }),
      };
    },
  };
}

function createRuntimeSourceBinding(template: JsTemplateSelectableTemplateSummary): JsTemplateRuntimeSourceBinding {
  return createJsTemplateRuntimeSourceBinding({
    projectId: template.projectId,
    templateId: template.id,
    kind: template.kind,
  });
}

function getProjectLabel(template?: JsTemplateSelectableTemplateSummary): string {
  return template?.projectTitle?.trim() || template?.projectName?.trim() || template?.projectId || '';
}

function getKindLabel(kind: JsTemplateKind | string, t: (key: string) => string): string {
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

function toSupportedKind(value: string | undefined): JsTemplateKind | undefined {
  if (value && (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(value)) {
    return value as JsTemplateKind;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isJsTemplateRuntimeSourceBinding(value: unknown): value is JsTemplateRuntimeSourceBinding {
  return (
    isRecord(value) &&
    value.type === JS_TEMPLATE_SOURCE_BINDING_TYPE &&
    typeof value.projectId === 'string' &&
    value.projectId.trim().length > 0 &&
    typeof value.templateId === 'string' &&
    value.templateId.trim().length > 0 &&
    typeof value.kind === 'string' &&
    (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(value.kind) &&
    Object.keys(value).every((key) => JS_TEMPLATE_SOURCE_BINDING_KEYS.has(key))
  );
}

const JS_TEMPLATE_SOURCE_BINDING_KEYS = new Set(['type', 'projectId', 'templateId', 'kind']);
