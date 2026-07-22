/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSSettingsDescriptorProvider,
  RunJSSettingsDescriptorProviderInput,
  RunJSSourceSettingsDescriptor,
} from '@nocobase/client-v2';
import { buildLightExtensionSettingsSchema } from '@nocobase/light-extension-sdk/schema';
import { extractRunJSSettingsDefaults } from '@nocobase/runjs/settings';

import { LIGHT_EXTENSION_ENTRY_KEY_PATTERN } from '../../constants';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { unwrapResourceResponse } from '../api/lightExtensionEntriesRequests';

const INLINE_SOURCE_MODE = 'inline';
const INLINE_ENTRY_DESCRIPTOR_PATH = 'src/client/entry.json';

type InlineRunJSSourceRef = {
  type: 'vsc-file';
  repoId: string;
  commitId?: string;
};

type InlineRunJSWorkspaceFile = {
  path: string;
  content: string;
};

type InlineRunJSWorkspaceResult = {
  repository: {
    id: string;
    repoId?: string;
    headCommitId?: string | null;
  };
  files: InlineRunJSWorkspaceFile[];
};

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export function createInlineLightExtensionSettingsDescriptorProvider(
  api: ApiClientLike,
): RunJSSettingsDescriptorProvider {
  return {
    key: '@nocobase/plugin-light-extension/inline-settings-descriptor',
    priority: 100,
    canHandle: isInlineLightExtensionSettingsDescriptorInput,
    async getSettingsDescriptor(input) {
      const sourceRef = toInlineRunJSSourceRef(input.sourceRef);
      if (!sourceRef || input.locator?.kind !== 'flowModel.step') {
        return undefined;
      }

      const response = await api.request<ResourceResponse<InlineRunJSWorkspaceResult>>({
        url: 'runJSSources:open',
        method: 'post',
        data: {
          locator: input.locator,
          ...(input.runJs
            ? {
                initialSource: {
                  code: input.runJs.code,
                  version: input.runJs.version || 'v2',
                },
              }
            : {}),
        },
      });
      const workspace = unwrapResourceResponse(response);
      const workspaceRepoId = workspace.repository.repoId || workspace.repository.id;
      if (workspaceRepoId !== sourceRef.repoId) {
        return undefined;
      }
      const descriptorFile = workspace.files.find((file) => normalizePath(file.path) === INLINE_ENTRY_DESCRIPTOR_PATH);
      if (!descriptorFile) {
        return undefined;
      }

      return parseInlineSettingsDescriptor(
        descriptorFile.content,
        workspaceRepoId,
        workspace.repository.headCommitId || sourceRef.commitId || '',
      );
    },
  };
}

function parseInlineSettingsDescriptor(
  content: string,
  repoId: string,
  version: string,
): RunJSSourceSettingsDescriptor | undefined {
  let descriptor: unknown;
  try {
    descriptor = JSON.parse(content);
  } catch {
    return undefined;
  }
  if (!isRecord(descriptor) || descriptor.schemaVersion !== 1) {
    return undefined;
  }
  const key = toNonEmptyString(descriptor.key);
  if (!key || !LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(key)) {
    return undefined;
  }
  const hasSettings = Object.prototype.hasOwnProperty.call(descriptor, 'settings');
  const hasSettingsSchema = Object.prototype.hasOwnProperty.call(descriptor, 'settingsSchema');
  if (hasSettings && hasSettingsSchema) {
    return undefined;
  }
  if (hasSettings && !isRecord(descriptor.settings)) {
    return undefined;
  }
  if (hasSettingsSchema && !isRecord(descriptor.settingsSchema)) {
    return undefined;
  }
  const schema: Record<string, unknown> | null = hasSettings
    ? buildLightExtensionSettingsSchema(descriptor.settings as Record<string, unknown>)
    : hasSettingsSchema && isRecord(descriptor.settingsSchema)
      ? descriptor.settingsSchema
      : null;
  if (!schema || !isRecord(schema.properties) || Object.keys(schema.properties).length === 0) {
    return {
      entryId: `inline:${repoId}:${key}`,
      settingsSchemaHash: null,
      schema: null,
      defaults: {},
    };
  }
  return {
    entryId: `inline:${repoId}:${key}`,
    settingsSchemaHash: `${version || 'working'}:${shortHash(stableSerialize(schema))}`,
    schema,
    defaults: extractRunJSSettingsDefaults(schema),
  };
}

function isInlineLightExtensionSettingsDescriptorInput(input: RunJSSettingsDescriptorProviderInput): boolean {
  return (
    input.sourceMode === INLINE_SOURCE_MODE &&
    input.locator?.kind === 'flowModel.step' &&
    Boolean(toInlineRunJSSourceRef(input.sourceRef))
  );
}

function toInlineRunJSSourceRef(value: unknown): InlineRunJSSourceRef | undefined {
  if (!isRecord(value) || value.type !== 'vsc-file') {
    return undefined;
  }
  const repoId = toNonEmptyString(value.repoId);
  if (!repoId) {
    return undefined;
  }
  return {
    type: 'vsc-file',
    repoId,
    ...(toNonEmptyString(value.commitId) ? { commitId: toNonEmptyString(value.commitId) } : {}),
  };
}

function normalizePath(path: string): string {
  return path.replace(/\\/gu, '/').replace(/^\/+|\/+$/gu, '');
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 8);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
