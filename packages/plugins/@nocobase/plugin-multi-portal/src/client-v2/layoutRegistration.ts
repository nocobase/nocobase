/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application, LayoutRegisterOptions } from '@nocobase/client-v2';
import { DEFAULT_MOBILE_MULTI_PORTAL_UID } from '../constants';
import { getMultiPortalRouteScopeCacheKey, installMultiPortalRouteRepositoryScope } from './routeRepositoryScope';

export { getMultiPortalRouteScopeCacheKey };

export type MultiPortalRuntimeRecord = {
  uid: string;
  title?: string;
  portalType?: string | null;
  portalName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
  uiLayout?: {
    layoutType?: string;
    routeName?: string;
    routePath?: string;
  };
};

type MultiPortalListBody = {
  data?: MultiPortalRuntimeRecord[];
};

type MultiPortalRegistrationApp = {
  apiClient: Pick<Application['apiClient'], 'request'>;
  context?: {
    routeRepository?: unknown;
  };
  flowEngine?: {
    context?: unknown;
  };
  layoutManager: Pick<Application['layoutManager'], 'hasLayout' | 'listLayouts' | 'registerLayout'>;
};

const UI_LAYOUT_TYPE_DESKTOP = 'desktop';
const UI_LAYOUT_TYPE_MOBILE = 'mobile';
const ADMIN_LAYOUT_MODEL_CLASS = 'AdminLayoutModel';
const MULTI_PORTAL_MOBILE_LAYOUT_MODEL_CLASS = 'MultiPortalMobileLayoutModel';
const MULTI_PORTAL_MOBILE_ROOT_PAGE_MODEL_CLASS = 'MultiPortalMobileRootPageModel';
const MULTI_PORTAL_MOBILE_CHILD_PAGE_MODEL_CLASS = 'MultiPortalMobileChildPageModel';
const MOBILE_LAYOUT_MODEL_CLASS = 'MobileLayoutModel';
const MOBILE_ROOT_PAGE_MODEL_CLASS = 'MobileRootPageModel';
const MOBILE_CHILD_PAGE_MODEL_CLASS = 'MobileChildPageModel';
const MULTI_PORTAL_LAYOUT_ROUTE_NAME_PREFIX = 'multiPortalLayout_';

const layoutRegisterOptionsByType: Record<
  string,
  Pick<LayoutRegisterOptions, 'layoutModelClass' | 'rootPageModelClass' | 'childPageModelClass'>
> = {
  [UI_LAYOUT_TYPE_DESKTOP]: {
    layoutModelClass: ADMIN_LAYOUT_MODEL_CLASS,
  },
  [UI_LAYOUT_TYPE_MOBILE]: {
    layoutModelClass: MULTI_PORTAL_MOBILE_LAYOUT_MODEL_CLASS,
    rootPageModelClass: MULTI_PORTAL_MOBILE_ROOT_PAGE_MODEL_CLASS,
    childPageModelClass: MULTI_PORTAL_MOBILE_CHILD_PAGE_MODEL_CLASS,
  },
};

const layoutModeMobileRegisterOptions = {
  layoutModelClass: MOBILE_LAYOUT_MODEL_CLASS,
  rootPageModelClass: MOBILE_ROOT_PAGE_MODEL_CLASS,
  childPageModelClass: MOBILE_CHILD_PAGE_MODEL_CLASS,
} satisfies Pick<LayoutRegisterOptions, 'layoutModelClass' | 'rootPageModelClass' | 'childPageModelClass'>;

function isRuntimePortal(record: MultiPortalRuntimeRecord) {
  return (record.portalType || 'no-code') === 'no-code';
}

function getMultiPortalLayoutRouteName(uid: string) {
  return `${MULTI_PORTAL_LAYOUT_ROUTE_NAME_PREFIX}${encodeURIComponent(uid).replace(/\./g, '%2E')}`;
}

