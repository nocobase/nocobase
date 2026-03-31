/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentLoader } from './RouterManager';

export const HEADER_ACTIONS_MANAGER_CHANGED = 'header-actions-manager:changed';

/**
 * 右上角扩展按钮的标准动作描述。
 *
 * 该结构用于统一旧的 `PinnedPluginListProvider` 与新的
 * `app.headerActionsManager` 之间的数据协议。
 *
 * @example
 * ```ts
 * const item: HeaderActionItem = {
 *   name: 'inbox',
 *   componentLoader: async () => 'Inbox',
 *   order: 300,
 *   snippet: '*',
 * };
 * ```
 */
export interface HeaderActionItem {
  name: string;
  componentLoader: ComponentLoader;
  order?: number;
  pin?: boolean;
  snippet?: string;
}

type HeaderActionAllow = (snippet?: string) => boolean;

type HeaderActionRegisterItem = HeaderActionItem & {
  sourceId?: string;
  priority?: number;
};

type HeaderActionRegistrationRecord = HeaderActionItem & {
  sourceId?: string;
  priority: number;
  sequence: number;
};

/**
 * 管理右上角扩展按钮注册记录的管理器。
 *
 * 该管理器按“同名动作的注册栈”存储数据，确保后注册覆盖前注册，
 * 并在后注册来源卸载时自动回退到上一个来源的实现。
 *
 * @example
 * ```ts
 * const manager = new HeaderActionsManager();
 * manager.register({
 *   name: 'inbox',
 *   componentLoader: async () => 'Inbox',
 * });
 * manager.getItems();
 * ```
 */
export class HeaderActionsManager {
  private registrations = new Map<string, HeaderActionRegistrationRecord[]>();
  private nameOrder = new Map<string, number>();
  private sequence = 0;
  private nameSequence = 0;

  constructor(private readonly eventBus?: EventTarget) {}

  /**
   * 注册一个或多个右上角动作。
   *
   * @param items 动作配置或动作数组
   * @returns void
   * @throws 不抛出异常，非法项会被忽略
   *
   * @example
   * ```ts
   * manager.register([
   *   { name: 'inbox', componentLoader: async () => 'Inbox' },
   *   { name: 'todo', componentLoader: async () => 'Todo' },
   * ]);
   * ```
   */
  register(items: HeaderActionItem | HeaderActionItem[]) {
    const nextItems = this.normalizeItems(items as HeaderActionRegisterItem | HeaderActionRegisterItem[]);
    if (!nextItems.length) {
      return;
    }

    let changed = false;

    for (const item of nextItems) {
      if (!this.nameOrder.has(item.name)) {
        this.nameOrder.set(item.name, this.nameSequence++);
      }

      const list = this.registrations.get(item.name) || [];
      const index = item.sourceId ? list.findIndex((record) => record.sourceId === item.sourceId) : -1;
      const nextRecord: HeaderActionRegistrationRecord = {
        ...item,
        priority: item.priority ?? 0,
        sequence: index > -1 ? list[index].sequence : this.sequence++,
      };

      if (index > -1) {
        list[index] = nextRecord;
      } else {
        list.push(nextRecord);
      }

      this.registrations.set(item.name, list);
      changed = true;
    }

    if (changed) {
      this.notifyChange();
    }
  }

  /**
   * 注销一个或多个动作名下的所有注册记录。
   *
   * @param names 动作名或动作名数组
   * @returns void
   *
   * @example
   * ```ts
   * manager.unregister(['inbox', 'todo']);
   * ```
   */
  unregister(names: string | string[]) {
    const nextNames = this.normalizeNames(names);
    if (!nextNames.length) {
      return;
    }

    let changed = false;

    for (const name of nextNames) {
      if (!this.registrations.has(name)) {
        continue;
      }

      this.registrations.delete(name);
      this.nameOrder.delete(name);
      changed = true;
    }

    if (changed) {
      this.notifyChange();
    }
  }

  /**
   * 获取当前所有生效动作。
   *
   * @returns 当前生效动作列表
   *
   * @example
   * ```ts
   * const items = manager.getItems();
   * ```
   */
  getItems() {
    return this.sortItems(
      Array.from(this.registrations.entries())
        .map(([, list]) => this.resolveActiveRecord(list))
        .filter(Boolean)
        .map(({ sequence: _sequence, sourceId: _sourceId, priority: _priority, ...item }) => item),
    );
  }

  /**
   * 按 ACL 可见性规则过滤当前生效动作。
   *
   * @param allow ACL 判定函数
   * @returns ACL 过滤后的动作列表
   *
   * @example
   * ```ts
   * manager.resolveVisibleItems((snippet) => snippet === '*');
   * ```
   */
  resolveVisibleItems(allow?: HeaderActionAllow) {
    const items = this.getItems();
    if (!allow) {
      return items;
    }
    return items.filter((item) => allow(item.snippet));
  }

  /**
   * 按来源卸载注册记录。
   *
   * @param sourceId 注册来源标识
   * @returns void
   *
   * @example
   * ```ts
   * manager.unregisterBySource('provider-1');
   * ```
   */
  unregisterBySource(sourceId: string) {
    if (!sourceId) {
      return;
    }

    let changed = false;

    for (const [name, list] of this.registrations.entries()) {
      const nextList = list.filter((record) => record.sourceId !== sourceId);
      if (nextList.length === list.length) {
        continue;
      }

      if (nextList.length) {
        this.registrations.set(name, nextList);
      } else {
        this.registrations.delete(name);
        this.nameOrder.delete(name);
      }
      changed = true;
    }

    if (changed) {
      this.notifyChange();
    }
  }

  private normalizeItems(items: HeaderActionRegisterItem | HeaderActionRegisterItem[]) {
    return (Array.isArray(items) ? items : [items]).filter((item): item is HeaderActionRegisterItem => {
      return !!item?.name && typeof item?.componentLoader === 'function';
    });
  }

  private normalizeNames(names: string | string[]) {
    return (Array.isArray(names) ? names : [names]).filter(Boolean);
  }

  private resolveActiveRecord(list: HeaderActionRegistrationRecord[]) {
    return list.reduce<HeaderActionRegistrationRecord | null>((current, item) => {
      if (!current) {
        return item;
      }

      if (item.priority !== current.priority) {
        return item.priority > current.priority ? item : current;
      }

      return item.sequence > current.sequence ? item : current;
    }, null);
  }

  private sortItems(items: HeaderActionItem[]) {
    return [...items].sort((a, b) => {
      if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
        return a.order - b.order;
      }

      return (this.nameOrder.get(a.name) ?? 0) - (this.nameOrder.get(b.name) ?? 0);
    });
  }

  private notifyChange() {
    this.eventBus?.dispatchEvent(new Event(HEADER_ACTIONS_MANAGER_CHANGED));
  }
}
