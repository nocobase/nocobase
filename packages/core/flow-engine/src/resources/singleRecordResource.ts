/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseRecordResource } from './baseRecordResource';

export class SingleRecordResource<TData = any> extends BaseRecordResource<TData> {
  constructor() {
    super();
    // 设置单记录资源的默认 actionName
    this.meta.actionName = 'get';
    this.request.method = 'get';
  }

  setFilterByTk(filterByTk: string | number): void {
    this.request.params = { ...this.request.params, filterByTk };
  }

  async save(data: TData): Promise<void> {
    const options: any = {
      headers: this.request.headers,
      params: {},
    };
    let actionName = 'create';
    if (this.request.params.filterByTk) {
      options.params.filterByTk = this.request.params.filterByTk;
      actionName = 'update';
    }
    await this.runAction(actionName, {
      ...options,
      data,
      method: 'post',
    });
    await this.refresh();
  }

  async destroy(): Promise<void> {
    const options: any = {
      headers: this.request.headers,
      params: {},
      method: 'delete',
    };
    options.params.filterByTk = this.request.params.filterByTk;
    await this.runAction('destroy', {
      ...options,
    });
    this.setData(null);
  }

  async refresh(): Promise<void> {
    const options: any = this.getRequestOptions();
    const { data } = await this.runAction<{ data: TData }>(this.meta.actionName, options);
    this.setData(data);
  }
}
