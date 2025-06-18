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

export class MultiRecordResource<TDataItem = any> extends BaseRecordResource<TDataItem[]> {
  protected _data = observable.ref<TDataItem[]>([]);

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    // url: null as string | null,
    method: 'get' as string,
    params: {
      filter: {} as Record<string, any>,
      filterByTk: null as string | number | string[] | number[] | null,
      appends: [] as string[],
      fields: [] as string[],
      sort: null as string[] | null,
      except: null as string[] | null,
      whitelist: null as string[] | null,
      blacklist: null as string[] | null,
      page: 1 as number,
      pageSize: 20 as number,
    } as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  setSelectedRows(selectedRows: TDataItem[]) {
    this.setMeta({ selectedRows });
    return this;
  }

  getSelectedRows(): TDataItem[] {
    return this.getMeta('selectedRows') || [];
  }

  setPage(page: number) {
    return this.addRequestParameter('page', page);
  }

  getPage(): number {
    return this.request.params.page;
  }

  setPageSize(pageSize: number) {
    return this.addRequestParameter('pageSize', pageSize);
  }

  getPageSize(): number {
    return this.request.params.pageSize;
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
    });
    await this.refresh();
  }

  async destroySelectedRows(): Promise<void> {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      throw new Error('No rows selected for deletion.');
    }
    await this.destroy(selectedRows);
  }

  async destroy(filterByTk: string | number | string[] | number[] | TDataItem | TDataItem[]): Promise<void> {
    const options = {
      params: {
        filterByTk: _.castArray(filterByTk).map((item) => {
          return typeof item === 'object' ? item['id'] : item; // TODO: ID 字段还需要根据实际情况更改
        }),
      },
      headers: this.request.headers,
    };
    await this.runAction('destroy', {
      ...options,
    });
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const { data, meta } = await this.runAction<TDataItem[], any>('list', {
      method: 'get',
      ...this.getRefreshRequestOptions(),
    });
    this.setData(data).setMeta(meta);
    if (meta?.page) {
      this.setPage(meta.page);
    }
    if (meta?.pageSize) {
      this.setPageSize(meta.pageSize);
    }
  }
}
