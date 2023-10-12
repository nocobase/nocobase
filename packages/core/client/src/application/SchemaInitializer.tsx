import { Button, ButtonProps, DropDownProps, Dropdown, ListProps, Menu, MenuProps, Space } from 'antd';
import { ComponentType, FC, ReactNode, createContext, useCallback } from 'react';
import { ISchema, observer } from '@formily/react';
import { useCompile, useDesignable, useFindComponent } from '../schema-component';
import React from 'react';
import classNames from 'classnames';
import { Icon } from '../icon';
import { ListItemProps } from 'antd/lib/list';

export type InsertType = (s: ISchema) => void;

export type SchemaInitializerListItemType<P = {}> = P & {
  name: string;
  /**
   * default: 0
   * 值越小，排序越靠前
   */
  sort?: number;
  type?: 'itemGroup' | 'itemMenu' | 'item';
  Component?: string | ComponentType<P & { name?: string; insert?: InsertType }>;
  children?: SchemaInitializerListItemType[];
  [index: string]: any;
};

export interface SchemaInitializerOptions<P1 = ButtonProps, P2 = ListProps<any>, P3 = ListItemProps> {
  title?: string;
  insertPosition?: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';

  Component?: ComponentType<SchemaInitializerOptions<P1, P2, P3>>;
  componentProps?: P1;
  componentStyle?: React.CSSProperties;
  style?: React.CSSProperties;

  ListComponent?: ComponentType<SchemaInitializerOptions<P1, P2, P3>>;
  listProps?: P2;
  listStyle?: React.CSSProperties;

  dropdownProps?: DropDownProps;
  designable?: boolean;
  wrap?: (s: ISchema) => ISchema;
  insert?: InsertType;
  onSuccess?: (data: any) => void;
  list?: SchemaInitializerListItemType[];
  icon?: ReactNode;
  'data-testid'?: string;
  [index: string]: any;
}

export const SchemaInitializerV2Context = createContext<{ insert: InsertType }>({} as any);
SchemaInitializerV2Context.displayName = 'SchemaInitializerV2Context';
export const useSchemaInitializerV2 = () => {
  return React.useContext(SchemaInitializerV2Context);
};
const defaultWrap = (s: ISchema) => s;

export function withInitializer(C: ComponentType<SchemaInitializerOptions>) {
  const WithInitializer = observer((props: SchemaInitializerOptions) => {
    const { designable, insertAdjacent } = useDesignable();
    const { insert, wrap = defaultWrap, insertPosition = 'beforeEnd', onSuccess, designable: propsDesignable } = props;

    // designable 为 false 时，不渲染
    if (!designable && propsDesignable !== true) {
      return null;
    }

    // 插入 schema 的能力
    const insertSchema = useCallback(
      (schema) => {
        if (insert) {
          insert(wrap(schema));
        } else {
          insertAdjacent(insertPosition, wrap(schema), { onSuccess });
        }
      },
      [insert, wrap, insertAdjacent, insertPosition, onSuccess],
    );

    return (
      <SchemaInitializerV2Context.Provider value={{ insert: insertSchema }}>
        <C {...props} />
      </SchemaInitializerV2Context.Provider>
    );
  });

  WithInitializer.displayName = `WithInitializer(${C.displayName || C.name})`;
  return WithInitializer;
}

export const InitializerButton: FC<SchemaInitializerOptions> = (props) => {
  const { title, icon, dropdownProps, componentProps, componentStyle, style, children } = props;
  const compile = useCompile();

  return (
    <Dropdown
      className={classNames('nb-schema-initializer-button')}
      openClassName={`nb-schema-initializer-button-open`}
      {...dropdownProps}
      dropdownRender={() => <>{children}</>}
    >
      <Button
        type={'dashed'}
        data-testid={props['data-testid']}
        style={{
          borderColor: 'var(--colorSettings)',
          color: 'var(--colorSettings)',
          ...componentStyle,
          ...style,
        }}
        {...componentProps}
        icon={typeof icon === 'string' ? <Icon type={icon as string} /> : icon}
      >
        {compile(title)}
      </Button>
    </Dropdown>
  );
};

export const RenderChildren: FC<{ children: SchemaInitializerOptions['list'] }> = (props) => {
  const { children } = props;
  const { insert } = useSchemaInitializerV2();
  const findComponent = useFindComponent();
  return (
    <>
      {children
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item) => {
          const { children, type, sort: _unUse, name, Component, ...others } = item;
          const C = type === 'itemGroup' ? InitializerGroup : findComponent(Component);
          return React.createElement(C, { key: name, name, insert, ...others }, children);
        })}
    </>
  );
};

export const InitializerList: FC<SchemaInitializerOptions> = (props) => {
  const { listProps, listStyle, children } = props;
  return (
    <Space direction="vertical" size={'middle' as any} {...listProps} style={{ display: 'flex', ...listStyle }}>
      {children}
    </Space>
  );
};

export const InitializerListItem: FC<SchemaInitializerOptions> = (props) => {
  const { style, children, ...others } = props;
  return (
    <div style={{ paddingLeft: 24, ...style }} {...others}>
      {children}
    </div>
  );
};

export const InitializerGroup: FC<{ title: string; children: SchemaInitializerOptions['list']; name: string }> = (
  props,
) => {
  const { children, title } = props;
  const compile = useCompile();
  return (
    <div>
      <div className="ant-dropdown-menu-item-group-title">{compile(title)}</div>
      <RenderChildren>{children}</RenderChildren>
    </div>
  );
};

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
        <RenderChildren>{this.list}</RenderChildren>
      </C>
    );
  }
}
