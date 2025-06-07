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

export abstract class APIResource<TData = any> extends FlowResource<TData> {
  api: APIClient;

  constructor(api?: APIClient) {
    super();
    if (api) {
      this.api = api;
    }
  }

  setAPIClient(api: APIClient): void {
    this.api = api;
  }

  // 抽象方法，子类必须实现
  abstract getRequestOptions(action?: string): any;

  async refresh(): Promise<void> {
    if (!this.api) {
      throw new Error('API client not set');
    }
    const { data } = await this.api.request(this.getRequestOptions());
    this.setData(data);
  }
}
