/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application, LayoutRegisterOptions } from '@nocobase/client-v2';
import { getMultiPortalRouteScopeCacheKey, installMultiPortalRouteRepositoryScope } from './routeRepositoryScope';

export { getMultiPortalRouteScopeCacheKey };

export type MultiPortalRuntimeRecord = {
  uid: string;
  title?: string;
  routeName: string;
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
  flowEngine?: {
    context?: {
      routeRepository?: unknown;
    };
  };
  layoutManager: Pick<Application['layoutManager'], 'hasLayout' | 'registerLayout'>;
};

const UI_LAYOUT_TYPE_DESKTOP = 'desktop';
const UI_LAYOUT_TYPE_MOBILE = 'mobile';
const ADMIN_LAYOUT_MODEL_CLASS = 'AdminLayoutModel';
const MULTI_PORTAL_MOBILE_LAYOUT_MODEL_CLASS = 'MultiPortalMobileLayoutModel';
const MULTI_PORTAL_MOBILE_ROOT_PAGE_MODEL_CLASS = 'MultiPortalMobileRootPageModel';
const MULTI_PORTAL_MOBILE_CHILD_PAGE_MODEL_CLASS = 'MultiPortalMobileChildPageModel';

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

export function toMultiPortalLayoutRegisterOptions(record: MultiPortalRuntimeRecord): LayoutRegisterOptions | null {
  if (!record.enabled) {
    return null;
  }

  const codeDefinedOptions = layoutRegisterOptionsByType[record.uiLayout?.layoutType || ''];
  if (!codeDefinedOptions) {
    return null;
  }

  return {
    routeName: record.routeName,
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
    skipNotify: true,
  });
  const records = response?.data?.data;
  return Array.isArray(records) ? records : [];
}

export function registerMultiPortalRecords(
  layoutManager: MultiPortalRegistrationApp['layoutManager'],
  records: MultiPortalRuntimeRecord[],
) {
  for (const record of records) {
    const options = toMultiPortalLayoutRegisterOptions(record);
    if (!options || layoutManager.hasLayout(options.routeName)) {
      continue;
    }

    try {
      layoutManager.registerLayout(options);
    } catch (error) {
      console.warn(`[NocoBase] plugin-multi-portal failed to register portal '${options.routeName}'.`, error);
    }
  }
}

export async function registerMultiPortalsFromApi(app: MultiPortalRegistrationApp) {
  let records: MultiPortalRuntimeRecord[];
  try {
    records = await fetchMultiPortals(app.apiClient);
  } catch (error) {
    console.warn('[NocoBase] plugin-multi-portal failed to load portals.', error);
    return;
  }

  registerMultiPortalRecords(app.layoutManager, records);
  installMultiPortalRouteRepositoryScope(app.flowEngine?.context?.routeRepository, () =>
    records.filter((record) => record.enabled).map((record) => record.uid),
  );
}
