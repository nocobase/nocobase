/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import type { AppModel, AppStatus } from '@nocobase/server';

export type AppPortalAppStatus = AppStatus | Record<string, AppStatus> | null;
type AppPortalAppStatusesResult = Record<string, AppPortalAppStatus>;

export type AppPortalAppItem = {
  name: string;
  title?: string | null;
  icon?: string | null;
  cname?: string | null;
  ssoEnabled?: boolean;
  target?: string;
  status?: AppPortalAppStatus;
};

export type AppPortalItem = {
  uid?: string | null;
  appName: string;
  title?: string | null;
  icon?: string | null;
  routePath: string;
  layout?: string | null;
  defaultPortal?: boolean;
};

export type StoredAppPortalItem = Omit<AppPortalItem, 'appName' | 'defaultPortal'>;

const MAIN_APP_NAME = 'main';
const MULTI_PORTAL_MANIFEST_NAMESPACE = 'multi-portal';
const DEFAULT_PORTALS: Array<Omit<AppPortalItem, 'appName'>> = [
  {
    uid: '__default_admin__',
    title: 'Admin',
    icon: 'DesktopOutlined',
    routePath: '/admin',
    layout: 'desktop',
    defaultPortal: true,
  },
  {
    uid: '__default_mobile__',
    title: 'Mobile',
    icon: 'MobileOutlined',
    routePath: '/mobile',
    layout: 'mobile',
    defaultPortal: true,
  },
];

function getCname(cname?: string | null) {
  const trimmed = cname?.trim();
  return trimmed || null;
}

function getAppName(appModel: AppModel) {
  return typeof appModel.name === 'string' && appModel.name ? appModel.name : null;
}

function getAppStatus(appName: string, statuses: AppPortalAppStatusesResult): AppPortalAppStatus {
  return statuses[appName] ?? null;
}

function shouldUseCnameVisitUrl(options: { cname?: string | null; ssoEnabled?: boolean; ssoCnameEnabled?: boolean }) {
  const { cname, ssoEnabled, ssoCnameEnabled } = options;
  return Boolean(cname && (!ssoEnabled || ssoCnameEnabled));
}

function toAppPortalAppItem(
  appModel: AppModel,
  appSsoIssuer: string | null | undefined,
  target: string | undefined,
): AppPortalAppItem | null {
  const name = getAppName(appModel);
  if (!name || name === MAIN_APP_NAME) {
    return null;
  }

  const cname = getCname(appModel.cname);
  const ssoEnabled = appModel.options?.sso?.enabled === true;
  const ssoCnameEnabled = Boolean(appModel.options?.sso?.issuer || appSsoIssuer);

  return {
    name,
    title: appModel.title || name,
    icon: appModel.icon || null,
    cname: shouldUseCnameVisitUrl({ cname, ssoEnabled, ssoCnameEnabled }) ? cname : null,
    ssoEnabled,
    target,
  };
}

function getPortalKey(item: AppPortalItem) {
  return item.uid ? `${item.appName}:${item.uid}` : `${item.appName}:${item.routePath}`;
}

function addPortal(portals: Map<string, AppPortalItem>, item: AppPortalItem) {
  if (!item.appName || !item.routePath) {
    return;
  }
  portals.set(getPortalKey(item), item);
}

function addDefaultPortals(portals: Map<string, AppPortalItem>, appNames: Set<string>) {
  for (const appName of appNames) {
    for (const portal of DEFAULT_PORTALS) {
      addPortal(portals, {
        ...portal,
        appName,
      });
    }
  }
}

function addStoredPortals(
  portals: Map<string, AppPortalItem>,
  appName: string,
  storedPortals: StoredAppPortalItem[] | null | undefined,
) {
  if (!Array.isArray(storedPortals)) {
    return;
  }

  for (const portal of storedPortals) {
    if (!portal || typeof portal.routePath !== 'string' || !portal.routePath) {
      continue;
    }
    addPortal(portals, {
      uid: typeof portal.uid === 'string' ? portal.uid : null,
      appName,
      title: typeof portal.title === 'string' ? portal.title : null,
      icon: typeof portal.icon === 'string' ? portal.icon : null,
      routePath: portal.routePath,
      layout: typeof portal.layout === 'string' ? portal.layout : null,
    });
  }
}

export async function listAppPortals(currentAppName?: string | null) {
  const supervisor = AppSupervisor.getInstance();
  const appModels = await supervisor.listAppModels();
  const apps = new Map<string, AppPortalAppItem>();
  const appNames = new Set<string>([MAIN_APP_NAME]);
  const target = currentAppName === MAIN_APP_NAME ? '_blank' : undefined;
  const appSsoIssuer = supervisor.getAppSsoIssuer();
  const appItems = appModels.map((appModel) => toAppPortalAppItem(appModel, appSsoIssuer, target));

  if (currentAppName) {
    appNames.add(currentAppName);
  }

  for (const app of appItems) {
    if (!app) {
      continue;
    }
    apps.set(app.name, app);
    appNames.add(app.name);
  }

  if (appNames.size > 1 && !apps.has(MAIN_APP_NAME)) {
    apps.set(MAIN_APP_NAME, {
      name: MAIN_APP_NAME,
      title: 'Main',
      icon: null,
    });
  }

  const appStatuses = await supervisor.getAppsStatuses(Array.from(appNames));
  for (const app of apps.values()) {
    app.status = getAppStatus(app.name, appStatuses);
  }

  const manifests = await supervisor.getAppManifests<StoredAppPortalItem>(
    MULTI_PORTAL_MANIFEST_NAMESPACE,
    Array.from(appNames),
  );
  const portals = new Map<string, AppPortalItem>();

  addDefaultPortals(portals, appNames);
  for (const appName of appNames) {
    addStoredPortals(portals, appName, manifests[appName]);
  }

  return {
    apps: [...apps.values()],
    portals: [...portals.values()],
  };
}
