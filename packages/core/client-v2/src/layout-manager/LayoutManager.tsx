/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { BaseApplication } from '../BaseApplication';
import { LayoutContentRoute } from './LayoutContentRoute';
import { LayoutRoute } from './LayoutRoute';
import type { LayoutDefinition, LayoutRegisterOptions } from './types';
import {
  getLayoutPageRouteName,
  getLayoutPageTabRouteName,
  getLayoutPageTabViewRouteName,
  getLayoutPageViewRouteName,
} from './utils';

const DEFAULT_ROOT_PAGE_MODEL_CLASS = 'RootPageModel';
const DEFAULT_CHILD_PAGE_MODEL_CLASS = 'ChildPageModel';

const assertNonEmptyString = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`[NocoBase] layoutManager.registerLayout() requires '${fieldName}' to be a non-empty string.`);
  }
};

const assertString = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string') {
    throw new Error(`[NocoBase] layoutManager.registerLayout() requires '${fieldName}' to be a string.`);
  }
};

const assertOptionalNonEmptyString = (value: unknown, fieldName: string) => {
  if (value !== undefined) {
    assertNonEmptyString(value, fieldName);
  }
};

const assertOptionalBoolean = (value: unknown, fieldName: string) => {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new Error(`[NocoBase] layoutManager.registerLayout() requires '${fieldName}' to be a boolean.`);
  }
};

function assertValidRouteName(routeName: string) {
  if (routeName.includes('..') || routeName.startsWith('.') || routeName.endsWith('.')) {
    throw new Error(`[NocoBase] layoutManager.registerLayout() received invalid routeName '${routeName}'.`);
  }
}

export function normalizeLayoutRoutePath(routeName: string, routePath: string) {
  const trimmed = routePath.trim();
  const isNestedRoute = routeName.includes('.');
  if (isNestedRoute && trimmed.startsWith('/')) {
    throw new Error(`[NocoBase] nested layout routePath '${routePath}' must be relative.`);
  }

  const normalized = isNestedRoute
    ? trimmed.replace(/^\/+/, '').replace(/\/+$/, '')
    : `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;

  if (!isNestedRoute && (!normalized || normalized === '/')) {
    throw new Error(`[NocoBase] layoutManager.registerLayout() does not support root routePath '/'.`);
  }

  if (normalized.includes('*')) {
    throw new Error(`[NocoBase] layoutManager.registerLayout() does not support wildcard routePath '${routePath}'.`);
  }

  return normalized;
}

function normalizeLayoutDefinition(options: LayoutRegisterOptions): LayoutDefinition {
  assertNonEmptyString(options.routeName, 'routeName');
  assertString(options.routePath, 'routePath');
  assertNonEmptyString(options.uid, 'uid');
  assertNonEmptyString(options.layoutModelClass, 'layoutModelClass');
  assertOptionalNonEmptyString(options.rootPageModelClass, 'rootPageModelClass');
  assertOptionalNonEmptyString(options.childPageModelClass, 'childPageModelClass');
  assertOptionalBoolean(options.authCheck, 'authCheck');
  assertValidRouteName(options.routeName);

  const routePath = normalizeLayoutRoutePath(options.routeName, options.routePath);

  return {
    routeName: options.routeName,
    rootRouteName: options.routeName.split('.')[0],
    routePath,
    uid: options.uid,
    layoutModelClass: options.layoutModelClass,
    rootPageModelClass: options.rootPageModelClass || DEFAULT_ROOT_PAGE_MODEL_CLASS,
    childPageModelClass: options.childPageModelClass || DEFAULT_CHILD_PAGE_MODEL_CLASS,
    authCheck: options.authCheck ?? true,
  };
}

export class LayoutManager<TApp extends BaseApplication<any> = BaseApplication<any>> {
  private readonly app: TApp;
  private readonly layouts = new Map<string, LayoutDefinition>();
  private readonly uidIndex = new Map<string, string>();

  constructor(app: TApp) {
    this.app = app;
  }

  registerLayout(options: LayoutRegisterOptions) {
    const layout = normalizeLayoutDefinition(options);

    if (this.layouts.has(layout.routeName)) {
      throw new Error(`[NocoBase] Layout '${layout.routeName}' has already been registered.`);
    }

    const existingUidName = this.uidIndex.get(layout.uid);
    if (existingUidName) {
      throw new Error(`[NocoBase] Layout uid '${layout.uid}' has already been registered by '${existingUidName}'.`);
    }

    this.layouts.set(layout.routeName, layout);
    this.uidIndex.set(layout.uid, layout.routeName);
    this.addStandardRoutes(layout);

    return layout;
  }

  getLayout(routeName: string) {
    const layout = this.layouts.get(routeName);
    if (!layout) {
      throw new Error(`[NocoBase] Layout '${routeName}' is not registered.`);
    }
    return layout;
  }

  hasLayout(routeName: string) {
    return this.layouts.has(routeName);
  }

  listLayouts() {
    return Array.from(this.layouts.values());
  }

  private addStandardRoutes(layout: LayoutDefinition) {
    const routeBaseName = layout.routeName;
    const authCheck = layout.authCheck;
    const skipAuthCheck = authCheck === false;

    this.app.router.add(routeBaseName, {
      path: layout.routePath,
      authCheck,
      skipAuthCheck,
      element: <LayoutRoute layoutRouteName={layout.routeName} />,
    });

    this.app.router.add(getLayoutPageRouteName(routeBaseName), {
      path: ':name/*',
      authCheck,
      skipAuthCheck,
      element: <LayoutContentRoute layoutRouteName={layout.routeName} />,
    });

    this.app.router.add(getLayoutPageTabRouteName(routeBaseName), {
      path: ':name/tab/:tabUid',
      authCheck,
      skipAuthCheck,
      element: <LayoutContentRoute layoutRouteName={layout.routeName} />,
    });

    this.app.router.add(getLayoutPageViewRouteName(routeBaseName), {
      path: ':name/view/*',
      authCheck,
      skipAuthCheck,
      element: <LayoutContentRoute layoutRouteName={layout.routeName} />,
    });

    this.app.router.add(getLayoutPageTabViewRouteName(routeBaseName), {
      path: ':name/tab/:tabUid/view/*',
      authCheck,
      skipAuthCheck,
      element: <LayoutContentRoute layoutRouteName={layout.routeName} />,
    });
  }
}
