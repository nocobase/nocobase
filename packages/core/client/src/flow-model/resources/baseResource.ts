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