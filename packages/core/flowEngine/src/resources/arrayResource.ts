/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable, action, define } from '@formily/reactive';
import { ObjectResource } from './objectResource';

export interface IPagination {
  page: number;
  pageSize: number;
  total?: number;
}

export interface ISort {
  field: string;
  direction: 'asc' | 'desc';
}

export class ArrayResource<TDataItem = any> extends ObjectResource<TDataItem[]> {
  public pagination: IPagination;
  public sort: ISort[];
  public filter: Record<string, any>;

  constructor(
    initialData: TDataItem[] = [],
    initialPagination: IPagination = { page: 1, pageSize: 10 },
    initialSort: ISort[] = [],
    initialFilter: Record<string, any> = {},
    resourceApi?: any,
  ) {
    super(initialData, resourceApi);

    this.pagination = initialPagination;
    this.sort = initialSort;
    this.filter = initialFilter;

    define(this, {
      pagination: observable.deep,
      sort: observable.deep,
      filter: observable.deep,
      setPagination: action,
      setSort: action,
      setFilter: action,
      previous: action,
      next: action,
      goto: action,
      sortBy: action,
    });
  }

  setPagination(page?: number | Partial<IPagination>, pageSize?: number) {
    if (typeof page === 'number') {
      this.pagination.page = page;
      if (pageSize !== undefined) {
        this.pagination.pageSize = pageSize;
      }
    } else if (typeof page === 'object') {
      Object.assign(this.pagination, page);
    }
  }

  setPageSize(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.page = 1;
  }

  setSort(sort: ISort[] | ISort) {
    if (Array.isArray(sort)) {
      this.sort = sort;
    } else {
      this.sort = [sort];
    }
  }

  setFilter(filter: Record<string, any>) {
    this.filter = filter;
    // TODO: 这里是否需要重置分页到第一页？
    // this.pagination.page = 1;
  }

  async load(): Promise<TDataItem[] | null> {
    if (this.resourceApi) {
      try {
        const result = await this.resourceApi.get({
          filter: this.filter,
          sort: this.sort,
          pagination: this.pagination,
        });
        if (result.success) {
          this.setData(result.items);
          this.pagination.total = result.total;
          return result.items;
        }
      } catch (e) {
        console.error('resourceApi 加载数据失败', e);
      }
    }
    return this.data;
  }

  async reload(): Promise<TDataItem[] | null> {
    return this.load();
  }

  async previous(): Promise<TDataItem[] | null> {
    if (this.pagination.page > 1) {
      this.pagination.page -= 1;
      return this.load();
    }
    return this.data; // 如果已经是第一页，返回当前数据
  }

  async next(): Promise<TDataItem[] | null> {
    const totalPages = this.pagination.total
      ? Math.ceil(this.pagination.total / this.pagination.pageSize)
      : Number.MAX_SAFE_INTEGER; // 如果不知道总数，假设还有更多页

    if (this.pagination.page < totalPages) {
      this.pagination.page += 1;
      return this.load();
    }
    return this.data; // 如果已经是最后一页，返回当前数据
  }

  async goto(page: number): Promise<TDataItem[] | null> {
    if (page > 0) {
      this.pagination.page = page;
      return this.load();
    }
    return this.data;
  }

  async sortBy(field: string, direction: 'asc' | 'desc'): Promise<TDataItem[] | null> {
    this.setSort({ field, direction });
    return this.load();
  }

  getCurrentPage(): number {
    return this.pagination.page;
  }

  getPageSize(): number {
    return this.pagination.pageSize;
  }

  getTotalItems(): number | undefined {
    return this.pagination.total;
  }

  getTotalPages(): number | undefined {
    if (this.pagination.total !== undefined) {
      return Math.ceil(this.pagination.total / this.pagination.pageSize);
    }
    return undefined;
  }

  hasPreviousPage(): boolean {
    return this.pagination.page > 1;
  }

  hasNextPage(): boolean {
    if (this.pagination.total !== undefined) {
      const totalPages = Math.ceil(this.pagination.total / this.pagination.pageSize);
      return this.pagination.page < totalPages;
    }
    return this.data !== null && this.data.length >= this.pagination.pageSize;
  }
}
