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

export abstract class BaseRecordResource<TData = any> extends APIResource<TData> {
  // 资源元信息 - 静态配置信息
  protected meta = observable.shallow({
    resourceName: null as string | null,
    sourceId: null as string | number | null,
    actionName: 'get' as string,
  });

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = observable.shallow({
    url: null as string | null,
    method: 'get' as string,
    params: {
      filter: {} as Record<string, any>,
      filterByTk: null as string | number | string[] | number[] | null,
      appends: [] as string[],
      fields: [] as string[],
      sort: null as string | null,
      except: null as string | null,
      whitelist: null as string | null,
      blacklist: null as string | null,
    } as Record<string, any>,
    headers: {} as Record<string, any>,
  });

  getRequestOptions(filterByTk?: string | number | string[] | number[]) {
    const options = {
      params: { ...this.request.params },
      headers: { ...this.request.headers },
    };
    if (filterByTk) {
      options.params.filterByTk = filterByTk;
    }
    return options;
  }

  protected buildURL(action?: string): string {
    let url = '';
    if (this.meta.resourceName) {
      if (this.meta.sourceId && this.meta.resourceName.includes('.')) {
        // 处理关联资源，如 users.tags 或 users.profile
        const [parentResource, childResource] = this.meta.resourceName.split('.');
        url = `${parentResource}/${this.meta.sourceId}/${childResource}:${action || this.meta.actionName}`;
      } else {
        url = `${this.meta.resourceName}:${action || this.meta.actionName}`;
      }
    }

    return url;
  }

  async runAction<T = any>(action: string, options: any) {
    return await this.api.request({
      url: this.buildURL(action),
      ...options,
    }) as T;
  }

  setResourceName(resourceName: string): void {
    this.meta.resourceName = resourceName;
  }
  
  getResourceName(): string {
    return this.meta.resourceName;
  }

  setActionName(actionName: string): void {
    this.meta.actionName = actionName;
  }

  getActionName(): string {
    return this.meta.actionName;
  }

  setSourceId(sourceId: string | number): void {
    this.meta.sourceId = sourceId;
  }

  getSourceId(): string | number {
    return this.meta.sourceId;
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

  setFilterByTk(filterByTk: string | number | string[] | number[]): void {
    this.request.params.filterByTk = filterByTk;
  }

  getFilterByTk(): string | number | string[] | number[] {
    return this.request.params.filterByTk;
  }

  setFields(fields: string[]): void {
    this.request.params.fields = fields;
  }
  getFields(): string[] {
    return this.request.params.fields;
  }
  setSort(sort: string): void {
    this.request.params.sort = sort;
  }
  getSort(): string {
    return this.request.params.sort;
  }
  
  setExcept(except: string): void {
    this.request.params.except = except;
  }
  getExcept(): string {
    return this.request.params.except;
  }

  setWhitelist(whitelist: string): void {
    this.request.params.whitelist = whitelist;
  }
  getWhitelist(): string {
    return this.request.params.whitelist;
  }

  setBlacklist(blacklist: string): void {
    this.request.params.blacklist = blacklist;
  }
  getBlacklist(): string {
    return this.request.params.blacklist;
  }

  abstract refresh(): Promise<void>;
}
