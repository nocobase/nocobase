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
import { FlowContext, FlowEngineContext } from '../flowContext';
import { LogDuration } from '../utils/logDecorators';
import { BaseRecordResource } from './baseRecordResource';

type SQLRunOptions = {
  bind?: Record<string, any>;
  type?: 'selectVar' | 'selectRow' | 'selectRows';
  dataSourceKey?: string;
  filter?: Record<string, any>;
};

type SQLSaveOptions = {
  uid: string;
  sql: string;
  dataSourceKey?: string;
};

function transformSQL(template: string) {
  let index = 1;
  const bind = {};

  const sql = template.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => {
    const key = `__var${index}`;
    bind[key] = `{{${expr.trim()}}}`;
    index++;
    return `$${key}`;
  });

  return { sql, bind };
}

export class FlowSQLRepository {
  protected ctx: FlowEngineContext;

  constructor(ctx: FlowEngineContext) {
    this.ctx = new FlowContext() as FlowEngineContext;
    this.ctx.addDelegate(ctx);
    this.ctx.defineProperty('offset', {
      get: () => 0,
      cache: false,
    });
    this.ctx.defineProperty('limit', {
      get: () => 20,
      cache: false,
    });
  }

  @LogDuration({ type: 'resource.sql', slowMs: 16 })
  async run(sql: string, options: SQLRunOptions = {}) {
    const result = transformSQL(sql);
    const bind = await this.ctx.resolveJsonTemplate(result.bind);
    const { data } = await this.ctx.api.request({
      method: 'POST',
      url: 'flowSql:run',
      data: {
        sql: result.sql,
        ...options,
        bind: {
          ...bind,
          ...options.bind,
        },
      },
    });
    return data?.data;
  }

  async save(data: SQLSaveOptions) {
    await this.ctx.api.request({
      method: 'POST',
      url: 'flowSql:save',
      data: {
        ...data,
      },
    });
  }

  @LogDuration({ type: 'resource.sql', slowMs: 16 })
  async runById(uid: string, options?: SQLRunOptions) {
    const response = await this.ctx.api.request({
      method: 'GET',
      url: 'flowSql:getBind',
      params: {
        uid,
      },
    });
    const bind = await this.ctx.resolveJsonTemplate(response.data.data || {});
    const { data } = await this.ctx.api.request({
      method: 'POST',
      url: 'flowSql:runById',
      data: {
        uid,
        ...options,
        bind: {
          ...bind,
          ...options.bind,
        },
      },
    });
    return data?.data;
  }

  async destroy(uid: string) {
    await this.ctx.api.request({
      url: 'flowSql:destroy',
      params: {
        filterByTk: uid,
      },
    });
  }
}

export class SQLResource<TData = any> extends BaseRecordResource<TData> {
  protected _data = observable.ref<TData>(null);
  protected _meta = observable.ref<Record<string, any>>({});
  private refreshTimer: NodeJS.Timeout | null = null;
  private _debugEnabled = false;
  private _sql: string;

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    // url: null as string | null,
    method: 'post' as string,
    params: {} as Record<string, any>,
    data: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  get refreshActionName() {
    return this._debugEnabled ? 'run' : 'runById';
  }

  get supportsFilter() {
    return true;
  }

  constructor(context: FlowEngineContext) {
    super(context);
    context.defineProperty('limit', {
      get: () => this.getPageSize(),
      cache: false,
    });
    context.defineProperty('offset', {
      get: () => {
        const page = this.getPage();
        const pageSize = this.getPageSize();
        return (page - 1) * pageSize;
      },
      cache: false,
    });
  }

  protected buildURL(action?: string): string {
    return `flowSql:${action || this.refreshActionName}`;
  }

  setPage(page: number) {
    this.addRequestParameter('page', page);
    return this.setMeta({ page });
  }

  getPage(): number {
    return this.getMeta('page') || 1;
  }

  setPageSize(pageSize: number) {
    this.addRequestParameter('pageSize', pageSize);
    return this.setMeta({ pageSize });
  }

  setDebug(enabled: boolean) {
    this._debugEnabled = enabled;
    return this;
  }

  getPageSize(): number {
    return this.getMeta('pageSize') || 20;
  }

  async next(): Promise<void> {
    this.setPage(this.getPage() + 1);
    await this.refresh();
  }

  async previous(): Promise<void> {
    if (this.getPage() > 1) {
      this.setPage(this.getPage() - 1);
      await this.refresh();
    }
  }

  async goto(page: number): Promise<void> {
    if (page > 0) {
      this.request.params.page = page;
      await this.refresh();
    }
  }

  setDataSourceKey(dataSourceKey: string): this {
    this.request.data.dataSourceKey = dataSourceKey;
    return this;
  }

  setSQLType(type: 'selectRows' | 'selectRow' | 'selectVar') {
    this.request.data.type = type;
    return this;
  }

  setSQL(sql: string) {
    this._sql = sql;
    return this;
  }

  setFilterByTk(filterByTk: any) {
    this.request.data.uid = filterByTk;
    return this;
  }

  setFilter(filter: Record<string, any>) {
    this.request.data.filter = filter;
    return this;
  }

  setBind(bind: Record<string, any> | Array<any>) {
    this.request.data.bind = bind;
    return this;
  }

  async run() {
    return this._debugEnabled ? await this.runBySQL() : await this.runById();
  }

  @LogDuration({ type: 'resource.sql', slowMs: 16 })
  async runBySQL() {
    const sql = this._sql;
    const result = transformSQL(sql);
    const bind = await this.context.resolveJsonTemplate(result.bind);
    const options = _.cloneDeep({
      method: 'post',
      ...this.getRefreshRequestOptions(),
    });
    options.data.bind = bind;
    options.data.sql = result.sql;
    return await this.runAction<TData, any>('run', options);
  }

  @LogDuration({ type: 'resource.sql', slowMs: 16 })
  async runById() {
    const { data } = await this.runAction<TData, any>('getBind', {
      method: 'get',
      params: {
        uid: this.request.data.uid,
      },
    });
    const bind = await this.context.resolveJsonTemplate(data);
    this.setBind(bind);
    return await this.runAction<TData, any>('runById', {
      method: 'post',
      ...this.getRefreshRequestOptions(),
    });
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
      this.refreshTimer = setTimeout(async () => {
        try {
          this.clearError();
          this.loading = true;
          const { data, meta } = await this.run();
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
