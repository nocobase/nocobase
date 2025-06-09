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

  get data(): TData {
    return this._data.value;
  }

  set data(value: TData) {
    this._data.value = value;
  }

  getData(): TData {
    return this.data;
  }

  setData(data: TData): void {
    this.data = data;
  }
}
