/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface AvailableActionOptions {
  /**
   * @deprecated
   */
  type?: 'new-data' | 'old-data';
  displayName?: string;
  aliases?: string[] | string;
  resource?: string;
  // 对新数据进行操作
  onNewRecord?: boolean;
  // 允许配置字段
  allowConfigureFields?: boolean;
}

export class ACLAvailableAction {
  constructor(public name: string, public options: AvailableActionOptions) {}
}
