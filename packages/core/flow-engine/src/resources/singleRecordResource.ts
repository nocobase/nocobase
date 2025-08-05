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
  isNewRecord = false;

  get supportsFilter() {
    return !this.isNewRecord;
  }

  setFilterByTk(filterByTk: any) {
    this.isNewRecord = false;
    return super.setFilterByTk(filterByTk);
  }

  async save(data: TData, config: { refresh?: boolean } = {}): Promise<void> {
    const options: any = {
      headers: this.request.headers,
      params: {},
    };
    let actionName = 'create';
    // 如果有 filterByTk，则表示是更新操作
    if (!this.isNewRecord) {
      options.params.filterByTk = this.getFilterByTk();
      actionName = 'update';
      options.params.updateAssociationValues = this.getUpdateAssociationValues();
    }
    await this.runAction(actionName, {
      ...options,
      data,
    });
    if (config.refresh !== false) {
      await this.refresh();
    }
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
    this.clearError();
    // 如果没有设置 filterByTk，则不执行刷新操作
    // 这是为了避免在没有指定记录的情况下进行不必要的 API 调用
    if (this.isNewRecord) {
      return;
    }
    try {
      const { data, meta } = await this.runAction<TData, any>('get', {
        method: 'get',
        ...this.getRefreshRequestOptions(),
      });
      this.setData(data).setMeta(meta);
      this.emit('refresh');
    } catch (error) {
      this.setError(error);
      throw error;
    }
  }
}
