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

declare const lightExtensionCollectionTypes: unique symbol;

export interface LightExtensionCollectionContext<
  TDataSourceKey extends string = string,
  TName extends string = string,
  TRecord = unknown,
  TCreateValues = unknown,
  TUpdateValues = unknown,
> {
  readonly dataSourceKey?: TDataSourceKey;
  readonly name?: TName;
  readonly [lightExtensionCollectionTypes]?: {
    create: TCreateValues;
    record: TRecord;
    update: TUpdateValues;
  };
}

export interface LightExtensionDataSourceContext<TKey extends string = string> {
  readonly key?: TKey;
}

export interface LightExtensionDataContext<
  TSettings = unknown,
  TRecord = unknown,
  TValues = unknown,
  TCollection = unknown,
  TCollectionField = unknown,
  TDataSource = unknown,
> extends LightExtensionSettingsContext<TSettings> {
  record?: TRecord | null;
  records?: TRecord[];
  values?: TValues;
  collection?: TCollection;
  collectionField?: TCollectionField;
  dataSource?: TDataSource;
}

export function defineSettings<TSettings>(settings: TSettings): TSettings {
  return settings;
}

export function assertSettings<TSettings>(settings: TSettings): TSettings {
  return settings;
}
