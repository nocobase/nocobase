/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface LightExtensionSettingsContext<TSettings = unknown> {
  settings: TSettings;
}

export type LightExtensionRecord = Record<string, unknown>;

export interface LightExtensionDataContext<TSettings = unknown> extends LightExtensionSettingsContext<TSettings> {
  record?: LightExtensionRecord | null;
  records?: LightExtensionRecord[];
  values?: LightExtensionRecord;
  collection?: unknown;
  collectionField?: unknown;
  dataSource?: unknown;
}

export function defineSettings<TSettings>(settings: TSettings): TSettings {
  return settings;
}

export function assertSettings<TSettings>(settings: TSettings): TSettings {
  return settings;
}
