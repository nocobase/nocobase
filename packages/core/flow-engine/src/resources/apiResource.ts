/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '@nocobase/sdk';
import { FlowResource } from './flowResource';

export class APIResource<TData = any> extends FlowResource<TData> {
  // 请求配置
  protected request: any = {
    // url: null as string | null,
    headers: {} as Record<string, any>,

    // 仅用于 Refresh
    params: {} as Record<string, any>,
    method: 'get' as string,
    data: null as any,
  };

  protected api: APIClient;

  setAPIClient(api: APIClient) {
    this.api = api;
    return this;
  }

  getURL(): string {
    return this.request.url;
  }

  setURL(value: string) {
    this.request.url = value;
    return this;
  }

  get loading() {
    return this.getMeta('loading') || false;
  }

  set loading(value: boolean) {
    this.setMeta({ loading: value });
  }

  setRequestMethod(method: string) {
    this.request.method = method;
    return this;
  }

  addRequestHeader(key: string, value: string) {
    if (!this.request.headers) {
      this.request.headers = {};
    }
    this.request.headers[key] = value;
    return this;
  }

  addRequestParameter(key: string, value: any) {
    if (!this.request.params) {
      this.request.params = {};
    }
    this.request.params[key] = value;
    return this;
  }

  setRequestBody(data: any) {
    this.request.data = data;
    return this;
  }

  setRequestOptions(key: string, value: any) {
    this.request[key] = value;
    return this;
  }

  async refresh() {
    if (!this.api) {
      throw new Error('API client not set');
    }
    const { data } = await this.api.request({
      url: this.getURL(),
      ...this.getRefreshRequestOptions(),
    });
    this.setData(data);
  }

  protected getRefreshRequestOptions() {
    const options = {
      ...this.request,
    };
    return options;
  }
}
