import { ButtonProps, ListProps } from 'antd';
import { ComponentType } from 'react';
import React from 'react';
import { ListItemProps } from 'antd/lib/list';
import { InitializerChildren } from './components/InitializerChildren';
import { SchemaInitializerOptions, SchemaInitializerListItemType } from './types';
import { InitializerButton } from './components/InitializerButton';
import { InitializerList } from './components/InitializerList';
import { withInitializer } from './hoc';

export class SchemaInitializerV2<P1 = ButtonProps, P2 = ListProps<any>, P3 = ListItemProps> {
  options: SchemaInitializerOptions<P1, P2, P3> = {};
  get list() {
    return this.options.list;
  }

  constructor(options: SchemaInitializerOptions<P1, P2, P3>) {
    this.options = Object.assign({ list: [] as any }, options);
  }

  update(options: SchemaInitializerOptions<P1, P2, P3>) {
    Object.assign(this.options, options);
  }

  add<P = {}>(item: SchemaInitializerListItemType<P>): void;
  add<P = {}>(parentName: string, item: SchemaInitializerListItemType<P>): void;
  add(...args: any[]) {
    if (args.length === 1 && typeof args[0] === 'object') {
      this.list.push(args[0]);
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
    let current: any = this.list;

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
    const parent = arr.length === 1 ? this.list : this.get(arr.slice(0, -1).join('.'));
    if (parent) {
      const key = arr[arr.length - 1];
      const index = parent.findIndex((item: any) => item.key === key);
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
    if (this.list.length === 0) return null;
    const C = options.ListComponent || this.options.ListComponent || InitializerList;
    const listProps = options.listProps || this.options.listProps || {};
    const listStyle = options.listStyle || this.options.listStyle || {};
    return (
      <C {...listProps} style={listStyle}>
        <InitializerChildren>{this.list}</InitializerChildren>
      </C>
    );
  }
}
