/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { APIResource } from './apiResource';

export class MultiRecordResource<TDataItem = any> extends APIResource<TDataItem[]> {
  meta = observable.shallow({
    filter: {} as Record<string, any>,
    filterByTk: null as string | number | string[] | number[] | null,
    page: 1,
    pageSize: 20,
    appends: [] as string[],
    data: [] as TDataItem[],
    meta: {} as Record<string, any>,
    error: {} as Record<string, any>,
    dataSourceKey: null as string | null,
    resourceName: null as string | null,
    sourceId: null as string | number | null,
    actionName: 'list' as string,
  });

  getRequestOptions(action?: string, params?: Record<string, any>): any {
    const options: any = {
      url: this.buildURL(action),
      params: {},
    };

    if (this.meta.filterByTk !== null) {
      options.params.filterByTk = this.meta.filterByTk;
    }

    if (Object.keys(this.meta.filter).length > 0) {
      options.params.filter = this.meta.filter;
    }

    if (this.meta.appends.length > 0) {
      options.params.appends = this.meta.appends;
    }

    options.params.page = this.meta.page;
    options.params.pageSize = this.meta.pageSize;
    options.params = {
      ...options.params,
      ...params,
    };

    return options;
  }

  private buildURL(action: string): string {
    let url = '';
    if (this.meta.resourceName) {
      if (this.meta.sourceId && this.meta.resourceName.includes('.')) {
        // 处理关联资源，如 users.tags
        const [parentResource, childResource] = this.meta.resourceName.split('.');
        url = `${parentResource}/${this.meta.sourceId}/${childResource}:${action || this.meta.actionName}`;
      } else {
        url = `${this.meta.resourceName}:${action || this.meta.actionName}`;
      }
    }

    return url;
  }

  async refresh(): Promise<void> {
    if (!this.api) {
      throw new Error('API client not set');
    }
    const response = await this.api.request(this.getRequestOptions());
    
    if (Array.isArray(response.data)) {
      this.setData(response.data);
    } else if (response.data && Array.isArray(response.data.items)) {
      this.setData(response.data.items);
      if (response.data.meta) {
        this.meta.meta = response.data.meta;
      }
    }
  }

  async next(): Promise<void> {
    this.meta.page += 1;
    await this.refresh();
  }

  async previous(): Promise<void> {
    if (this.meta.page > 1) {
      this.meta.page -= 1;
      await this.refresh();
    }
  }

  async goto(page: number): Promise<void> {
    if (page > 0) {
      this.meta.page = page;
      await this.refresh();
    }
  }

  async create(data: TDataItem): Promise<void> {
    if (!this.api) {
      throw new Error('API client not set');
    }

    try {
      await this.api.request({...this.getRequestOptions('create'), data});
      await this.refresh();
    } catch (e) {
      this.meta.error = e;
    }
  }

  async update(filterByTk: string | number, data: Partial<TDataItem>): Promise<void> {
    if (!this.api) {
      throw new Error('API client not set');
    }
    
    const options = {
      ...this.getRequestOptions('update', { filterByTk }),
      data,
    };
    try {
      await this.api.request(options);
      await this.refresh();
      this.meta.error = null;
    } catch (e) {
      this.meta.error = e;
    }
  }

  async destroy(filterByTk: string | number): Promise<void> {
    if (!this.api) {
      throw new Error('API client not set');
    }
    const options = this.getRequestOptions('destroy', { filterByTk });
    try {
      await this.api.request(options);
      await this.refresh();
      this.meta.error = null;
    } catch (e) {
      this.meta.error = e;
    }
  }
}