export function toMultiPortalLayoutRegisterOptions(record: MultiPortalRuntimeRecord): LayoutRegisterOptions | null {
  if (!record.enabled || !isRuntimePortal(record)) {
    return null;
  }

  const layoutType = record.uiLayout?.layoutType || '';
  const codeDefinedOptions =
    layoutType === UI_LAYOUT_TYPE_MOBILE && record.uid === DEFAULT_MOBILE_MULTI_PORTAL_UID
      ? layoutModeMobileRegisterOptions
      : layoutRegisterOptionsByType[layoutType];
  if (!codeDefinedOptions) {
    return null;
  }

  return {
    routeName: getMultiPortalLayoutRouteName(record.uid),
    routePath: record.routePath,
    uid: record.uid,
    ...codeDefinedOptions,
    authCheck: record.authCheck,
  };
}

export async function fetchMultiPortals(apiClient: MultiPortalRegistrationApp['apiClient']) {
  const response = await apiClient.request<MultiPortalListBody>({
    url: 'multiPortals:listEnabled',
    method: 'get',
    skipAuth: true,
    skipNotify: true,
  });
  const records = response?.data?.data;
  if (!Array.isArray(records)) {
    throw new Error('multiPortals:listEnabled returned an invalid response');
  }
  return records;
}

export function registerMultiPortalRecords(
  layoutManager: MultiPortalRegistrationApp['layoutManager'],
  records: MultiPortalRuntimeRecord[],
) {
  const candidates: Array<{ options: LayoutRegisterOptions; record: MultiPortalRuntimeRecord }> = [];
  const existingPortalUids = new Set(layoutManager.listLayouts().map((layout) => layout.uid));
  const portalUids = new Set<string>();
  const portalNames = new Set<string>();
  const layoutRouteNames = new Set<string>();

  for (const record of records) {
    if (!record.enabled || !isRuntimePortal(record)) {
      continue;
    }
    const options = toMultiPortalLayoutRegisterOptions(record);
    if (!options) {
      throw new Error(`Portal '${record.uid}' uses an unknown UI layout type '${record.uiLayout?.layoutType || ''}'.`);
    }
    if (portalUids.has(record.uid)) {
      throw new Error(`Duplicate portal uid '${record.uid}'.`);
    }
    if (existingPortalUids.has(record.uid)) {
      throw new Error(`Duplicate portal uid '${record.uid}'.`);
    }
    if (portalNames.has(record.portalName)) {
      throw new Error(`Duplicate portal name '${record.portalName}'.`);
    }
    if (layoutRouteNames.has(options.routeName) || layoutManager.hasLayout(options.routeName)) {
      throw new Error(`Duplicate portal layout route name '${options.routeName}'.`);
    }
    portalUids.add(record.uid);
    portalNames.add(record.portalName);
    layoutRouteNames.add(options.routeName);
    candidates.push({ options, record });
  }

  const registeredPortalUids: string[] = [];
  for (const { options, record } of candidates) {
    layoutManager.registerLayout(options);
    registeredPortalUids.push(record.uid);
  }

  return registeredPortalUids;
}

function getRouteRepository(app: MultiPortalRegistrationApp) {
  if (app.context?.routeRepository) {
    return app.context.routeRepository;
  }

  const context = app.flowEngine?.context;
  if (!context || typeof context !== 'object' || !('routeRepository' in context)) {
    return undefined;
  }

  return (context as { routeRepository?: unknown }).routeRepository;
}

export function registerMultiPortals(app: MultiPortalRegistrationApp, records: MultiPortalRuntimeRecord[]) {
  const registeredPortalUids = registerMultiPortalRecords(app.layoutManager, records);
  const registeredPortalUidSet = new Set(registeredPortalUids);
  const registeredPortalScopes = records
    .filter((record) => registeredPortalUidSet.has(record.uid))
    .map((record) => ({
      cacheKey: getMultiPortalRouteScopeCacheKey(record.uid),
      portalUid: record.uid,
    }));
  installMultiPortalRouteRepositoryScope(getRouteRepository(app), () => registeredPortalScopes);
  return records;
}

export async function registerMultiPortalsFromApi(app: MultiPortalRegistrationApp) {
  return registerMultiPortals(app, await fetchMultiPortals(app.apiClient));
}
