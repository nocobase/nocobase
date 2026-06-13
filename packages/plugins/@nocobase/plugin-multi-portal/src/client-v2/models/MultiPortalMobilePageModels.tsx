/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ChildPageModel, RootPageModel } from '@nocobase/client-v2';
import type { CreateModelOptions } from '@nocobase/flow-engine';
import { MobileChildPageModel, MobileLayoutModel, MobileRootPageModel } from '@nocobase/plugin-ui-layout/client-v2';
import { getMultiPortalRouteScopeCacheKey, getMultiPortalUidFromRouteScopeCacheKey } from '../routeRepositoryScope';

type RouteWithOwnership = Record<string, unknown> & {
  multiPortals?: unknown;
  uiLayouts?: unknown;
};

function isRouteWithOwnership(route: unknown): route is RouteWithOwnership {
  return !!route && typeof route === 'object' && !Array.isArray(route);
}

function getCurrentPortalUid(model: RootPageModel | ChildPageModel) {
  const layout = model.context?.layout as { uid?: unknown } | undefined;
  const portalUid = layout?.uid;

  if (typeof portalUid !== 'string' || !portalUid.trim()) {
    return undefined;
  }

  return getMultiPortalUidFromRouteScopeCacheKey(portalUid) || portalUid;
}

function withCurrentPortalRoute(route: unknown, portalUid?: string) {
  if (!isRouteWithOwnership(route)) {
    return route;
  }

  const { uiLayouts: _uiLayouts, multiPortals: _multiPortals, ...routeValues } = route;

  if (!portalUid) {
    return routeValues;
  }

  return {
    ...routeValues,
    multiPortals: [portalUid],
  };
}

function withCurrentPortalTabOptions(model: RootPageModel | ChildPageModel, options: CreateModelOptions) {
  const route = options.props?.route;

  return {
    ...options,
    props: {
      ...options.props,
      route: withCurrentPortalRoute(route, getCurrentPortalUid(model)),
    },
  };
}

export class MultiPortalMobileLayoutModel extends MobileLayoutModel {
  get layout() {
    const layout = super.layout;

    return {
      ...layout,
      uid: getMultiPortalRouteScopeCacheKey(layout.uid),
    };
  }
}

export class MultiPortalMobileRootPageModel extends MobileRootPageModel {
  constructor(options: ConstructorParameters<typeof MobileRootPageModel>[0]) {
    super(options);

    const createUiLayoutPageTabModelOptions = this.createPageTabModelOptions.bind(this);
    this.createPageTabModelOptions = () => {
      return withCurrentPortalTabOptions(this, createUiLayoutPageTabModelOptions());
    };
  }
}

export class MultiPortalMobileChildPageModel extends MobileChildPageModel {
  constructor(options: ConstructorParameters<typeof MobileChildPageModel>[0]) {
    super(options);

    const createUiLayoutPageTabModelOptions = this.createPageTabModelOptions.bind(this);
    this.createPageTabModelOptions = () => {
      return withCurrentPortalTabOptions(this, createUiLayoutPageTabModelOptions());
    };
  }
}
