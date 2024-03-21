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
    const data: any = { ...item, name: arr[arr.length - 1] };
    if (arr.length === 1) {
      const index = this.items.findIndex((item: any) => item.name === name);
      if (index === -1) {
        this.items.push(data);
      } else {
        this.items[index] = data;
      }
      return;
    }

    const parentName = arr.slice(0, -1).join('.');
    const parentItem: any = this.get(parentName);
    if (parentItem) {
      if (!parentItem.children) {
        parentItem.children = [];
      }
      const index = parentItem.children.findIndex((item: any) => item.name === name);
      if (index === -1) {
        parentItem.children.push(data);
      } else {
        parentItem.children[index] = data;
      }
    }
  }

  get(nestedName: string): SchemaInitializerItemType | undefined {
    const arr = nestedName.split('.');
    let current: any = this.items;

    for (let i = 0; i < arr.length; i++) {
      const name = arr[i];
      current = current.find((item) => item.name === name);
      if (!current || i === arr.length - 1) {
        return current;
      }

      if (current.children) {
        current = current.children;
      } else {
        return undefined;
      }
    }

    return current;
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
