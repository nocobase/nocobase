/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { APIResource } from './apiResource';

export abstract class BaseRecordResource<TData = any> extends APIResource<TData> {
  protected resourceName: string;
  protected sourceId: string | number | null = null;

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    // url: null as string | null,
    method: 'get' as string,
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

  protected filterGroups = new Map<string, any>();

  protected splitValue(value: string | string[]): string[] {
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return Array.isArray(value) ? value : [];
  }

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
      method: 'post',
      headers: {
        ...this.request.headers,
        ...options.headers,
      },
      ..._.omit(this.request, ['method', 'params', 'data']),
      url: this.buildURL(action),
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

  setResourceName(resourceName: string) {
    this.resourceName = resourceName;
    return this;
  }

  getResourceName(): string {
    return this.resourceName;
  }

  setSourceId(sourceId: string | number) {
    this.sourceId = sourceId;
    return this;
  }

  getSourceId(): string | number {
    return this.sourceId;
  }

  setDataSourceKey(dataSourceKey: string) {
    return this.addRequestHeader('X-Data-Source', dataSourceKey);
  }

  getDataSourceKey(): string {
    return this.request.headers['X-Data-Source'];
  }

  setFilter(filter: Record<string, any>) {
    return this.addRequestParameter('filter', filter);
  }

  getFilter(): Record<string, any> {
    return {
      $and: [...this.filterGroups.values()].filter(Boolean),
    };
  }

  resetFilter() {
    this.setFilter(this.getFilter());
  }

  addFilterGroup(key: string, filter) {
    this.filterGroups.set(key, filter);
    this.resetFilter();
  }

  removeFilterGroup(key: string) {
    this.filterGroups.delete(key);
    this.resetFilter();
  }

  setAppends(appends: string[]) {
    return this.addRequestParameter('appends', appends);
  }

  getAppends(): string[] {
    return this.request.params.appends || [];
  }

  addAppends(appends: string | string[]) {
    const currentAppends = this.getAppends();
    const newAppends = this.splitValue(appends);
    newAppends.forEach((append) => {
      if (!currentAppends.includes(append)) {
        currentAppends.push(append);
      }
    });
    this.request.params.appends = currentAppends;
    return this;
  }

  removeAppends(appends: string | string[]) {
    if (!this.request.params.appends) {
      return this;
    }
    const currentAppends = this.getAppends();
    const removeAppends = this.splitValue(appends);
    this.request.params.appends = currentAppends.filter((append: string) => !removeAppends.includes(append));
    return this;
  }

  setFilterByTk(filterByTk: string | number | string[] | number[]) {
    return this.addRequestParameter('filterByTk', filterByTk);
  }

  getFilterByTk(): string | number | string[] | number[] {
    return this.request.params.filterByTk;
  }

  setFields(fields: string[] | string) {
    return this.addRequestParameter('fields', this.splitValue(fields));
  }

  getFields(): string[] {
    return this.request.params.fields || [];
  }

  setSort(sort: string | string[]) {
    return this.addRequestParameter('fields', this.splitValue(sort));
  }

  getSort(): string[] {
    return this.request.params.sort || [];
  }

  setExcept(except: string | string[]) {
    return this.addRequestParameter('except', this.splitValue(except));
  }

  getExcept(): string[] {
    return this.request.params.except || [];
  }

  setWhitelist(whitelist: string | string[]) {
    return this.addRequestParameter('whitelist', this.splitValue(whitelist));
  }

  getWhitelist(): string[] {
    return this.request.params.whitelist || [];
  }

  setBlacklist(blacklist: string | string[]) {
    return this.addRequestParameter('blacklist', this.splitValue(blacklist));
  }

  getBlacklist(): string[] {
    return this.request.params.blacklist || [];
  }

  abstract refresh(): Promise<void>;
}
