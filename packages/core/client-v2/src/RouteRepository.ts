/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '@nocobase/sdk';
import type { NocoBaseDesktopRoute } from './flow-compat';
import { ADMIN_LAYOUT_MODEL_UID } from './flow/admin-shell/admin-layout/constants';

type RouteSubscriber = () => void;
type RouteCreateValues = Partial<NocoBaseDesktopRoute>;
type RouteUpdateValues = Partial<NocoBaseDesktopRoute>;
type RouteLayoutLike = {
  uid?: unknown;
};

type RouteMutationOptions = {
  refreshAfterMutation?: boolean;
};

type AccessibleRouteCache = {
  accessibleLoaded: boolean;
  routes: NocoBaseDesktopRoute[];
};

type MoveRouteOptions = {
  sourceId: string | number;
  targetId?: string | number;
  targetScope?: any;
  sortField?: string;
  sticky?: boolean;
  method?: 'insertBefore' | 'insertAfter' | 'prepend';
  refreshAfterMove?: boolean;
};

export class RouteRepository {
  routes: NocoBaseDesktopRoute[] = [];
  protected subscribers = new Map<RouteSubscriber, string>();
  protected accessibleLoadingPromises = new Map<string, Promise<NocoBaseDesktopRoute[]>>();
  private layoutActivations: Array<{ token: symbol; uid: string }> = [];
  private routeCaches = new Map<string, AccessibleRouteCache>();
  private refreshRequestIds = new Map<string, number>();
  private notifiedLayoutUid: string | undefined;

  constructor(protected ctx: { api?: APIClient }) {}

  activateLayout(layout?: RouteLayoutLike) {
    const uid = this.normalizeLayoutUid(layout?.uid);
    const token = Symbol('route-layout');

    this.layoutActivations.push({
      token,
      uid,
    });
    this.syncRoutesProperty();

    return () => {
      const index = this.layoutActivations.findIndex((item) => item.token === token);
      if (index >= 0) {
        this.layoutActivations.splice(index, 1);
      }
      this.syncRoutesProperty();
    };
  }

  /**
   * 同步当前可访问桌面路由，并通知订阅方刷新。
   *
   * @param routes 最新的桌面路由树
   */
  setRoutes(routes: NocoBaseDesktopRoute[], layoutUid = this.getCurrentLayoutUid()) {
    const cache = this.getRouteCache(layoutUid);
    cache.routes = routes;
    cache.accessibleLoaded = true;
    if (layoutUid === this.getCurrentLayoutUid()) {
      this.routes = routes;
    }
    this.emitChange(layoutUid);
  }

  /**
   * 读取当前缓存的桌面路由树。
   *
   * @returns 当前缓存的路由数组
   */
  listAccessible() {
    const routes = this.getRouteCache(this.getReadableLayoutUid()).routes;
    this.routes = routes;
    return routes;
  }

  /**
   * 判断当前可访问桌面路由是否已完成至少一次初始化加载。
   *
   * @returns {boolean} 是否已初始化完成
   */
  isAccessibleLoaded() {
    return this.getRouteCache().accessibleLoaded;
  }

  /**
   * 重新拉取当前用户可访问的桌面路由，并覆盖本地缓存。
   *
   * @returns 最新的路由数组
   */
  async refreshAccessible() {
    const layoutUid = this.getCurrentLayoutUid();
    return this.refreshAccessibleByLayout(layoutUid);
  }

  private async refreshAccessibleByLayout(layoutUid: string) {
    const requestId = this.nextRefreshRequestId(layoutUid);
    const response = await this.getAPIClient().request({
      url: '/desktopRoutes:listAccessible',
      params: { tree: true, sort: 'sort', layout: layoutUid },
    });
    const routes = response?.data?.data || [];
    if (requestId === this.getRefreshRequestId(layoutUid)) {
      this.setRoutes(routes, layoutUid);
    }
    return routes;
  }

  /**
   * 确保当前用户可访问的桌面路由至少完成一次初始化加载。
   *
   * @returns 当前可访问的路由数组
   */
  async ensureAccessibleLoaded() {
    const layoutUid = this.getCurrentLayoutUid();
    const cache = this.getRouteCache(layoutUid);
    if (cache.accessibleLoaded) {
      this.routes = cache.routes;
      return cache.routes;
    }

    const existingLoadingPromise = this.accessibleLoadingPromises.get(layoutUid);
    if (existingLoadingPromise) {
      return existingLoadingPromise;
    }

    const loadingPromise = this.refreshAccessibleByLayout(layoutUid).finally(() => {
      if (this.accessibleLoadingPromises.get(layoutUid) === loadingPromise) {
        this.accessibleLoadingPromises.delete(layoutUid);
      }
    });
    this.accessibleLoadingPromises.set(layoutUid, loadingPromise);

    return loadingPromise;
  }

