/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageTabModel, RootPageTabModel, type ChildPageModel, type RootPageModel } from '@nocobase/client-v2';
import type { CreateModelOptions } from '@nocobase/flow-engine';
import { MobileChildPageModel, MobileLayoutModel, MobileRootPageModel } from '@nocobase/plugin-ui-layout/client-v2';
import React from 'react';
import { MultiPortalLayoutAccessBoundary } from '../PortalAccessBoundary';

type RouteWithOwnership = Record<string, unknown> & {
  multiPortals?: unknown;
  uiLayouts?: unknown;
};

type ApiRequestOptions = Record<string, unknown> & {
  data?: unknown;
  params?: unknown;
  url?: unknown;
};

type ApiWithRequest = {
  request: (options: unknown) => Promise<unknown>;
};

function isRouteWithOwnership(route: unknown): route is RouteWithOwnership {
  return !!route && typeof route === 'object' && !Array.isArray(route);
}

type PortalLayoutContextModel = RootPageModel | ChildPageModel | RootPageTabModel | ChildPageTabModel;

function getCurrentPortalUid(model: PortalLayoutContextModel) {
  const layout = model.context?.layout as { uid?: unknown } | undefined;
  const portalUid = layout?.uid;

  if (typeof portalUid !== 'string' || !portalUid.trim()) {
    return undefined;
  }

  return portalUid;
}

function withoutRouteOwnership(route: unknown) {
  if (!isRouteWithOwnership(route)) {
    return route;
  }

  const { uiLayouts: _uiLayouts, multiPortals: _multiPortals, ...routeValues } = route;
  return routeValues;
}

function isDesktopRoutesRequest(options: unknown): options is ApiRequestOptions {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return false;
  }

  const url = (options as ApiRequestOptions).url;
  return typeof url === 'string' && url.replace(/^\/+/, '').startsWith('desktopRoutes:');
}

function isApiWithRequest(api: unknown): api is ApiWithRequest {
  if (!api || typeof api !== 'object' || Array.isArray(api) || !('request' in api)) {
    return false;
  }

  return typeof api.request === 'function';
}

function withPortalIdentity(model: PortalLayoutContextModel, options: unknown) {
  if (!isDesktopRoutesRequest(options)) {
    return options;
  }

  const portalUid = getCurrentPortalUid(model);
  if (!portalUid) {
    return options;
  }

  const currentParams =
    options.params && typeof options.params === 'object' && !Array.isArray(options.params) ? options.params : {};
  const { layout: _layout, portal: _portal, ...params } = currentParams as Record<string, unknown>;

  const scopedOptions = {
    ...options,
    params: {
      ...params,
      portal: portalUid,
    },
  };

  return Object.prototype.hasOwnProperty.call(options, 'data')
    ? { ...scopedOptions, data: withoutRouteOwnership(options.data) }
    : scopedOptions;
}

function installPortalIdentityApi(model: PortalLayoutContextModel) {
  const api: unknown = model.flowEngine.context.api;
  if (!isApiWithRequest(api)) {
    return;
  }

  const scopedApi = new Proxy(api, {
    get(apiTarget, key) {
      if (key === 'request') {
        return (options: unknown) => apiTarget.request(withPortalIdentity(model, options));
      }

      const value = Reflect.get(apiTarget, key, apiTarget);
      return typeof value === 'function' ? value.bind(apiTarget) : value;
    },
  });
  model.context.defineProperty('api', {
    value: scopedApi,
  });
}

function withCurrentPortalTabOptions(options: CreateModelOptions, tabModelClass: string) {
  const route = options.props?.route;

  return {
    ...options,
    use: tabModelClass,
    props: {
      ...options.props,
      route: withoutRouteOwnership(route),
    },
  };
}

function normalizePortalTabRouteOwnership(model: RootPageTabModel | ChildPageTabModel) {
  model.setProps('route', withoutRouteOwnership(model.props.route));
}

export class MultiPortalMobileLayoutModel extends MobileLayoutModel {
  render() {
    const renderAllowed = () => super.render();
    return <MultiPortalLayoutAccessBoundary portalUid={this.layout.uid} renderAllowed={renderAllowed} />;
  }
}

export class MultiPortalMobileRootPageModel extends MobileRootPageModel {
  constructor(options: ConstructorParameters<typeof MobileRootPageModel>[0]) {
    super(options);
    installPortalIdentityApi(this);

    const createUiLayoutPageTabModelOptions = this.createPageTabModelOptions.bind(this);
    this.createPageTabModelOptions = () => {
      return withCurrentPortalTabOptions(createUiLayoutPageTabModelOptions(), 'MultiPortalMobileRootPageTabModel');
    };
  }
}

export class MultiPortalMobileChildPageModel extends MobileChildPageModel {
  constructor(options: ConstructorParameters<typeof MobileChildPageModel>[0]) {
    super(options);
    installPortalIdentityApi(this);

    const createUiLayoutPageTabModelOptions = this.createPageTabModelOptions.bind(this);
    this.createPageTabModelOptions = () => {
      return withCurrentPortalTabOptions(createUiLayoutPageTabModelOptions(), 'MultiPortalMobileChildPageTabModel');
    };
  }
}

export class MultiPortalMobileRootPageTabModel extends RootPageTabModel {
  constructor(options: ConstructorParameters<typeof RootPageTabModel>[0]) {
    super(options);
    installPortalIdentityApi(this);
    normalizePortalTabRouteOwnership(this);
  }

  async save() {
    normalizePortalTabRouteOwnership(this);
    await super.save();
    normalizePortalTabRouteOwnership(this);
  }
}

export class MultiPortalMobileChildPageTabModel extends ChildPageTabModel {
  constructor(options: ConstructorParameters<typeof ChildPageTabModel>[0]) {
    super(options);
    installPortalIdentityApi(this);
    normalizePortalTabRouteOwnership(this);
  }

  async save() {
    normalizePortalTabRouteOwnership(this);
    await super.save();
    normalizePortalTabRouteOwnership(this);
  }
}
