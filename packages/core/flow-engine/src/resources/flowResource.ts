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
  // 资源元信息
  protected meta = observable.shallow({});

  // 数据状态 - 包含数据和动态信息
  protected state = observable.shallow({
    data: {} as TData,
  });

  get data(): TData {
    return this.state.data;
  }

  set data(value: TData) {
    this.state.data = value;
  }

  getData(): TData {
    return this.state.data;
  }

  setData(data: TData): void {
    this.state.data = data;
  }
}
