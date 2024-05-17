/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd';
import { SchemaInitializerItemType, SchemaInitializerItemTypeWithoutName, SchemaInitializerOptions } from './types';

export class SchemaInitializer<P1 = ButtonProps, P2 = {}> {
  options: SchemaInitializerOptions<P1, P2>;
  name: string;
  get items() {
    return this.options.items;
  }

  constructor(options: SchemaInitializerOptions<P1, P2>) {
    this.options = Object.assign({ items: [] }, options);
    this.name = options.name;
  }

  add(name: string, item: SchemaInitializerItemTypeWithoutName) {
    const arr = name.split('.');
    const itemName = arr[arr.length - 1];
    const data: any = { ...item, name: itemName };

    const pushData = (name: string, data: any) => {
      const index = this.items.findIndex((item: any) => item.name === name);
      if (index === -1) {
        this.items.push(data);
      } else {
        this.items[index] = data;
      }
    };

    if (arr.length === 1) {
      pushData(itemName, data);
      return;
    }

    const parentName = arr.slice(0, -1).join('.');
    const parentItem: any = this.get(parentName);
    if (parentItem) {
      if (!parentItem.children) {
        parentItem.children = [];
      }
      const childrenName = name.replace(`${parentItem.name}.`, '');
      const index = parentItem.children.findIndex((item: any) => item.name === childrenName);
      if (index === -1) {
        parentItem.children.push(data);
      } else {
        parentItem.children[index] = data;
      }

      // 这里是为了兼容这个改动：https://nocobase.feishu.cn/wiki/O7pjwSbBEigpOWkY9s5c03Yenkh
    } else {
      pushData(itemName, data);
    }
  }

  get(nestedName: string): SchemaInitializerItemType | undefined {
    if (!nestedName) return undefined;
    const arr = nestedName.split('.');
    let current: any = { children: this.items };

    for (let i = 0; i < arr.length; i++) {
      const name = arr[i];
      const _current = current.children?.find((item) => item.name === name);

      if (_current) {
        current = _current;
      }

      if (i === arr.length - 1) {
        return _current;
      }
    }
  }

  remove(nestedName: string) {
    const arr = nestedName.split('.');
    if (arr.length === 1) {
      const index = this.items.findIndex((item) => item.name === arr[0]);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
      return;
    }
    const parent: any = this.get(arr.slice(0, -1).join('.'));
    if (parent && parent.children) {
      const name = arr[arr.length - 1];
      const index = parent.children.findIndex((item) => item.name === name);
      if (index !== -1) {
        parent.children.splice(index, 1);
      }
    }
  }
}
