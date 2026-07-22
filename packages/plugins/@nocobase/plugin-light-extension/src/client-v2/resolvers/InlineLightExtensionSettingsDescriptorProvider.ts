/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSettingsDescriptorProvider, RunJSSettingsDescriptorProviderInput } from '@nocobase/client-v2';

import type { LightExtensionDiagnostic } from '../../shared/types';
import type { RunJSSourceOpenResult } from '../../shared/vsc-file/runjs-source-contracts';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { unwrapResourceResponse } from '../api/lightExtensionEntriesRequests';

const INLINE_SOURCE_MODE = 'inline';

type InlineRunJSSourceRef = {
  type: 'vsc-file';
  repoId: string;
  commitId?: string;
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

      const response = await api.request<ResourceResponse<RunJSSourceOpenResult>>({
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
      const descriptor = workspace.settingsDescriptor;
      const errorDiagnostics = descriptor.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
      if (errorDiagnostics.length > 0 || !descriptor.entryId) {
        throw new InlineRunJSSettingsDescriptorError(descriptor.descriptorPath, errorDiagnostics);
      }

      return {
        entryId: descriptor.entryId,
        settingsSchemaHash: descriptor.settingsSchemaHash,
        schema: descriptor.schema,
        defaults: descriptor.defaults,
      };
    },
  };
}

class InlineRunJSSettingsDescriptorError extends Error {
  readonly code = 'LIGHT_EXTENSION_SETTINGS_INVALID';
  readonly status = 422;
  readonly paths: string[];
  readonly details: {
    reasonCode: 'settings_invalid';
    descriptorPath: string;
    diagnostics: LightExtensionDiagnostic[];
    issues: Array<{ path: string; code: string; message: string }>;
  };

  constructor(descriptorPath: string, diagnostics: LightExtensionDiagnostic[]) {
    super(diagnostics[0]?.message || 'Inline RunJS settings descriptor is invalid');
    this.name = 'InlineRunJSSettingsDescriptorError';
    this.paths = Array.from(new Set(diagnostics.map((diagnostic) => diagnostic.path).filter(isNonEmptyString)));
    this.details = {
      reasonCode: 'settings_invalid',
      descriptorPath,
      diagnostics,
      issues: diagnostics.map((diagnostic) => ({
        path: diagnostic.path || descriptorPath,
        code: diagnostic.code,
        message: diagnostic.message,
      })),
    };
  }
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

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
