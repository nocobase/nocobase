/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 文件中的 ChartResource 类
import { BaseRecordResource } from '@nocobase/flow-engine';
import { parseField, removeUnparsableFilter } from '../../utils';

export class ChartResource<TData = any> extends BaseRecordResource<TData> {
  resourceName = 'charts'; // 修复：从 'chart' 改为 'charts'

  private refreshTimer: NodeJS.Timeout | null = null;

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    url: 'charts:query',
    method: 'post',
    params: {} as Record<string, any>,
    data: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  // 整体参数设置
  setQueryParams(query: Record<string, any>) {
    if (!this.validateQuery(query)) {
      return this;
    }
    this.request.data = this.parseQuery(query);
    return this;
  }

  validateQuery(query: Record<string, any>) {
    if (!query) {
      console.warn('validate: query is required');
      return false;
    }
    if (query.mode === 'sql' && !query.sql) {
      console.warn('validate: sql is required when mode is sql');
      return false;
    }
    if (query.mode === 'builder' && (!query.collectionPath?.length || !query.measures?.length)) {
      console.warn('validate: collection and measures are required when mode is builder');
      return false;
    }
    return true;
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
      filter: removeUnparsableFilter(query.filter),
      limit: query.limit,
      offset: query.offset,
    };
    return data;
  }

  // 新增过滤条件组, 支持外部筛选表单联动传入
  addFilterGroup(key: string, filterGroup: Record<string, any>) {
    this.request.data.filter = {
      ...this.request.data.filter,
      ...filterGroup,
    };
    return this;
  }

  setFilter(filter: Record<string, any>) {
    this.request.data.filter = filter;
    return this;
  }

  // 查询数据
  async run() {
    const data = this.request.data || {};
    if (!data.collection || !data.measures?.length) {
      throw new Error('collection and measures are required');
    }
    // 刷新数据 api.post('chart:query')
    return await this.runAction<TData, any>('query', this.getRefreshRequestOptions());
  }

  // debounce 刷新数据
  async refresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    return new Promise<void>((resolve, reject) => {
      this.refreshTimer = setTimeout(async () => {
        try {
          this.clearError();
          this.loading = true;
          const res = await this.run();
          const { data, meta } = res;
          this.setData(data).setMeta(meta);
          this.emit('refresh');
          this.loading = false;
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
