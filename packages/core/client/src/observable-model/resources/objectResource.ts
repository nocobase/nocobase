import { observable, action, define } from '@formily/reactive';

export class ObjectResource<TData = any> {
  public data: TData | null;
  public resourceApi?: any;

  constructor(initialData: TData | null = null, resourceApi?: any) {
    this.data = initialData;
    this.resourceApi = resourceApi;
    define(this, {
      data: observable,
      setData: action,
    });
  }

  setData(data: TData | null) {
    this.data = data;
  }

  async load(): Promise<TData | null> {
    if (this.resourceApi) {
      try {
        const result = await this.resourceApi.get();
        if (result.success) {
          this.setData(result.data);
          return result.data;
        }
      } catch (e) {
        console.error('resourceApi 加载数据失败', e);
      }
    }
    return this.data;
  }

  async reload(): Promise<TData | null> {
    return this.load();
  }
} 