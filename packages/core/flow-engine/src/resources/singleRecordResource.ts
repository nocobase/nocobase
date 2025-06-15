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
  setFilterByTk(filterByTk: string | number) {
    this.addRequestParameter('filterByTk', filterByTk);
    return this;
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
    });
    await this.refresh();
  }

  async destroy(): Promise<void> {
    const options = {
      params: {
        filterByTk: this.request.params.filterByTk,
      },
    };
    await this.runAction('destroy', {
      ...options,
    });
    this.setData(null);
  }

  async refresh(): Promise<void> {
    const { data, meta } = await this.runAction<TData, any>('get', {
      method: 'get',
      ...this.getRefreshRequestOptions(),
    });
    this.setData(data).setMeta(meta);
  }
}
