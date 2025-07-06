/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';

interface TDataItem {
  id: string | number;
  [key: string]: any;
}
type TDataItemWithKey = TDataItem & { _rowKey: string };

export class FlowResource<TData = any> {
  protected _data = observable.ref<TData>(null);
  protected _meta = observable.ref<Record<string, any>>({});

  getData(): TData {
    return this._data.value;
  }

  getListDataWithRowKey(): TDataItemWithKey[] {
    const data = this.getData();
    if (!Array.isArray(data)) return [];
    return data.map((item, index) => ({
      ...item,
      _rowKey: `${item.id}_${index}`,
    }));
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

  private events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, callback: (...args: any[]) => void) {
    (this.events[event] ||= []).push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.events[event] = (this.events[event] || []).filter((fn) => fn !== callback);
  }

  emit(event: string, ...args: any[]) {
    (this.events[event] || []).forEach((fn) => fn(...args));
  }
}
