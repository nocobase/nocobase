/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type SystemSettingsAPIClient = {
  request: (options: { url: string }) => Promise<{ data: any }>;
};

/**
 * 系统设置共享数据源。
 *
 * 该对象是系统设置在运行时的唯一状态源，负责请求去重、
 * 结果缓存以及订阅通知。
 */
export class SystemSettingsSource {
  loading = false;
  data: any;
  error: any;

  private pending?: Promise<any>;
  private listeners = new Set<() => void>();

  constructor(private readonly apiClient: SystemSettingsAPIClient) {}

  /**
   * 订阅系统设置变化。
   *
   * @param listener 变化监听器
   * @returns 取消订阅函数
   * @example
   * ```typescript
   * const unsubscribe = source.subscribe(() => {
   *   console.log(source.data);
   * });
   * unsubscribe();
   * ```
   */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 加载系统设置。
   *
   * 已有缓存数据时直接返回缓存；并发请求时复用同一个 Promise。
   *
   * @returns 最新的系统设置数据
   * @throws 当接口请求失败时抛出原始异常
   * @example
   * ```typescript
   * const data = await source.load();
   * ```
   */
  async load() {
    if (this.data && !this.error) {
      return this.data;
    }

    if (this.pending) {
      return this.pending;
    }

    this.loading = true;
    this.notify();

    this.pending = this.apiClient
      .request({
        url: 'systemSettings:get',
      })
      .then((response) => {
        this.data = response.data;
        this.error = undefined;
        return this.data;
      })
      .catch((error) => {
        this.error = error;
        throw error;
      })
      .finally(() => {
        this.loading = false;
        this.pending = undefined;
        this.notify();
      });

    return this.pending;
  }

  /**
   * 强制刷新系统设置。
   *
   * @returns 最新的系统设置数据
   * @throws 当接口请求失败时抛出原始异常
   * @example
   * ```typescript
   * await source.refresh();
   * ```
   */
  async refresh() {
    this.pending = undefined;
    this.data = undefined;
    return this.load();
  }

  /**
   * 直接覆盖本地系统设置数据。
   *
   * @param data 新的数据对象
   * @returns void
   * @example
   * ```typescript
   * source.setData({ data: { title: 'Demo' } });
   * ```
   */
  setData(data: any) {
    this.data = data;
    this.error = undefined;
    this.loading = false;
    this.notify();
  }

  /**
   * 直接覆盖本地错误状态。
   *
   * @param error 新的错误对象
   * @returns void
   * @example
   * ```typescript
   * source.setError(new Error('request failed'));
   * ```
   */
  setError(error: any) {
    this.error = error;
    this.loading = false;
    this.notify();
  }

  /**
   * 广播状态变化。
   *
   * @returns void
   */
  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
