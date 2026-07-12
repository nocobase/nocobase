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
} from '@nocobase/client-v2';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionRepoRecord,
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntryRecord,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  listLightExtensionRepos,
  listSelectableLightExtensionEntries,
  unwrapResourceResponse,
} from '../api/lightExtensionEntriesRequests';

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export function createLightExtensionRunJSResolver(api: ApiClientLike): RunJSSourceResolver {
  return {
    sourceMode: 'light-extension',
    async resolve(input) {
      const runtime = await resolveLightExtensionRuntimeSource(api, input);
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
            runtimeCodeHash: runtime.runtimeCodeHash,
            cache: runtime.cache,
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

      const entries = await listSelectableLightExtensionEntries(api, {
        repoId: binding.repoId,
        kind,
      });
      const entry = entries.find((item) => item.id === binding.entryId);
      if (!entry || entry.kind !== kind) {
        return undefined;
      }

      return getEntryLabel(entry);
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

      const entries = await listSelectableLightExtensionEntries(api, {
        repoId: binding.repoId,
        kind,
      });
      const entry = entries.find((item) => item.id === binding.entryId);
      if (!entry || entry.kind !== kind) {
        return undefined;
      }

      return {
        schema: entry.settingsSchema,
        defaults: extractSettingsDefaults(entry.settingsSchema),
        schemaHash: entry.settingsDefaultsHash,
      };
    },
    async listSourceMenuItems(input) {
      return listLightExtensionSourceMenuItems(api, input);
    },
  };
}

export async function resolveLightExtensionRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
): Promise<LightExtensionRuntimeResolveResult> {
  if (!isLightExtensionRuntimeSourceBinding(input.sourceBinding)) {
    throw new RunJSSourceResolverError("RunJS source 'light-extension' requires a valid sourceBinding", {
      code: 'RUNJS_SOURCE_BINDING_REQUIRED',
      sourceMode: 'light-extension',
    });
  }
  const payload: LightExtensionRuntimeResolveInput = {
    sourceMode: 'light-extension',
    sourceBinding: input.sourceBinding,
    settings: input.settings || {},
  };
  const response = await api.request<ResourceResponse<LightExtensionRuntimeResolveResult>>({
    url: '/light-extension-runtime/resolve',
    method: 'post',
    data: payload,
  });

  return unwrapResourceResponse(response);
}

function getEntryLabel(entry: LightExtensionSelectableEntryRecord): string {
  return entry.title || entry.entryName || entry.id;
}

async function listLightExtensionSourceMenuItems(
  api: ApiClientLike,
  input: RunJSSourceMenuInput,
): Promise<RunJSSourceMenuItem[]> {
  const kind = toSupportedKind(input.kind);
  if (!kind) {
    return [];
  }

  const [entries, repos] = await Promise.all([
    listSelectableLightExtensionEntries(api, { kind }),
    listLightExtensionRepos(api).catch(() => [] as LightExtensionRepoRecord[]),
  ]);
  const selectableEntries = entries.filter((entry) => entry.kind === kind && Boolean(entry.runtimeArtifact?.code));
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
  }, new Map<string, LightExtensionSelectableEntryRecord[]>());
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
  entry: LightExtensionSelectableEntryRecord,
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
        settings: mergeSettings(
          extractSettingsDefaults(entry.settingsSchema),
          isRecord(params.settings) ? params.settings : undefined,
          entry.settingsSchema,
        ),
      };
    },
  };
}

function createRuntimeSourceBinding(
  entry: LightExtensionSelectableEntryRecord,
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
  return repo.title || repo.name || repo.id;
}

function mergeSettings(
  defaults: Record<string, unknown>,
  current: Record<string, unknown> | undefined,
  settingsSchema: Record<string, unknown> | null,
): Record<string, unknown> {
  const allowedSettings = getSettingsSchemaPropertyNames(settingsSchema);
  if (!allowedSettings) {
    return {
      ...defaults,
      ...(current || {}),
    };
  }

  return {
    ...defaults,
    ...(current ? Object.fromEntries(Object.entries(current).filter(([key]) => allowedSettings.has(key))) : {}),
  };
}

function getSettingsSchemaPropertyNames(schema: unknown): Set<string> | null {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return null;
  }
  return new Set(Object.keys(schema.properties));
}

function getKindLabel(kind: LightExtensionKind | string, t: (key: string) => string): string {
  if (kind === 'js-block') {
    return t('JS Block');
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
  if (kind === 'runjs') {
    return t('RunJS');
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

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function extractSettingsDefaults(schema: Record<string, unknown> | null): Record<string, unknown> {
  if (!schema) {
    return {};
  }
  if (isRecord(schema.default)) {
    return cloneRecord(schema.default);
  }
  if (!isRecord(schema.properties)) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    if (!isRecord(propertySchema)) {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(propertySchema, 'default')) {
      defaults[key] = cloneJsonValue(propertySchema.default);
      continue;
    }
    const childDefaults = extractSettingsDefaults(propertySchema);
    if (Object.keys(childDefaults).length > 0) {
      defaults[key] = childDefaults;
    }
  }
  return defaults;
}

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}
