/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { APIResource } from './apiResource';

export class SimpleAPIResource<TData = any> extends APIResource<TData> {
  meta = observable.shallow({
    url: null as string | null,
    params: {},
    data: {} as TData,
  });

  get url(): string | null {
    return this.meta.url;
  }

  set url(value: string | null) {
    this.meta.url = value;
  }

  getURL(): string | null {
    return this.meta.url;
  }

  setURL(value: string | null): void {
    this.meta.url = value;
  }

  getRequestOptions(): { url: string | null } {
    return {
      url: this.url,
    };
  }
}
