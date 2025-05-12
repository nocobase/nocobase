import { observable, action, define } from '@formily/reactive';

export abstract class ObjectResource<TData = any> {
  public data: TData | null;

  constructor(initialData: TData | null = null) {
    define(this, {
      data: observable.ref,
      setData: action,
      load: action,
      reload: action,
    });
    this.data = initialData;
  }

  setData(data: TData | null) {
    this.data = data;
  }

  abstract load(): Promise<TData | null>;

  async reload(): Promise<TData | null> {
    return this.load();
  }
} 