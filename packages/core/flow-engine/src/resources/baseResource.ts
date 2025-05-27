/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable, action, define } from '@formily/reactive';

export class BaseResource<TData = any> {
  public data: TData | null;

  constructor(initialData: TData | null = null) {
    this.data = initialData;
    define(this, {
      data: observable,
      setData: action,
    });
  }

  setData(data: TData | null) {
    this.data = data;
  }

  getData(): TData | null {
    return this.data;
  }
}
