/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { BaseRecordResource } from './baseRecordResource';

export class MultiRecordResource<TDataItem = any> extends BaseRecordResource<TDataItem[]> {
  protected _data = observable.ref<TDataItem[]>([]);
  protected _meta = observable.ref<Record<string, any>>({});

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
      page: 1 as number,
      pageSize: 20 as number,
    } as Record<string, any>,
    headers: {} as Record<string, any>,
  });

  constructor() {
    super();
  }

  async next(): Promise<void> {
    this.request.params.page += 1;
    await this.refresh();
  }

  async previous(): Promise<void> {
    if (this.request.params.page > 1) {
      this.request.params.page -= 1;
      await this.refresh();
    }
  }

  async goto(page: number): Promise<void> {
    if (page > 0) {
      this.request.params.page = page;
      await this.refresh();
    }
  }

  async create(data: TDataItem): Promise<void> {
    await this.runAction('create', {
      data,
      method: 'post',
    });
    await this.refresh();
  }

  async update(filterByTk: string | number, data: Partial<TDataItem>): Promise<void> {
    const options = {
      params: {
        filterByTk,
      },
      headers: this.request.headers,
    };
    await this.runAction('update', {
      ...options,
      data,
      method: 'post',
    });
    await this.refresh();
  }

  async destroy(filterByTk: string | number | string[] | number[]): Promise<void> {
    const options = {
      params: {
        filterByTk,
      },
      headers: this.request.headers,
      method: 'delete',
    };
    await this.runAction('destroy', {
      ...options,
    });
    await this.refresh();
  }

  getMeta(metaKey?: string) {
    return metaKey ? this._meta.value[metaKey] : this._meta.value;
  }
  setMeta(meta: Record<string, any>): void {
    this._meta.value = { ...this._meta.value, ...meta };
  }

  async setPage(page: number): Promise<void> {
    this.request.params.page = page;
    await this.refresh();
  }
  getPage(): number {
    return this.request.params.page;
  }
  async setPageSize(pageSize: number): Promise<void> {
    this.request.params.pageSize = pageSize;
    await this.refresh();
  }
  getPageSize(): number {
    return this.request.params.pageSize;
  }

  async refresh(): Promise<void> {
    const { data } = await this.runAction<TDataItem[], any>('list', this.getRequestOptions());
    this.setData(data.data);
    this.setMeta(data.meta || {});
  }
}
