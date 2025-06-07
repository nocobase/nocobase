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
import { APIClient } from '@nocobase/sdk';
import { SingleRecordResourceMeta } from '../types';

export class SingleRecordResource<TData = any> extends APIResource<TData> {
  meta = observable.shallow({
    filter: {} as Record<string, any>,
    filterByTk: null as string | number | null,
    appends: [] as string[],
    data: {} as TData,
    meta: {} as Record<string, any>,
    error: null as Record<string, any> | null,
    dataSourceKey: null as string | null,
    resourceName: null as string | null,
    sourceId: null as string | number | null,
    actionName: 'get' as string,
  });

  constructor(api?: APIClient, meta?: SingleRecordResourceMeta) {
    super(api);
    if (meta) {
      Object.assign(this.meta, meta);
    }
  }

  getRequestOptions(action?: string): any {
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

    return options;
  }

  private buildURL(action?: string): string {
    let url = '';
    if (this.meta.resourceName) {
      if (this.meta.sourceId && this.meta.resourceName.includes('.')) {
        // 处理关联资源，如 users.profile
        const [parentResource, childResource] = this.meta.resourceName.split('.');
        url = `${parentResource}/${this.meta.sourceId}/${childResource}:${action || this.meta.actionName}`;
      } else {
        url = `${this.meta.resourceName}:${action || this.meta.actionName}`;
      }
    }

    return url;
  }

  async save(data: TData): Promise<void> {
    const requestOptions = this.getRequestOptions('update');
    try {
      await this.api.request({ ...requestOptions, data });
      this.setData(data);
    } catch (e) {
      console.error(e);
      this.meta.error = e;
    }
  }

  async destroy(): Promise<void> {
    const options = this.getRequestOptions('destroy');
    try {
      await this.api.request(options);
      this.setData(null);
    } catch (e) {
      console.error(e);
      this.meta.error = e;
    }
  }
}
