/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import type { AppModel } from '@nocobase/server';

export type AppPortalAppItem = {
  name: string;
  title?: string | null;
  icon?: string | null;
  appUrl?: string | null;
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

type AppPortalsContextLike = {
  app?: {
    name?: string;
  };
};

function normalizeCname(cname?: string | null) {
  if (!cname) {
    return null;
  }
  const trimmed = cname.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return null;
  }
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('//') ? trimmed : `//${trimmed}`;
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function getAppName(appModel: AppModel) {
  return typeof appModel.name === 'string' && appModel.name ? appModel.name : null;
}

function shouldShowApp(appModel: AppModel) {
  return appModel.options?.hidden !== true;
}

async function getAppUrl(appModel: AppModel) {
  const cnameUrl = normalizeCname(appModel.cname);
  if (cnameUrl) {
    return cnameUrl;
  }

  const appName = getAppName(appModel);
  const environment = appModel.environment || appModel.environments?.[0];
  if (!appName || !environment) {
    return null;
  }

  const envInfo = await AppSupervisor.getInstance().getEnvironment(environment);
  const baseUrl = envInfo?.proxyUrl || envInfo?.url;
  return baseUrl ? joinUrl(baseUrl, `/apps/${encodeURIComponent(appName)}`) : null;
}

async function toAppPortalAppItem(appModel: AppModel): Promise<AppPortalAppItem | null> {
  const name = getAppName(appModel);
  if (!name || name === MAIN_APP_NAME || !shouldShowApp(appModel)) {
    return null;
  }

  return {
    name,
    title: appModel.title || name,
    icon: appModel.icon || null,
    appUrl: await getAppUrl(appModel),
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

export async function listAppPortals(ctx: AppPortalsContextLike) {
  const supervisor = AppSupervisor.getInstance();
  const appModels = await supervisor.listAppModels();
  const appItems = await Promise.all(appModels.map((appModel) => toAppPortalAppItem(appModel)));
  const apps = new Map<string, AppPortalAppItem>();
  const appNames = new Set<string>([MAIN_APP_NAME]);
  const currentAppName = ctx.app?.name;

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
      appUrl: null,
    });
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
