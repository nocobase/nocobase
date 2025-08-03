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

function toErrMessages(error) {
  if (typeof error?.response?.data === 'string') {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = error?.response?.data;
    let message = tempElement.textContent || tempElement.innerText;
    if (message.includes('Error occurred while trying')) {
      message = 'The application may be starting up. Please try again later.';
      return [{ code: 'APP_WARNING', message }];
    }
    if (message.includes('502 Bad Gateway')) {
      message = 'The application may be starting up. Please try again later.';
      return [{ code: 'APP_WARNING', message }];
    }
    return [{ message }];
  }
  if (error?.response?.data?.error) {
    return [error?.response?.data?.error];
  }
  return (
    error?.response?.data?.errors ||
    error?.response?.data?.messages ||
    error?.response?.error || [{ message: error.message || 'Server error' }]
  );
}

export class ResourceError extends Error {
  data: { message: string; code?: string };

  constructor(error) {
    const data = toErrMessages(error).shift();
    super(data.message);
    this.name = 'ResponseError';
  }

  get code() {
    return this.data?.code || 'UNKNOWN_ERROR';
  }

  get message() {
    return this.data?.message || 'An unknown error occurred';
  }
}

export class FlowResource<TData = any> {
  protected _data = observable.ref<TData>(null);
  protected _meta = observable.ref<Record<string, any>>({});
  protected _error = observable.ref<ResourceError>(null);

  getData(): TData {
    return this._data.value;
  }

  hasData(): boolean {
    const data = this.getData();
    if (Array.isArray(data)) {
      return data.length > 0;
    } else if (data && typeof data === 'object') {
      return Object.keys(data).length > 0;
    }
    return false;
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

  getError(): ResourceError | null {
    return this._error.value;
  }

  setError(error: ResourceError | null): this {
    this._error.value = error;
    return this;
  }

  clearError(): this {
    this._error.value = null;
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
