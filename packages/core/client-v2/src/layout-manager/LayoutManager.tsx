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
import { LayoutPageRoute } from './LayoutPageRoute';
import { LayoutRoute } from './LayoutRoute';
import type { LayoutDefinition, LayoutRegisterOptions } from './types';

const DEFAULT_ROOT_PAGE_MODEL_CLASS = 'RootPageModel';
const DEFAULT_CHILD_PAGE_MODEL_CLASS = 'ChildPageModel';

const assertNonEmptyString = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`[NocoBase] layoutManager.registerLayout() requires '${fieldName}' to be a non-empty string.`);
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

export function normalizeLayoutPathPrefix(pathPrefix: string) {
  const normalized = `/${pathPrefix.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  if (normalized === '/') {
    throw new Error(`[NocoBase] layoutManager.registerLayout() does not support root pathPrefix '/'.`);
  }
  return {
    pathPrefix: normalized,
    normalizedPathPrefix: normalized.replace(/^\/+/, ''),
  };
}

function normalizeLayoutDefinition(options: LayoutRegisterOptions): LayoutDefinition {
  assertNonEmptyString(options.name, 'name');
  assertNonEmptyString(options.pathPrefix, 'pathPrefix');
  assertNonEmptyString(options.uid, 'uid');
  assertNonEmptyString(options.layoutModelClass, 'layoutModelClass');
  assertOptionalNonEmptyString(options.rootPageModelClass, 'rootPageModelClass');
  assertOptionalNonEmptyString(options.childPageModelClass, 'childPageModelClass');
  assertOptionalBoolean(options.authCheck, 'authCheck');

  if (options.name.includes('.')) {
    throw new Error(`[NocoBase] layoutManager.registerLayout() does not allow '.' in layout name '${options.name}'.`);
  }

  const { pathPrefix, normalizedPathPrefix } = normalizeLayoutPathPrefix(options.pathPrefix);

  return {
    name: options.name,
    pathPrefix,
    normalizedPathPrefix,
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
  private readonly pathPrefixIndex = new Map<string, string>();
  private readonly uidIndex = new Map<string, string>();

  constructor(app: TApp) {
    this.app = app;
  }

  registerLayout(options: LayoutRegisterOptions) {
    const layout = normalizeLayoutDefinition(options);

    if (this.layouts.has(layout.name)) {
      throw new Error(`[NocoBase] Layout '${layout.name}' has already been registered.`);
    }

    const existingName = this.pathPrefixIndex.get(layout.pathPrefix);
    if (existingName) {
      throw new Error(
        `[NocoBase] Layout pathPrefix '${layout.pathPrefix}' has already been registered by '${existingName}'.`,
      );
    }

    const existingUidName = this.uidIndex.get(layout.uid);
    if (existingUidName) {
      throw new Error(`[NocoBase] Layout uid '${layout.uid}' has already been registered by '${existingUidName}'.`);
    }

    this.layouts.set(layout.name, layout);
    this.pathPrefixIndex.set(layout.pathPrefix, layout.name);
    this.uidIndex.set(layout.uid, layout.name);
    this.addStandardRoutes(layout);

    return layout;
  }

  getLayout(name: string) {
    const layout = this.layouts.get(name);
    if (!layout) {
      throw new Error(`[NocoBase] Layout '${name}' is not registered.`);
    }
    return layout;
  }

  hasLayout(name: string) {
    return this.layouts.has(name);
  }

  listLayouts() {
    return Array.from(this.layouts.values());
  }

  private addStandardRoutes(layout: LayoutDefinition) {
    const routeBaseName = layout.name;
    const authCheck = layout.authCheck;

    this.app.router.add(routeBaseName, {
      path: layout.pathPrefix,
      authCheck,
      element: <LayoutRoute layoutName={layout.name} />,
    });

    this.app.router.add(`${routeBaseName}.page`, {
      path: `${layout.pathPrefix}/:name`,
      authCheck,
      element: <LayoutPageRoute layoutName={layout.name} />,
    });

    this.app.router.add(`${routeBaseName}.page.tab`, {
      path: `${layout.pathPrefix}/:name/tab/:tabUid`,
      authCheck,
      element: <LayoutPageRoute layoutName={layout.name} />,
    });

    this.app.router.add(`${routeBaseName}.page.view`, {
      path: `${layout.pathPrefix}/:name/view/*`,
      authCheck,
      element: <LayoutPageRoute layoutName={layout.name} />,
    });

    this.app.router.add(`${routeBaseName}.page.tab.view`, {
      path: `${layout.pathPrefix}/:name/tab/:tabUid/view/*`,
      authCheck,
      element: <LayoutPageRoute layoutName={layout.name} />,
    });
  }
}
