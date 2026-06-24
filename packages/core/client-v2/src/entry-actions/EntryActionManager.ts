/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelContext, SubModelItem, SubModelItemsType } from '@nocobase/flow-engine';

export type EntryActionScope = 'action-panel' | 'app-switcher' | string;

export type EntryActionProvider = (ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>;

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
  apps: AppPortalAppItem[];
  portals: AppPortalItem[];
};

type AppPortalsApiClientLike = {
  silent?: () => AppPortalsApiClientLike;
  request: (options: { url: string; skipNotify?: boolean }) => Promise<{ data?: { data?: unknown } | unknown }>;
};

type ProviderRecord = {
  scope: EntryActionScope;
  provider: EntryActionProvider;
  sort: number;
};

function normalizeAppPortalsPayload(value: unknown): AppPortalsPayload {
  const payload = (value || {}) as Partial<AppPortalsPayload>;
  return {
    apps: Array.isArray(payload.apps) ? payload.apps : [],
    portals: Array.isArray(payload.portals) ? payload.portals : [],
  };
}

export class EntryActionManager {
  private readonly providers = new Map<string, ProviderRecord>();
  private appPortalsRequest?: Promise<AppPortalsPayload>;
  private appPortalsCache?: AppPortalsPayload;

  register(name: string, options: { scope: EntryActionScope; provider: EntryActionProvider; sort?: number }) {
    this.providers.set(name, {
      scope: options.scope,
      provider: options.provider,
      sort: options.sort ?? 0,
    });
  }

  unregister(name: string) {
    this.providers.delete(name);
  }

  getItems(scope: EntryActionScope): SubModelItemsType {
    return async (ctx) => {
      const providers = [...this.providers.values()]
        .filter((item) => item.scope === scope)
        .sort((a, b) => a.sort - b.sort);
      const groups = await Promise.all(providers.map((item) => item.provider(ctx)));
      return groups.flat();
    };
  }

  loadAppPortals(apiClient: AppPortalsApiClientLike): Promise<AppPortalsPayload> {
    if (this.appPortalsCache) {
      return Promise.resolve(this.appPortalsCache);
    }

    if (!this.appPortalsRequest) {
      this.appPortalsRequest = (apiClient.silent?.() || apiClient)
        .request({
          url: 'app:getPortals',
          skipNotify: true,
        })
        .then((response) => {
          const payload = normalizeAppPortalsPayload((response?.data as { data?: unknown })?.data ?? response?.data);
          this.appPortalsCache = payload;
          return payload;
        })
        .finally(() => {
          this.appPortalsRequest = undefined;
        });
    }
    return this.appPortalsRequest;
  }
}
