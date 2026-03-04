/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@formily/reactive';
import { FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { AdminLayoutRouteCoordinator, type RoutePageMeta } from './AdminLayoutRouteCoordinator';

export class AdminLayoutModel extends FlowModel {
  private routeCoordinator?: AdminLayoutRouteCoordinator;
  private routeDisposer?: () => void;
  private activePageUid = '';
  private layoutContentElement: HTMLElement | null = null;
  private routePageMetaMap = new Map<string, RoutePageMeta>();

  private getCoordinator() {
    if (!this.routeCoordinator) {
      this.routeCoordinator = new AdminLayoutRouteCoordinator(this.flowEngine);
    }
    return this.routeCoordinator;
  }

  private getCurrentRouteByActivePage() {
    return this.routePageMetaMap.get(this.activePageUid)?.currentRoute || {};
  }

  registerRoutePage(pageUid: string, meta: RoutePageMeta) {
    this.routePageMetaMap.set(pageUid, {
      ...meta,
      currentRoute: meta.currentRoute || {},
    });
    return this.getCoordinator().registerPage(pageUid, meta);
  }

  updateRoutePage(pageUid: string, meta: Partial<RoutePageMeta>) {
    const prev = this.routePageMetaMap.get(pageUid) || { active: false, currentRoute: {} };
    const next = {
      ...prev,
      ...meta,
      active: typeof meta.active === 'boolean' ? meta.active : prev.active,
      currentRoute: meta.currentRoute ?? prev.currentRoute ?? {},
    };
    this.routePageMetaMap.set(pageUid, next);
    this.getCoordinator().syncPageMeta(pageUid, next);
  }

  unregisterRoutePage(pageUid: string) {
    this.routePageMetaMap.delete(pageUid);
    if (this.activePageUid === pageUid) {
      this.activePageUid = '';
    }
    this.getCoordinator().unregisterPage(pageUid);
  }

  setLayoutContentElement(element: HTMLElement | null) {
    this.layoutContentElement = element;
    this.getCoordinator().setLayoutContentElement(element);
  }

  protected onMount(): void {
    super.onMount();
    if (!this.routeDisposer) {
      this.flowEngine.context.defineProperty('currentRoute', {
        get: () => this.getCurrentRouteByActivePage(),
      });
      this.flowEngine.context.defineProperty('layoutContentElement', {
        get: () => this.layoutContentElement,
      });
      this.routeDisposer = reaction(
        () => this.flowEngine.context.route,
        (route) => {
          this.activePageUid = route?.params?.name || '';
          this.getCoordinator().syncRoute(route || {});
        },
        {
          fireImmediately: true,
        },
      );
    }
  }

  protected onUnmount(): void {
    this.routeDisposer?.();
    this.routeDisposer = undefined;
    this.routeCoordinator?.destroy();
    this.routeCoordinator = undefined;
    this.routePageMetaMap.clear();
    this.activePageUid = '';
    this.layoutContentElement = null;
    super.onUnmount();
  }

  render() {
    return <>{this.props.children}</>;
  }
}
