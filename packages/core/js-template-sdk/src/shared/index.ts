/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface JsTemplateSettingsContext<TSettings = unknown> {
  settings: TSettings;
}

export type JsTemplateContextRecord = Record<string, unknown>;

export interface JsTemplateDataContext<TSettings = unknown> extends JsTemplateSettingsContext<TSettings> {
  record?: JsTemplateContextRecord | null;
  records?: JsTemplateContextRecord[];
  values?: JsTemplateContextRecord;
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
