/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AxiosInstance } from 'axios';

const DESKTOP_ROUTE_UPSERT_ACTION = 'desktopRoutes:updateOrCreate';
const MOBILE_LAYOUT_MODEL_CLASS = 'MobileLayoutModel';
const ROUTE_SCOPE_PARAM_NAMES = ['layout', 'portal'] as const;

type MobileDesktopRouteWriteScopeModel = {
  layout?: {
    layoutModelClass?: unknown;
    uid?: unknown;
  };
  flowEngine: {
    context: {
      api?: {
        axios?: AxiosInstance;
      };
    };
  };
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toSerializableParams(params: URLSearchParams) {
  const result: Record<string, string | string[]> = {};

  params.forEach((value, originalName) => {
    const isArrayParam = originalName.endsWith('[]');
    const name = isArrayParam ? originalName.slice(0, -2) : originalName;
    const currentValue = result[name];

    if (currentValue === undefined) {
      result[name] = isArrayParam ? [value] : value;
      return;
    }

    result[name] = Array.isArray(currentValue) ? [...currentValue, value] : [currentValue, value];
  });

  return result;
}

function isDesktopRouteUpsertUrl(url: unknown) {
  if (typeof url !== 'string') {
    return false;
  }

  const pathname = url.split('?')[0].replace(/\/+$/, '');
  return pathname.split('/').pop() === DESKTOP_ROUTE_UPSERT_ACTION;
}

function hasRouteScopeParam(params: URLSearchParams | Record<string, unknown>) {
  return ROUTE_SCOPE_PARAM_NAMES.some((name) => {
    const bracketName = `${name}[]`;
    return params instanceof URLSearchParams
      ? params.has(name) || params.has(bracketName)
      : Object.prototype.hasOwnProperty.call(params, name) || Object.prototype.hasOwnProperty.call(params, bracketName);
  });
}

function hasExplicitRouteScope(url: unknown, params: unknown) {
  if (
    params instanceof URLSearchParams ? hasRouteScopeParam(params) : isPlainRecord(params) && hasRouteScopeParam(params)
  ) {
    return true;
  }

  if (typeof url !== 'string') {
    return false;
  }

  const query = url.split('?')[1];
  if (!query) {
    return false;
  }

  const queryParams = new URLSearchParams(query);
  return hasRouteScopeParam(queryParams);
}

export function installMobileDesktopRouteWriteScope(model: MobileDesktopRouteWriteScopeModel) {
  const layout = model.layout;
  const layoutUid = layout?.uid;
  if (layout?.layoutModelClass !== MOBILE_LAYOUT_MODEL_CLASS || typeof layoutUid !== 'string' || !layoutUid.trim()) {
    return () => {};
  }

  const requestInterceptors = model.flowEngine.context.api?.axios?.interceptors.request;
  if (!requestInterceptors) {
    return () => {};
  }

  const interceptorId = requestInterceptors.use((config) => {
    if (!isDesktopRouteUpsertUrl(config.url)) {
      return config;
    }

    const hasExplicitScope = hasExplicitRouteScope(config.url, config.params);
    if (config.params instanceof URLSearchParams) {
      const params = toSerializableParams(config.params);
      if (!hasExplicitScope) {
        params.layout = layoutUid;
      }
      config.params = params;
      return config;
    }
    if (hasExplicitScope) {
      return config;
    }
    if (config.params != null && !isPlainRecord(config.params)) {
      return config;
    }

    config.params = {
      ...(config.params || {}),
      layout: layoutUid,
    };
    return config;
  });

  return () => {
    requestInterceptors.eject(interceptorId);
  };
}
