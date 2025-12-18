/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseRecordResource } from '@nocobase/flow-engine';
import { parseField, removeUnparsableFilter, isEmptyFilterObject } from '../../utils';
import { debugLog } from '../utils';
import { transformFilter } from '@nocobase/utils/client';
import { validateQuery } from '../models/QueryBuilder.service';

export class ChartResource<TData = any> extends BaseRecordResource<TData> {
  resourceName = 'charts';

  private refreshTimer: NodeJS.Timeout | null = null;

  protected request = {
    url: 'charts:query',
    method: 'post',
    params: {} as Record<string, any>,
    data: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  // 整体数据查询参数，内部 QueryBuilder 调用
  setQueryParams(query: Record<string, any>, mark?: string) {
    const { success, message } = validateQuery(query);
    if (!success) {
      // 这里过程性校验 不强制报错，只做提示
      console.warn(message);
      return this;
    }
    const parsed = this.parseQuery(query);
    const { filter, ...rest } = parsed;

    // 写入除 filter 以外的字段到请求体
    this.request.data = {
      ...this.request.data,
      ...rest,
    };

    // filter 通过统一处理后设置到请求体
    if (isEmptyFilterObject(filter)) {
      this.removeFilterGroup('__qbFilter__');
    } else {
      this.addFilterGroup('__qbFilter__', filter);
    }

    return this;
  }

  // 筛选条件写入请求参数，父类 addFilterGroup/removeFilterGroup --> resetFilter --> setFilter
  setFilter(filter: Record<string, any>) {
    // 入参为 undefined 或 null 时，直接清空已设置的筛选条件并返回
    if (filter === undefined || filter === null) {
      delete this.request.data.filter;
      return this;
    }

    const cleanedRoot = removeUnparsableFilter(filter);
    let merged = cleanedRoot;
    if (
      cleanedRoot &&
      typeof cleanedRoot === 'object' &&
      !Array.isArray(cleanedRoot) &&
      Array.isArray((cleanedRoot as any).$and)
    ) {
      const andItems = (cleanedRoot as any).$and
        .map((item: any) => removeUnparsableFilter(item))
        .filter(Boolean)
        .flatMap((item: any) => (item && Array.isArray(item.$and) ? item.$and : [item]));

      merged = andItems.length === 0 ? null : andItems.length === 1 ? andItems[0] : { $and: andItems };
    }

    if (isEmptyFilterObject(merged)) {
      delete this.request.data.filter;
    } else {
      this.request.data.filter = merged;
    }
    return this;
  }

  // 解析 queryBuider 表单值为请求参数
  parseQuery(query: Record<string, any>) {
    const [dataSource, collection] = query.collectionPath || [];
    const data = {
      mode: query.mode, // 模式：builder | sql
      sql: query.sql, // 仅当 mode === 'sql' 时有效
      dataSource, // 数据源
      collection, // db 表名
      // 度量 yAxis
      measures: (query.measures || []).map((item: any) => {
        const measure = { ...item };
        if (item.aggregation && !item.alias) {
          const { alias } = parseField(item.field);
          measure.alias = alias;
        }
        return measure;
      }),
      // 维度 xAxis
      dimensions: (query.dimensions || []).map((item: any) => {
        const dimension = { ...item };
        if (item.format && !item.alias) {
          const { alias } = parseField(item.field);
          dimension.alias = alias;
        }
        return dimension;
      }),
      // 过滤条件
      filter: query.filter ? removeUnparsableFilter(transformFilter(query.filter)) : undefined,
      orders: query.orders,
      limit: query.limit,
      offset: query.offset,
    };
    return data;
  }

  // 查询数据
  async run() {
    const data = this.request.data || {};
    // 尝试从已有字段推断模式；但若无法推断则直接跳过，避免切换时抛错
    const mode: 'sql' | 'builder' | undefined = data.mode ?? (data.sql ? 'sql' : undefined);

    if (!mode) {
      // 未配置模式时，认为尚未完成查询参数设置：不抛错、不请求 API，返回现有数据
      return { data: this.getData(), meta: this.getMeta?.() };
    }

    if (mode === 'sql') {
      if (!data.sql) {
        throw new Error('sql is required');
      }
    } else {
      // builder 模式
      if (!data.collection || !data.measures?.length) {
        throw new Error('collection and measures are required');
      }
    }

    // 请求数据 api.post('charts:query')
    return await this.runAction<TData, any>('query', this.getRefreshRequestOptions());
  }

  // debounce 刷新数据
  async refresh() {
    debugLog('---ChartResource refresh', this.request.data);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    return new Promise<void>((resolve, reject) => {
      this.refreshTimer = setTimeout(async () => {
        try {
          this.clearError();
          this.loading = true;
          this.emit('loading');
          const res = await this.run();
          const { data, meta } = res;
          this.setData(data).setMeta(meta);
          this.loading = false;
          this.emit('refresh');
          resolve();
        } catch (error) {
          this.setError(error);
          reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          this.refreshTimer = null;
          this.loading = false;
        }
      });
    });
  }
}
