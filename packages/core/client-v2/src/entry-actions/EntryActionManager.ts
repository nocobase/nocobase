/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  define,
  observable,
  type FlowModelContext,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';

export type EntryActionScope = 'action-panel' | 'app-switcher' | string;

export type EntryActionProvider = (ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>;

type ProviderRecord = {
  name: string;
  scope: EntryActionScope;
  provider: EntryActionProvider;
  sort: number;
};

export class EntryActionManager {
  private readonly providers = new Map<string, ProviderRecord>();
  revision = 0;

  constructor() {
    define(this, {
      revision: observable.ref,
    });
  }

  register(name: string, options: { scope: EntryActionScope; provider: EntryActionProvider; sort?: number }) {
    this.providers.set(name, {
      name,
      scope: options.scope,
      provider: options.provider,
      sort: options.sort ?? 0,
    });
    this.invalidate();
  }

  unregister(name: string) {
    this.providers.delete(name);
    this.invalidate();
  }

  invalidate() {
    this.revision += 1;
  }

  getItems(scope: EntryActionScope): SubModelItemsType {
    return async (ctx) => {
      const providers = [...this.providers.values()]
        .filter((item) => item.scope === scope)
        .sort((a, b) => a.sort - b.sort);
      const groups = await Promise.all(
        providers.map(async (item) => {
          try {
            return await item.provider(ctx);
          } catch (error) {
            console.error(`[NocoBase] Failed to load entry action provider "${item.name}".`, error);
            return [];
          }
        }),
      );
      return groups.flat();
    };
  }
}
