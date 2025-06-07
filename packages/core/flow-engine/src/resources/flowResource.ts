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
  meta = observable.shallow({
    data: {} as TData,
  });

  get data(): TData {
    return this.meta.data;
  }

  set data(value: TData) {
    this.meta.data = value;
  }

  getData(): TData {
    return this.meta.data;
  }

  setData(data: TData): void {
    this.meta.data = data;
  }
}
