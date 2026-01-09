/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type NamePath = Array<string | number>;

export type ValueSource = 'default' | 'linkage' | 'user' | 'system';

export type Patch =
  | Record<string, any>
  | Array<{
      path: string | NamePath;
      value: any;
      condition?: any;
    }>;

export interface SetOptions {
  source?: ValueSource;
  triggerEvent?: boolean;
  markExplicit?: boolean;
  txId?: string;
}

export interface FormValuesChangePayload {
  source: ValueSource;
  txId: string;
  changedPaths: NamePath[];
  changedValues?: any;
  allValues?: any;
  allValuesSnapshot?: any;
}

export type AssignMode = 'default' | 'assign';

export type FormAssignRuleItem = {
  key?: string;
  enable?: boolean;
  field?: string;
  mode?: AssignMode;
  condition?: any;
  value?: any;
};
