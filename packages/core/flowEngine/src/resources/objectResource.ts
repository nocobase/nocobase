/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseResource } from './baseResource';

export class ObjectResource<TData = any> extends BaseResource<TData> {
  public resourceApi?: any;

  constructor(initialData: TData | null = null, resourceApi?: any) {
    super(initialData);
    this.resourceApi = resourceApi;
  }

  async load(): Promise<TData | null> {
    if (this.resourceApi) {
      try {
        const result = await this.resourceApi.get();
        if (result.success) {
          this.setData(result.data);
          return result.data;
        }
      } catch (e) {
        console.error('resourceApi 加载数据失败', e);
      }
    }
    return this.data;
  }

  async reload(): Promise<TData | null> {
    return this.load();
  }

  async save(data: TData): Promise<TData | null> {
    if (this.resourceApi) {
      const result = await this.resourceApi.save(data);
      if (result.success) {
        this.setData(result.data);
        return result.data;
      }
    }
  }
}
