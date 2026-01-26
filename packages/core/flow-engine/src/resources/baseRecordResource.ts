/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { APIResource } from './apiResource';
import { FilterItem } from './filterItem';
import { ResourceError } from './flowResource';
import { DATA_SOURCE_DIRTY_EVENT } from '../views/viewEvents';

export abstract class BaseRecordResource<TData = any> extends APIResource<TData> {
  protected resourceName: string;
  protected sourceId: string | number | null = null;

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    // url: null as string | null,
    method: 'get' as string,
    params: {
      // filter: {} as Record<string, any>,
      // filterByTk: null as string | number | string[] | number[] | null,
      // appends: null as string[] | null,
      // fields: null as string[] | null,
      // sort: null as string[] | null,
      // except: null as string[] | null,
      // whitelist: null as string[] | null,
      // blacklist: null as string[] | null,
    } as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  protected updateAssociationValues: string[] = [];
  protected runActionOptions = {};

  protected filterGroups = new Map<string, any>();

  protected _refreshActionName = 'list';

  get supportsFilter() {
    return true;
  }

  setRefreshAction(refreshActionName: string) {
    this._refreshActionName = refreshActionName;
  }

  mergeRequestConfig(...args: AxiosRequestConfig[]): AxiosRequestConfig {
    const base = {} as AxiosRequestConfig;

    // 限制到 2 层
    const customizer = (objValue: any, srcValue: any, key: string, object: any, source: any, stack: any) => {
      const depth = stack.size; // lodash 内部 stack 能告诉你当前深度
      if (Array.isArray(srcValue)) {
        // 数组覆盖
        return srcValue;
      }
      if (depth > 1) {
        // 超过 2 层就直接替换
        return srcValue;
      }
    };

    return args.reduce((acc, cur) => _.mergeWith(acc, cur, customizer), base);
  }

  setRunActionOptions(action: string, options: AxiosRequestConfig) {
    this.runActionOptions[action] = options;
    return this;
  }

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
    const { rawResponse, ...rest } = options;
    const config = this.mergeRequestConfig(
      _.omit(this.request, ['params', 'data', 'method']),
      {
        method: 'post',
        url: this.buildURL(action),
      },
      this.runActionOptions?.[action],
      rest,
    );
    if (['create', 'update', 'firstOrCreate', 'updateOrCreate'].includes(action)) {
      config.params = config.params || {};
      config.params.updateAssociationValues = this.getUpdateAssociationValues();
    }
    try {
      const response = await this.api.request(config);
      if (rawResponse) {
        return response;
      }
      const { data } = response;
      if (!data?.data) {
        return data;
      }
      return { data: data.data, meta: data.meta } as {
        data: TData;
        meta?: TMeta;
      };
    } catch (err) {
      throw new ResourceError(err);
    }
  }

  setResourceName(resourceName: string) {
    this.resourceName = resourceName;
    return this;
  }

  getResourceName(): string {
    return this.resourceName;
  }

  /**
   * Mark current resource as dirty on the root FlowEngine.
   * Used to coordinate "refresh on active" across view stacks.
   */
  protected markDataSourceDirty(resourceName?: string) {
    const engine = this.context.engine;
    if (!engine) return;

    const dataSourceKey = this.getDataSourceKey() || 'main';
    const resName = resourceName || this.getResourceName();
    if (!resName) return;

    const affectedResourceNames = new Set<string>([String(resName)]);
    // Optional safety: association resources like "users.profile" may impact parent collection views.
    if (typeof resName === 'string' && resName.includes('.')) {
      affectedResourceNames.add(resName.split('.')[0]);
    }

    for (const name of affectedResourceNames) {
      engine.markDataSourceDirty(dataSourceKey, name);
    }

    // Signal current view to re-evaluate dirty blocks (e.g., same-view sibling refresh).
    // This is emitted on the *current* engine emitter (view-scoped) so it won't affect other views.
    engine.emitter?.emit?.(DATA_SOURCE_DIRTY_EVENT, {
      dataSourceKey,
      resourceNames: Array.from(affectedResourceNames),
    });
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
    return this.addRequestParameter('filter', JSON.stringify(filter));
  }

  getFilter(): Record<string, any> {
    const value = [...this.filterGroups.values()].filter(Boolean);

    if (value.length === 0) {
      return;
    }

    return {
      $and: value,
    };
  }

  resetFilter() {
    this.setFilter(this.getFilter());
  }

  addFilterGroup(key: string, filter: FilterItem | Record<string, any>) {
    if (filter instanceof FilterItem) {
      filter = filter.toJSON();
    }
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

  getUpdateAssociationValues(): string[] {
    return this.updateAssociationValues || [];
  }

  addUpdateAssociationValues(updateAssociationValues: string | string[]) {
    const currentUpdateAssociationValues = this.getUpdateAssociationValues();
    const newUpdateAssociationValues = this.splitValue(updateAssociationValues);
    newUpdateAssociationValues.forEach((append) => {
      if (!currentUpdateAssociationValues.includes(append)) {
        currentUpdateAssociationValues.push(append);
      }
    });
    this.updateAssociationValues = currentUpdateAssociationValues;
    return this;
  }

  jsonStringify(value: any): string {
    if (value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  }

  setFilterByTk(filterByTk: any) {
    return this.addRequestParameter('filterByTk', this.jsonStringify(filterByTk));
  }

  getFilterByTk(): any {
    return this.request.params.filterByTk;
  }

  setFields(fields: string[] | string) {
    return this.addRequestParameter('fields', this.splitValue(fields));
  }

  getFields(): string[] {
    return this.request.params.fields || [];
  }

  setSort(sort: string | string[]) {
    return this.addRequestParameter('sort', this.splitValue(sort));
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
