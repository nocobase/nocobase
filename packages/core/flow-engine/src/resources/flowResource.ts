/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';

export class FlowResource<TData = any> {
  protected _data = observable.ref<TData>(null);
  protected _meta = observable.ref<Record<string, any>>({});

  getData(): TData {
    return this._data.value;
  }

  setData(value: TData) {
    this._data.value = value;
    return this;
  }

  getMeta(metaKey?: string) {
    return metaKey ? this._meta.value[metaKey] : this._meta.value;
  }

  setMeta(meta: Record<string, any>) {
    this._meta.value = { ...this._meta.value, ...meta };
    return this;
  }
}