  /**
   * 订阅路由缓存变化，用于驱动 React 上下文刷新。
   *
   * @param subscriber 缓存变化后的回调
   * @returns 取消订阅函数
   */
  subscribe(subscriber: RouteSubscriber) {
    this.subscribers.set(subscriber, this.getCurrentLayoutUid());
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * 取消订阅路由缓存变化。
   *
   * @param subscriber 之前注册的回调函数
   */
  unsubscribe(subscriber: RouteSubscriber) {
    this.subscribers.delete(subscriber);
  }

  /**
   * 创建一个桌面路由节点。
   *
   * @param values 路由数据
   * @param options 资源与刷新选项
   * @returns 服务端响应
   */
  async createRoute(values: RouteCreateValues, options: RouteMutationOptions = {}) {
    const { refreshAfterMutation = true } = options;
    const res = await this.getResource('desktopRoutes').create({
      values,
      layout: this.getCurrentLayoutUid(),
    });
    if (refreshAfterMutation) {
      await this.refreshAccessible();
    }
    return res;
  }

  /**
   * 更新一个或一组桌面路由节点。
   *
   * @param filterByTk 单条记录主键，或批量记录主键数组
   * @param values 待更新的路由字段
   * @param options 资源与刷新选项
   * @returns 服务端响应
   */
  async updateRoute(filterByTk: any, values: RouteUpdateValues, options: RouteMutationOptions = {}) {
    const { refreshAfterMutation = true } = options;
    const res = await this.getResource('desktopRoutes').update(
      Array.isArray(filterByTk)
        ? {
            filter: {
              id: {
                $in: filterByTk,
              },
            },
            values,
          }
        : {
            filterByTk,
            values,
          },
    );
    if (refreshAfterMutation) {
      await this.refreshAccessible();
    }
    return res;
  }

  /**
   * 删除一个桌面路由节点。
   *
   * @param filterByTk 要删除的记录主键
   * @param options 资源与刷新选项
   * @returns 服务端响应
   */
  async deleteRoute(filterByTk: any, options: RouteMutationOptions = {}) {
    const { refreshAfterMutation = true } = options;
    const res = await this.getResource('desktopRoutes').destroy({
      filterByTk,
    });
    if (refreshAfterMutation) {
      await this.refreshAccessible();
    }
    return res;
  }

  /**
   * 调整桌面路由节点位置。
   *
   * @param options 拖拽或移动所需参数
   * @returns 服务端响应
   */
  async moveRoute(options: MoveRouteOptions) {
    const { refreshAfterMove = true, ...moveOptions } = options;
    const res = await this.getResource('desktopRoutes').move(moveOptions);
    if (refreshAfterMove) {
      await this.refreshAccessible();
    }
    return res;
  }

  /**
   * 通过 schema uid 反查对应路由节点。
   *
   * @param schemaUid 菜单 schema uid
   * @returns 匹配到的路由节点
   */
  getRouteBySchemaUid(schemaUid: string): NocoBaseDesktopRoute | undefined {
    return this.findRoute(this.listAccessible(), schemaUid);
  }

  protected getAPIClient(): APIClient {
    if (!this.ctx?.api) {
      throw new Error('[NocoBase] RouteRepository requires context.api.');
    }
    return this.ctx.api;
  }

  protected getResource(collectionName: string) {
    return this.getAPIClient().resource(collectionName);
  }

  protected emitChange(layoutUid = this.getCurrentLayoutUid()) {
    this.subscribers.forEach((subscriberLayoutUid, subscriber) => {
      if (subscriberLayoutUid !== layoutUid) {
        return;
      }
      const previousNotifiedLayoutUid = this.notifiedLayoutUid;
      this.notifiedLayoutUid = layoutUid;
      try {
        subscriber();
      } finally {
        this.notifiedLayoutUid = previousNotifiedLayoutUid;
      }
    });
  }

  private getCurrentLayoutUid() {
    return this.layoutActivations[this.layoutActivations.length - 1]?.uid || ADMIN_LAYOUT_MODEL_UID;
  }

  private normalizeLayoutUid(uid: unknown) {
    return typeof uid === 'string' && uid.trim() ? uid : ADMIN_LAYOUT_MODEL_UID;
  }

  private getReadableLayoutUid() {
    return this.notifiedLayoutUid || this.getCurrentLayoutUid();
  }

  private getRouteCache(layoutUid = this.getCurrentLayoutUid()) {
    let cache = this.routeCaches.get(layoutUid);
    if (!cache) {
      cache = {
        accessibleLoaded: false,
        routes: [],
      };
      this.routeCaches.set(layoutUid, cache);
    }
    return cache;
  }

  private syncRoutesProperty() {
    this.routes = this.getRouteCache().routes;
  }

  private nextRefreshRequestId(layoutUid: string) {
    const requestId = this.getRefreshRequestId(layoutUid) + 1;
    this.refreshRequestIds.set(layoutUid, requestId);
    return requestId;
  }

  private getRefreshRequestId(layoutUid: string) {
    return this.refreshRequestIds.get(layoutUid) || 0;
  }

  private findRoute(routes: NocoBaseDesktopRoute[], schemaUid: string): NocoBaseDesktopRoute | undefined {
    for (const route of routes) {
      if (route.schemaUid === schemaUid) {
        return route;
      }
      if (route.children) {
        const found = this.findRoute(route.children, schemaUid);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }
}
