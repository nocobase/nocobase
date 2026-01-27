/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { BaseRecordResource } from './baseRecordResource';

export class MultiRecordResource<TDataItem = any> extends BaseRecordResource<TDataItem[]> {
  protected _data = observable.ref<TDataItem[]>([]);
  protected _meta = observable.ref<Record<string, any>>({});
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshWaiters: Array<{ resolve: () => void; reject: (error: any) => void }> = [];
  protected createActionOptions = {};
  protected updateActionOptions = {};
  protected _refreshActionName = 'list';

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

  get supportsFilter() {
    return true;
  }

  setCreateActionOptions(options: AxiosRequestConfig) {
    this.createActionOptions = options;
    return this;
  }

  setUpdateActionOptions(options: AxiosRequestConfig) {
    this.updateActionOptions = options;
    return this;
  }

  setSelectedRows(selectedRows: TDataItem[]) {
    this.setMeta({ selectedRows });
    return this;
  }

  getSelectedRows(): TDataItem[] {
    return this.getMeta('selectedRows') || [];
  }

  getCount(): number {
    return this.getMeta('count');
  }
  setPage(page: number) {
    this.addRequestParameter('page', page);
    return this.setMeta({ page });
  }

  getPage(): number {
    return this.getMeta('page');
  }

  setPageSize(pageSize: number) {
    this.addRequestParameter('pageSize', pageSize);
    return this.setMeta({ pageSize });
  }

  getPageSize(): number {
    return this.getMeta('pageSize');
  }

  getTotalPage(): number {
    return this.getMeta('totalPage');
  }
  getCell(rowIndex: number, columnKey: string): TDataItem | undefined {
    const data = this.getData();
    return data?.[rowIndex]?.[columnKey];
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

  async create(data: TDataItem, options?: AxiosRequestConfig & { refresh?: boolean }): Promise<void> {
    const config = this.mergeRequestConfig({ data }, this.createActionOptions, options);
    const res = await this.runAction('create', config);
    this.markDataSourceDirty();
    this.emit('saved', data);
    if (options?.refresh !== false) {
      await this.refresh();
    }
    return res;
  }

  async get(filterByTk: any): Promise<TDataItem | undefined> {
    const options = {
      params: {
        filterByTk,
      },
    };
    const { data } = await this.runAction<TDataItem, any>('get', {
      ...options,
    });
    return data;
  }

  async update(filterByTk: string | number, data: Partial<TDataItem>, options?: AxiosRequestConfig): Promise<void> {
    const result = data;
    const config = this.mergeRequestConfig(
      {
        params: {
          filterByTk,
        },
        data: result,
      },
      this.updateActionOptions,
      options,
    );
    await this.runAction('update', config);
    this.markDataSourceDirty();
    this.emit('saved', data);
    await this.refresh();
  }

  async destroySelectedRows(): Promise<void> {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      throw new Error('No rows selected for deletion.');
    }
    await this.destroy(selectedRows);
  }

  async destroy(
    filterByTk: string | number | string[] | number[] | TDataItem | TDataItem[] | object,
    options?: AxiosRequestConfig,
  ): Promise<void> {
    const config = this.mergeRequestConfig(
      {
        params: {
          filterByTk: this.jsonStringify(filterByTk),
        },
      },
      options,
    );
    await this.runAction('destroy', config);
    this.markDataSourceDirty();
    const currentPage = this.getPage();
    const lastPage = Math.ceil((this.getCount() - _.castArray(filterByTk).length) / this.getPageSize());
    if (currentPage > lastPage) {
      this.setPage(lastPage || 1);
    }
    await this.refresh();
  }

  setItem(index: number, newDataItem: TDataItem) {
    const oldData = this.getData();
    const newData = oldData.slice(); // 浅拷贝
    newData[index] = { ...newDataItem };
    this.setData(newData);
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
      this.refreshWaiters.push({ resolve, reject });
      this.refreshTimer = setTimeout(async () => {
        const waiters = this.refreshWaiters;
        this.refreshWaiters = [];
        this.refreshTimer = null;
        try {
          this.clearError();
          this.loading = true;
          const { data, meta } = await this.runAction<TDataItem[], any>(this._refreshActionName, {
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
          this.emit('refresh');
          waiters.forEach((w) => w.resolve());
        } catch (error) {
          this.setError(error);
          const err = error instanceof Error ? error : new Error(String(error));
          waiters.forEach((w) => w.reject(err));
        } finally {
          this.loading = false;
        }
      });
    });
  }
}
