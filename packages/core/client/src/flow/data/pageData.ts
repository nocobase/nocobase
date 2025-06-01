/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';

export interface FlowPageConfig {
  uid: string;
  stepParams: {
    defaultFlow: {
      setPageInfo: {
        title: string;
        description?: string;
      };
      convertRouteToTabs?: {
        route?: any;
      };
    };
  };
}

export interface IFlowModelRepository<T = any> {
  load(uid: string): Promise<Record<string, any> | null>;
  save(model: T): Promise<T>;
  destroy(uid: string): Promise<boolean>;
}

class PageStore {
  private data = observable(new Map<string, FlowPageConfig>());

  create(config: { title: string; description?: string; route?: any }): FlowPageConfig {
    const pageConfig: FlowPageConfig = {
      uid: uid(),
      stepParams: {
        defaultFlow: {
          setPageInfo: {
            title: config.title,
            description: config.description || undefined,
          },
          convertRouteToTabs: {
            route: config.route,
          },
        },
      },
    };

    this.data.set(pageConfig.uid, pageConfig);
    console.log('PageStore: Created', pageConfig);
    return pageConfig;
  }

  get(filter?: { uid?: string }): FlowPageConfig[] {
    if (filter?.uid) {
      const item = this.data.get(filter.uid);
      console.log('PageStore: Get by uid', { uid: filter.uid, found: !!item });
      return item ? [item] : [];
    }

    const allItems = Array.from(this.data.values());
    console.log('PageStore: Get all', { count: allItems.length });
    return allItems;
  }

  update(uid: string, updates: Partial<FlowPageConfig>): FlowPageConfig | undefined {
    const existing = this.data.get(uid);
    if (!existing) {
      console.log('PageStore: Item not found for update', uid);
      return undefined;
    }

    const updated = {
      ...existing,
      ...updates,
    };

    this.data.set(uid, updated);
    console.log('PageStore: Updated', updated);
    return updated;
  }

  delete(uid: string): boolean {
    const deleted = this.data.delete(uid);
    console.log('PageStore: Deleted', { uid, success: deleted });
    return deleted;
  }
}

// 全局实例
const pageStore = new PageStore();

// 导出 CRUD 函数
export const createPage = (config: { title: string; description?: string; route?: any }) => pageStore.create(config);

export const getPages = (filter?: { uid?: string }) => pageStore.get(filter);

export const updatePage = (uid: string, updates: Partial<FlowPageConfig>) => pageStore.update(uid, updates);

export const deletePage = (uid: string) => pageStore.delete(uid);

// 实现 IFlowModelRepository 接口
class FlowPageModelRepository implements IFlowModelRepository<FlowPageConfig> {
  async load(uid: string): Promise<FlowPageConfig | null> {
    const pages = getPages({ uid });
    return pages.length > 0 ? pages[0] : null;
  }

  async save(model: FlowPageConfig): Promise<FlowPageConfig> {
    const updated = updatePage(model.uid, model);
    return updated || model;
  }

  async destroy(uid: string): Promise<boolean> {
    return deletePage(uid);
  }
}

export const flowPageRepository = new FlowPageModelRepository();
