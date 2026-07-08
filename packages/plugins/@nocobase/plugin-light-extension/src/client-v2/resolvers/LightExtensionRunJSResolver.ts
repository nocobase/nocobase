/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSourceResolver, RunJSSourceResolverInput, RunJSSourceResolverResult } from '@nocobase/client-v2';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntryRecord,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { listSelectableLightExtensionEntries, unwrapResourceResponse } from '../api/lightExtensionEntriesRequests';

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
            publicationId: runtime.publicationId,
            entryId: runtime.entryId,
            runtimeCodeHash: runtime.runtimeCodeHash,
            cache: runtime.cache,
          },
        },
      } satisfies RunJSSourceResolverResult;
    },
    async getBindingTitle(input) {
      const binding = input.sourceBinding as unknown as LightExtensionRuntimeSourceBinding | null | undefined;
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
      const binding = input.sourceBinding as unknown as LightExtensionRuntimeSourceBinding | null | undefined;
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

      const publication = entry.activePublication;
      if (!publication || publication.kind !== kind) {
        return undefined;
      }

      return {
        publicationId: publication.id,
        schema: publication.settingsSchemaSnapshot,
        defaults: isRecord(publication.settingsDefaultsSnapshot)
          ? cloneRecord(publication.settingsDefaultsSnapshot)
          : undefined,
        schemaHash: publication.settingsSchemaHash,
      };
    },
  };
}

export async function resolveLightExtensionRuntimeSource(
  api: ApiClientLike,
  input: RunJSSourceResolverInput,
): Promise<LightExtensionRuntimeResolveResult> {
  const payload: LightExtensionRuntimeResolveInput = {
    sourceMode: 'light-extension',
    sourceBinding: input.sourceBinding as unknown as LightExtensionRuntimeSourceBinding,
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

function toSupportedKind(value: string | undefined): LightExtensionKind | undefined {
  if (value && (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(value)) {
    return value as LightExtensionKind;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
