import { ButtonProps } from 'antd';
import { ComponentType } from 'react';
import React from 'react';
import { SchemaInitializerOptions, SchemaInitializerItemType } from './types';
import { SchemaInitializerButton } from './components/SchemaInitializerButton';
import { SchemaInitializerItems } from './components/SchemaInitializerItems';
import { withInitializer } from './hoc';

export class SchemaInitializer<P1 = ButtonProps, P2 = {}> {
  options: SchemaInitializerOptions<P1, P2>;
  name: string;
  get items() {
    return this.options.items;
  }

  constructor(options: SchemaInitializerOptions<P1, P2> & { name: string }) {
    this.options = Object.assign({ items: [] }, options);
    this.name = options.name;
  }

  add(name: string, item: SchemaInitializerItemType) {
    const arr = name.split('.');
    const data = { ...item, name: arr[arr.length - 1] };
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

  render(options: SchemaInitializerOptions<P1, P2> = {}) {
    const C: ComponentType = options.Component || this.options.Component || SchemaInitializerButton;
    const componentProps = Object.assign({}, this.options.componentProps, options.componentProps, {
      options: {
        ...this.options,
        ...options,
      },
      style: {
        ...this.options.style,
        ...options.style,
      },
    });
    return React.createElement(
      withInitializer(C, componentProps),
      {
        ...this.options,
        ...options,
      },
      this.renderItems(options),
    );
  }

  getRender(options1: SchemaInitializerOptions<P1, P2> = {}) {
    return (options2: SchemaInitializerOptions<P1, P2> = {}) => this.render({ ...options1, ...options2 });
  }

  private renderItems(options: SchemaInitializerOptions<P1, P2> = {}) {
    const C: ComponentType<any> = options.ItemsComponent || this.options.ItemsComponent || SchemaInitializerItems;
    const mergedOptions = Object.assign({}, this.options, options);
    const itemsComponentProps = Object.assign({}, options.itemsComponentProps || this.options.itemsComponentProps, {
      options: mergedOptions,
      items: this.items,
      style: options.itemsComponentStyle || this.options.itemsComponentStyle || {},
    });
    return <C {...itemsComponentProps}></C>;
  }
}
