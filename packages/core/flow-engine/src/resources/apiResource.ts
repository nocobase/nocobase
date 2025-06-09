/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowResource } from './flowResource';
import { APIClient } from '@nocobase/sdk';
import { observable } from '@formily/reactive';

export class APIResource<TData = any> extends FlowResource<TData> {
  // 请求配置
  protected request = observable.shallow({
    url: null as string | null,
    params: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  });
  api: APIClient;

  setAPIClient(api: APIClient): void {
    this.api = api;
  }

  get url(): string | null {
    return this.request.url;
  }

  set url(value: string | null) {
    this.request.url = value;
  }

  getURL(): string | null {
    return this.request.url;
  }

  setURL(value: string | null): void {
    this.request.url = value;
  }

  getRequestOptions(): any {
    return {
      url: this.url,
      params: this.request.params,
      headers: this.request.headers,
    };
  }

  async refresh(): Promise<void> {
    if (!this.api) {
      throw new Error('API client not set');
    }
    const { data } = await this.api.request(this.getRequestOptions());
    this.setData(data?.data);
  }
}
