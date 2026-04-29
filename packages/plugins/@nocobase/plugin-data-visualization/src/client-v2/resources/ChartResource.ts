/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseRecordResource } from '@nocobase/flow-engine';

type ChartQuery = {
  uid?: string;
  dataSource: string;
  collection: string;
  dimension?: string;
  measure: string;
  aggregation?: string;
  limit?: number;
};

export class ChartResource<TData = any> extends BaseRecordResource<TData[]> {
  protected resourceName = 'charts';
  private trackingResourceName = 'charts';

  protected request = {
    method: 'post',
    params: {} as Record<string, any>,
    data: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  };

  setResourceName(resourceName: string) {
    this.trackingResourceName = resourceName;
    return this;
  }

  getResourceName() {
    return this.trackingResourceName;
  }

  setQueryParams(query?: ChartQuery) {
    const filter = this.request.data?.filter;
    if (!query?.dataSource || !query.collection || !query.measure) {
      this.request.data = filter ? { filter } : {};
      return this;
    }

    const measureAlias = query.measure;
    const dimensions = query.dimension
      ? [
          {
            field: [query.dimension],
            alias: query.dimension,
          },
        ]
      : [];

    this.request.data = {
      uid: query.uid,
      mode: 'builder',
      dataSource: query.dataSource,
      collection: query.collection,
      measures: [
        {
          field: [query.measure],
          aggregation: query.aggregation,
          alias: measureAlias,
        },
      ],
      dimensions,
      filter,
      limit: query.limit || 200,
    };
    return this;
  }

  setFilter(filter: Record<string, any>) {
    if (filter === undefined || filter === null) {
      delete this.request.data.filter;
      return this;
    }
    this.request.data = {
      ...this.request.data,
      filter,
    };
    return this;
  }

  async run() {
    if (!this.request.data?.dataSource || !this.request.data?.collection || !this.request.data?.measures?.length) {
      return { data: this.getData() || [], meta: this.getMeta?.() };
    }
    return await this.runAction<TData[], any>('queryData', { data: this.request.data });
  }

  async refresh() {
    try {
      this.clearError();
      this.loading = true;
      this.emit('loading');
      const { data, meta } = await this.run();
      this.setData(data || []).setMeta(meta);
      this.emit('refresh');
    } catch (error) {
      this.setError(error);
      this.emit('refresh');
      throw error;
    } finally {
      this.loading = false;
      this.emit('loading');
    }
  }
}
