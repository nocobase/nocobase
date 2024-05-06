/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Topo from '@hapi/topo';

export interface ToposortOptions extends Topo.Options {
  tag?: string;
}

export class Toposort<T> extends Topo.Sorter<T> {
  unshift(...items) {
    (this as any)._items.unshift(
      ...items.map((node) => ({
        node,
        seq: (this as any)._items.length,
        sort: 0,
        before: [],
        after: [],
        group: '?',
      })),
    );
  }

  push(...items) {
    (this as any)._items.push(
      ...items.map((node) => ({
        node,
        seq: (this as any)._items.length,
        sort: 0,
        before: [],
        after: [],
        group: '?',
      })),
    );
  }

  add(nodes: T | T[], options?: ToposortOptions): T[] {
    if (options?.tag) {
      // @ts-ignore
      options.group = options.tag;
    }
    return super.add(nodes, options);
  }
}

export default Toposort;
