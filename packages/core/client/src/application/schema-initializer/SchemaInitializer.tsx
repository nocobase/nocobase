import { ButtonProps, ListProps } from 'antd';
import { ComponentType } from 'react';
import React from 'react';
import { InitializerChildren } from './components/InitializerChildren';
import { SchemaInitializerOptions, SchemaInitializerItemType } from './types';
import { InitializerButton } from './components/InitializerButton';
import { InitializerList } from './components/InitializerList';
import { withInitializer } from './hoc';
import { ListItemProps } from 'antd/es/list';

export class SchemaInitializerV2<P1 = ButtonProps, P2 = ListProps<any>, P3 = ListItemProps> {
  options: SchemaInitializerOptions<P1, P2, P3> = {};
  get items() {
    return this.options.items;
  }

  constructor(options: SchemaInitializerOptions<P1, P2, P3>) {
    this.options = Object.assign({ items: [] as any }, options);
  }

  update(options: SchemaInitializerOptions<P1, P2, P3>) {
    Object.assign(this.options, options);
  }

  add<P = {}>(item: SchemaInitializerItemType): void;
  add<P = {}>(parentName: string, item: SchemaInitializerItemType): void;
  add(...args: any[]) {
    if (args.length === 1 && typeof args[0] === 'object') {
      this.items.push(args[0]);
    } else {
      const [parentName, item] = args;
      const parentItem = this.get(parentName);
      if (parentItem) {
        if (!parentItem.children) {
          parentItem.children = [];
        }
        parentItem.children.push(item);
      }
    }
  }

  get(nestedName: string) {
    const arr = nestedName.split('.');
    let current: any = this.items;

    for (let i = 0; i < arr.length; i++) {
      const name = arr[i];
      current = current.find((item: any) => item.name === name);
      if (!current || i === arr.length - 1) {
        return current;
      }

      if (current.children) {
        current = current.children;
      } else {
        return undefined;
      }
    }
  }

  remove(nestedName: string) {
    const arr = nestedName.split('.');
    const parent = arr.length === 1 ? this.items : this.get(arr.slice(0, -1).join('.'));
    if (parent) {
      const name = arr[arr.length - 1];
      const index = parent.findIndex((item: any) => item.name === name);
      if (index !== -1) {
        parent.splice(index, 1);
      }
    }
  }

  render(options: SchemaInitializerOptions<P1, P2, P3> = {}) {
    const C: ComponentType = options.Component || this.options.Component || InitializerButton;
    return React.createElement(
      withInitializer(C),
      {
        ...this.options,
        ...options,
      },
      this.renderList(options),
    );
  }

  getRender(options1: SchemaInitializerOptions<P1, P2, P3> = {}) {
    return (options2: SchemaInitializerOptions<P1, P2, P3> = {}) => this.render({ ...options1, ...options2 });
  }

  private renderList(options: SchemaInitializerOptions<P1, P2, P3> = {}) {
    if (this.items.length === 0) return null;
    const C = options.ListComponent || this.options.ListComponent || InitializerList;
    const listProps = options.listProps || this.options.listProps || {};
    const listStyle = options.listStyle || this.options.listStyle || {};
    return (
      <C {...listProps} style={listStyle}>
        <InitializerChildren>{this.items}</InitializerChildren>
      </C>
    );
  }
}
