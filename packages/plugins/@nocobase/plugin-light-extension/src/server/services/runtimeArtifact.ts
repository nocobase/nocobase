/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionEntryRecord } from '../../shared/types';
import type { LightExtensionRuntimeSettingsSource } from './SettingsResolverService';

export function hasUsableRuntimeArtifact(entry: LightExtensionEntryRecord, repoHeadCommitId: string | null): boolean {
  return Boolean(
    repoHeadCommitId && entry.compiledCommitId === repoHeadCommitId && entry.artifactHash && entry.runtimeCodeHash,
  );
}

export function getRuntimeSettingsSource(entry: LightExtensionEntryRecord): LightExtensionRuntimeSettingsSource {
  return {
    id: entry.id,
    settingsSchema: getRuntimeSettingsSchema(entry),
    settingsDefaultsHash: entry.settingsDefaultsHash,
  };
}

function getRuntimeSettingsSchema(entry: LightExtensionEntryRecord): Record<string, unknown> | null {
  return cloneRecordOrNull(entry.settingsSchema);
}

function cloneRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
