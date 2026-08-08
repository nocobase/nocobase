/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplate } from '../../shared/types';
import type { JsTemplateRuntimeSettingsSource } from './JsTemplateSettingsService';

export function hasUsableRuntimeArtifact(template: JsTemplate, projectHeadCommitId: string | null): boolean {
  return Boolean(
    projectHeadCommitId &&
      template.compiledCommitId === projectHeadCommitId &&
      template.artifactHash &&
      template.runtimeCodeHash,
  );
}

export function getRuntimeSettingsSource(template: JsTemplate): JsTemplateRuntimeSettingsSource {
  return {
    id: template.id,
    settingsSchema: getRuntimeSettingsSchema(template),
    settingsDefaultsHash: template.settingsDefaultsHash,
  };
}

function getRuntimeSettingsSchema(template: JsTemplate): Record<string, unknown> | null {
  return cloneRecordOrNull(template.settingsSchema);
}

function cloneRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
