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

  add(name: string, item: SchemaInitializerItemType) {
    const arr = name.split('.');
    const data = { ...item, name };
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
    const parentItem = this.get(parentName);
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
    const parent = this.get(arr.slice(0, -1).join('.'));
    if (parent && parent.children) {
      const name = arr[arr.length - 1];
      const index = parent.children.findIndex((item) => item.name === name);
      if (index !== -1) {
        parent.children.splice(index, 1);
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
