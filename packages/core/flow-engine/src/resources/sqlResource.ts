/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import _ from 'lodash';
import { FlowEngineContext } from '../flowContext';
import { BaseRecordResource } from './baseRecordResource';

type SQLRunOptions = {
  bind?: Record<string, any> | Array<any>;
  type?: 'selectVar' | 'selectRow' | 'selectRows';
  dataSourceKey?: string;
  filter?: Record<string, any>;
};

type SQLSaveOptions = {
  uid: string;
  sql: string;
  dataSourceKey?: string;
};

export class FlowSQLRepository {
  constructor(protected ctx: FlowEngineContext) {}

  async run(sql: string, options: SQLRunOptions = {}) {
    const { data } = await this.ctx.api.request({
      method: 'POST',
      url: 'flowSql:run',
      data: {
        sql,
        ...options,
      },
    });
    return data?.data;
  }

  async save(data: SQLSaveOptions) {
    await this.ctx.api.request({
      method: 'POST',
      url: 'flowSql:save',
      data: {
        ...data,
      },
    });
  }

  async runById(uid: string, options?: SQLRunOptions) {
    const { data } = await this.ctx.api.request({
      method: 'POST',
      url: 'flowSql:runById',
      data: {
        uid,
        ...options,
      },
    });
    return data?.data;
  }

  async destroy(uid: string) {
    await this.ctx.api.request({
      url: 'flowSql:destroy',
      params: {
        filterByTk: uid,
      },
    });
  }
}

export class SQLResource<TData = any> extends BaseRecordResource<TData> {
  protected _data = observable.ref<TData>(null);
  protected _meta = observable.ref<Record<string, any>>({});
  private refreshTimer: NodeJS.Timeout | null = null;

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    // url: null as string | null,
    method: 'post' as string,
    params: {} as Record<string, any>,
    data: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  get supportsFilter() {
    return true;
  }

  protected buildURL(action?: string): string {
    return `flowSql:${action || 'runById'}`;
  }

  setDataSourceKey(dataSourceKey: string): this {
    this.request.data.dataSourceKey = dataSourceKey;
    return this;
  }

  setSQLType(type: 'selectRows' | 'selectRow' | 'selectVar') {
    this.request.data.type = type;
    return this;
  }

  setFilterByTk(filterByTk: any) {
    this.request.data.uid = filterByTk;
    return this;
  }

  setFilter(filter: Record<string, any>) {
    this.request.data.filter = filter;
    return this;
  }

  setBind(bind: Record<string, any> | Array<any>) {
    this.request.data.bind = bind;
    return this;
  }

  /**
   * 在同一个事件循环内多次调用 refresh 方法时，只有最后一次调用会生效。避免触发多次相同的接口请求。
   * @returns
   */
  async refresh(): Promise<void> {
    // 清除之前的定时器，确保只有最后一次调用生效
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // 设置新的定时器，在下一个事件循环执行
    return new Promise<void>((resolve, reject) => {
      this.refreshTimer = setTimeout(async () => {
        try {
          this.clearError();
          this.loading = true;
          const { data, meta } = await this.runAction<TData, any>('runById', {
            method: 'post',
            ...this.getRefreshRequestOptions(),
          });
          this.setData(data).setMeta(meta);
          this.emit('refresh');
          this.loading = false;
          resolve();
        } catch (error) {
          this.setError(error);
          reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          this.refreshTimer = null;
          this.loading = false;
        }
      });
    });
  }
}
