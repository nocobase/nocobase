/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type StorageFieldComponent =
  | 'checkbox'
  | 'input'
  | 'json'
  | 'number'
  | 'passwordVariableInput'
  | 'radio'
  | 'variableInput';

export interface StorageFieldMeta {
  name: string | string[];
  label: string;
  component: StorageFieldComponent;
  required?: boolean;
  hidden?: boolean;
  defaultValue?: any;
  description?: string;
  placeholder?: string;
  addonBefore?: string;
}

export interface StorageTypeMeta {
  name: string;
  title: string;
  thumbnailRuleLink?: string;
  fields: StorageFieldMeta[];
}
