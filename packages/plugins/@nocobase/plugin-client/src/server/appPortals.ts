/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

export type AppPortalsPayload = {
  apps?: AppPortalAppItem[];
  portals?: AppPortalItem[];
};

type AppPortalsContextLike = {
  app?: {
    name?: string;
  };
  db?: unknown;
  [key: string]: unknown;
};

type AppPortalsAppLike = {
  name?: string;
  logger?: {
    warn?: (message: string, meta?: Record<string, unknown>) => void;
  };
};

export type AppPortalsProviderContext = {
  ctx: AppPortalsContextLike;
  app: AppPortalsAppLike;
};

export type AppPortalsProvider = (context: AppPortalsProviderContext) => AppPortalsPayload | Promise<AppPortalsPayload>;

const MAIN_APP_NAME = 'main';
const DEFAULT_PORTALS = [
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

function isValidAppItem(item: AppPortalAppItem | null | undefined): item is AppPortalAppItem {
  return !!item?.name && typeof item.name === 'string';
}

function isValidPortalItem(item: AppPortalItem | null | undefined): item is AppPortalItem {
  return !!item?.appName && typeof item.appName === 'string' && !!item.routePath && typeof item.routePath === 'string';
}

export class AppPortalsService {
  private readonly providers = new Map<string, AppPortalsProvider>();

  constructor(private readonly app: AppPortalsAppLike) {}

  registerProvider(name: string, provider: AppPortalsProvider) {
    this.providers.set(name, provider);
  }

  unregisterProvider(name: string) {
    this.providers.delete(name);
  }

  async list(ctx: AppPortalsContextLike): Promise<{ apps: AppPortalAppItem[]; portals: AppPortalItem[] }> {
    const apps = new Map<string, AppPortalAppItem>();
    const portals = new Map<string, AppPortalItem>();

    for (const [name, provider] of this.providers) {
      try {
        const payload = await provider({ ctx, app: this.app });
        for (const item of payload.apps || []) {
          if (isValidAppItem(item)) {
            apps.set(item.name, {
              ...apps.get(item.name),
              ...item,
            });
          }
        }
        for (const item of payload.portals || []) {
          if (isValidPortalItem(item)) {
            portals.set(this.getPortalKey(item), item);
          }
        }
      } catch (error) {
        this.app.logger?.warn?.(`failed to collect app portals from provider "${name}"`, { error });
      }
    }

    this.addDefaultPortals(apps, portals);

    return {
      apps: [...apps.values()],
      portals: [...portals.values()],
    };
  }

  private addDefaultPortals(apps: Map<string, AppPortalAppItem>, portals: Map<string, AppPortalItem>) {
    const appNames = new Set<string>([MAIN_APP_NAME]);

    for (const appName of apps.keys()) {
      appNames.add(appName);
    }

    for (const portal of portals.values()) {
      appNames.add(portal.appName);
    }

    if (appNames.size > 1 && !apps.has(MAIN_APP_NAME)) {
      apps.set(MAIN_APP_NAME, {
        name: MAIN_APP_NAME,
        title: 'Main',
        icon: null,
        appUrl: null,
      });
    }

    for (const appName of appNames) {
      for (const portal of DEFAULT_PORTALS) {
        const item: AppPortalItem = {
          ...portal,
          appName,
        };
        const key = this.getPortalKey(item);
        if (!portals.has(key)) {
          portals.set(key, item);
        }
      }
    }
  }

  private getPortalKey(item: AppPortalItem) {
    return item.uid ? `${item.appName}:${item.uid}` : `${item.appName}:${item.routePath}`;
  }
}
