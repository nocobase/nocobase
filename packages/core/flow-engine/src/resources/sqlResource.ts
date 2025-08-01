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
import { BaseRecordResource } from './baseRecordResource';

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
    return `flowSql:${action || 'run'}`;
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

  setSQL(sql: string) {
    this.request.data.sql = sql;
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
          this.loading = true;
          const { data, meta } = await this.runAction<TData, any>('run', {
            method: 'post',
            ...this.getRefreshRequestOptions(),
          });
          this.setData(data).setMeta(meta);
          this.emit('refresh');
          this.loading = false;
          resolve();
        } catch (error) {
          this.loading = false;
          reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          this.refreshTimer = null;
        }
      });
    });
  }
}
