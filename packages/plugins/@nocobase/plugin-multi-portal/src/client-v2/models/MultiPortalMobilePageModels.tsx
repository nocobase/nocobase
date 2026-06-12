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
import {
  MobileChildPageModel,
  MobileRootPageModel,
} from '../../../../plugin-ui-layout/src/client-v2/models/MobilePageModels';

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

  return typeof portalUid === 'string' && portalUid.trim() ? portalUid : undefined;
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
