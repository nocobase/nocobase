/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIResource } from './apiResource';

export abstract class BaseRecordResource<TData = any> extends APIResource<TData> {
  protected resourceName: string | null = null;
  protected sourceId: string | number | null = null;

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    url: null as string | null,
    params: {
      filter: {} as Record<string, any>,
      filterByTk: null as string | number | string[] | number[] | null,
      appends: null as string[] | null,
      fields: null as string[] | null,
      sort: null as string[] | null,
      except: null as string[] | null,
      whitelist: null as string[] | null,
      blacklist: null as string[] | null,
    } as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  protected buildURL(action?: string): string {
    let url = '';
    if (this.resourceName) {
      if (this.sourceId && this.resourceName.includes('.')) {
        // 处理关联资源，如 users.tags 或 users.profile
        const [parentResource, childResource] = this.resourceName.split('.');
        url = `${parentResource}/${this.sourceId}/${childResource}:${action || 'get'}`;
      } else {
        url = `${this.resourceName}:${action || 'get'}`;
      }
    }

    return url;
  }

  async runAction<TData = any, TMeta = any>(action: string, options: any) {
    const { data } = await this.api.request({
      url: this.buildURL(action),
      method: 'post',
      ...options,
    });
    if (!data?.data) {
      return data;
    }
    return { data: data.data, meta: data.meta } as {
      data: TData;
      meta?: TMeta;
    };
  }

  setResourceName(resourceName: string): void {
    this.resourceName = resourceName;
  }

  getResourceName(): string {
    return this.resourceName;
  }

  setSourceId(sourceId: string | number): void {
    this.sourceId = sourceId;
  }

  getSourceId(): string | number {
    return this.sourceId;
  }

  setDataSourceKey(dataSourceKey: string): void {
    this.request.headers = { ...this.request.headers, 'X-Data-Source': dataSourceKey };
  }

  getDataSourceKey(): string {
    return this.request.headers['X-Data-Source'];
  }

  setFilter(filter: Record<string, any>): void {
    this.request.params = { ...this.request.params, ...filter };
  }

  getFilter(): Record<string, any> {
    return this.request.params.filter;
  }

  setAppends(appends: string[]): void {
    this.request.params = { ...this.request.params, appends };
  }

  getAppends(): string[] {
    return this.request.params.appends;
  }

  addAppends(append: string) {
    this.request.params.appends.push(append);
  }
  removeAppends(append: string) {
    this.request.params.appends = this.request.params.appends.filter((item: string) => item !== append);
  }

  setFilterByTk(filterByTk: string | number | string[] | number[]): void {
    this.request.params.filterByTk = filterByTk;
  }

  getFilterByTk(): string | number | string[] | number[] {
    return this.request.params.filterByTk;
  }

  setFields(fields: string[] | string): void {
    if (typeof fields === 'string') {
      fields = fields.split(',');
    }
    this.request.params.fields = fields;
  }
  getFields(): string[] {
    return this.request.params.fields;
  }

  setSort(sort: string | string[]): void {
    if (typeof sort === 'string') {
      sort = sort.split(',');
    }
    this.request.params.sort = sort;
  }
  getSort(): string[] {
    return this.request.params.sort;
  }

  setExcept(except: string | string[]): void {
    if (typeof except === 'string') {
      except = except.split(',');
    }
    this.request.params.except = except;
  }
  getExcept(): string[] {
    return this.request.params.except;
  }

  setWhitelist(whitelist: string | string[]): void {
    if (typeof whitelist === 'string') {
      whitelist = whitelist.split(',');
    }
    this.request.params.whitelist = whitelist;
  }
  getWhitelist(): string[] {
    return this.request.params.whitelist;
  }

  setBlacklist(blacklist: string | string[]): void {
    this.request.params.blacklist = blacklist;
  }
  getBlacklist(): string[] {
    return this.request.params.blacklist;
  }

  abstract refresh(): Promise<void>;
}
