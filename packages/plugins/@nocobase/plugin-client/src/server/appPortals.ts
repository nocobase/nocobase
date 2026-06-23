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
};

export type AppPortalsPayload = {
  apps?: AppPortalAppItem[];
  portals?: AppPortalItem[];
};

type AppPortalsContextLike = {
  app?: {
    name?: string;
  };
  db: {
    getRepository: (name: string) => {
      findOne: () => Promise<{
        get?: (field: string) => unknown;
        title?: string;
        logo?: {
          url?: string;
        };
      } | null>;
    };
  };
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

    for (const appItem of await this.getMainAppItems(ctx)) {
      apps.set(appItem.name, appItem);
    }

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

    return {
      apps: [...apps.values()],
      portals: [...portals.values()],
    };
  }

  private async getMainAppItems(ctx: AppPortalsContextLike): Promise<AppPortalAppItem[]> {
    const name = ctx.app?.name || this.app.name || 'main';
    if (name !== 'main') {
      return [];
    }

    const systemSetting = await ctx.db.getRepository('systemSettings').findOne();
    const logo = systemSetting?.get?.('logo') || systemSetting?.logo;
    const icon = typeof logo?.url === 'string' ? logo.url : null;
    return [
      {
        name,
        title: systemSetting?.get?.('title') || systemSetting?.title || name,
        icon,
      },
    ];
  }

  private getPortalKey(item: AppPortalItem) {
    return item.uid ? `${item.appName}:${item.uid}` : `${item.appName}:${item.routePath}`;
  }
}
