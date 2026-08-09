/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { define, observable } from '@nocobase/flow-engine';
import type { AppPortalsPayload } from './types';

type AppPortalsApiClientLike = {
  silent?: () => AppPortalsApiClientLike;
  request: (options: { url: string; skipNotify?: boolean }) => Promise<{ data?: { data?: unknown } | unknown }>;
};

function normalizeAppPortalsPayload(value: unknown): AppPortalsPayload {
  const payload = (value || {}) as Partial<AppPortalsPayload>;
  return {
    apps: Array.isArray(payload.apps) ? payload.apps : [],
    portals: Array.isArray(payload.portals) ? payload.portals : [],
  };
}

class PortalEntryActionStore {
  payload: AppPortalsPayload = normalizeAppPortalsPayload(null);
  loading = false;
  revision = 0;
  private loaded = false;
  private request?: Promise<AppPortalsPayload>;
  private requestId = 0;

  constructor(private app: Application) {
    define(this, {
      payload: observable.ref,
      loading: observable.ref,
      revision: observable.ref,
    });
  }

  load(apiClient: AppPortalsApiClientLike = this.app.apiClient): Promise<AppPortalsPayload> {
    if (this.loaded && !this.request) {
      return Promise.resolve(this.payload);
    }

    return this.requestPortals(apiClient);
  }

  reload(apiClient: AppPortalsApiClientLike = this.app.apiClient): Promise<AppPortalsPayload> {
    return this.requestPortals(apiClient, { force: true, invalidateEntryActions: true });
  }

  private requestPortals(
    apiClient: AppPortalsApiClientLike,
    options: { force?: boolean; invalidateEntryActions?: boolean } = {},
  ): Promise<AppPortalsPayload> {
    if (!this.request || options.force) {
      const requestId = ++this.requestId;
      this.loading = true;
      this.request = (apiClient.silent?.() || apiClient)
        .request({
          url: 'app:getPortals',
          skipNotify: true,
        })
        .then((response) => {
          const payload = normalizeAppPortalsPayload((response?.data as { data?: unknown })?.data ?? response?.data);
          if (requestId === this.requestId) {
            this.payload = payload;
            this.loaded = true;
            this.revision += 1;
            if (options.invalidateEntryActions) {
              this.app.entryActionManager?.invalidate();
            }
          }
          return payload;
        })
        .catch((error) => {
          throw error;
        })
        .finally(() => {
          if (requestId === this.requestId) {
            this.loading = false;
            this.request = undefined;
          }
        });
    }
    return this.request;
  }
}

const stores = new WeakMap<Application, PortalEntryActionStore>();

export function getPortalEntryActionStore(app: Application) {
  let store = stores.get(app);
  if (!store) {
    store = new PortalEntryActionStore(app);
    stores.set(app, store);
  }
  return store;
}
