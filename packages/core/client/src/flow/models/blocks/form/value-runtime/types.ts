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
  /**
   * linkage 规则定义所在层级，数值越大表示层级越内层。
   * 仅在 source='linkage' 且 linkageTxId 有效时参与同事务冲突裁决。
   */
  linkageScopeDepth?: number;
  /**
   * linkage 链路事务 id（通常来自 formValuesChange payload 的 txId）。
   * 仅在 source='linkage' 时使用。
   */
  linkageTxId?: string;
}

export interface FormValueWriteMeta {
  source: ValueSource;
  writeSeq: number;
  linkageScopeDepth?: number;
  linkageTxId?: string;
}

export interface FormValuesChangePayload {
  source: ValueSource;
  txId: string;
  /**
   * linkage 链路根事务 id。
   * 用于跨事件继续沿用同一 linkage 冲突裁决边界。
   */
  linkageTxId?: string;
  changedPaths: NamePath[];
  changedValues?: any;
  allValues?: any;
  allValuesSnapshot?: any;
}

export type AssignMode = 'default' | 'assign';

export type FormAssignRuleItem = {
  key?: string;
  enable?: boolean;
  /** 赋值目标路径，例如 `title` / `users.nickname` / `user.name` */
  targetPath?: string;
  mode?: AssignMode;
  condition?: any;
  value?: any;
};
