import { ISchema, observer } from '@formily/react';
import { Button, Dropdown, Menu } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useCompile, useDesignable } from '../schema-component/hooks';
import { initializes, items } from './Initializers';
import {
  SchemaInitializerButtonProps,
  SchemaInitializerItemComponent,
  SchemaInitializerItemOptions,
  SchemaInitializerItemProps
} from './types';

const defaultWrap = (s: ISchema) => s;

export const SchemaInitializerItemContext = createContext(null);

export const SchemaInitializer = () => null;

SchemaInitializer.items = items;

SchemaInitializer.initializes = initializes;

SchemaInitializer.Button = observer((props: SchemaInitializerButtonProps) => {
  const {
    title,
    insert,
    wrap = defaultWrap,
    items = [],
    insertPosition = 'beforeEnd',
    dropdown,
    component,
    style,
    ...others
  } = props;
  const compile = useCompile();
  let { insertAdjacent, findComponent, designable } = useDesignable();
  const [visible, setVisible] = useState(false);
  const insertSchema = (schema) => {
    if (props.insert) {
      props.insert(wrap(schema));
    } else {
      insertAdjacent(insertPosition, wrap(schema));
    }
  };
  const renderItems = (items: any) => {
    return items?.map((item, indexA) => {
      if (item.type === 'divider') {
        return <Menu.Divider key={item.key || `item-${indexA}`} />;
      }
      if (item.type === 'item' && item.component) {
        const Component = findComponent(item.component);
        return (
          Component && (
            <SchemaInitializerItemContext.Provider
              key={`item-${indexA}`}
              value={{
                index: indexA,
                item,
                info: item,
                insert: insertSchema,
              }}
            >
              <Component
                {...item}
                item={{
                  ...item,
                  title: compile(item.title),
                }}
                insert={insertSchema}
              />
            </SchemaInitializerItemContext.Provider>
          )
        );
      }
      if (item.type === 'itemGroup') {
        return (
          <Menu.ItemGroup key={item.key || `item-group-${indexA}`} title={compile(item.title)}>
            {renderItems(item.children)}
          </Menu.ItemGroup>
        );
      }
      if (item.type === 'subMenu') {
        return (
          <Menu.SubMenu key={item.key || `item-group-${indexA}`} title={compile(item.title)}>
            {renderItems(item.children)}
          </Menu.SubMenu>
        );
      }
    });
  };

  const menu = <Menu>{renderItems(items)}</Menu>;

  if (!designable && props.designable !== true) {
    return null;
  }

  return (
    <Dropdown
      visible={visible}
      onVisibleChange={(visible) => {
        setVisible(visible);
      }}
      {...dropdown}
      overlay={menu}
    >
      {component ? (
        component
      ) : (
        <Button
          type={'dashed'}
          style={{
            borderColor: '#f18b62',
            color: '#f18b62',
            ...style,
          }}
          {...others}
        >
          {compile(props.children || props.title)}
        </Button>
      )}
    </Dropdown>
  );
});

SchemaInitializer.Item = (props: SchemaInitializerItemProps) => {
  const { index, info } = useContext(SchemaInitializerItemContext);
  const compile = useCompile();
  const { items = [], children = info?.title, icon, onClick, ...others } = props;
  if (items?.length > 0) {
    const renderMenuItem = (items: SchemaInitializerItemOptions[]) => {
      if (!items?.length) {
        return null;
      }
      return items.map((item, indexA) => {
        if (item.type === 'divider') {
          return <Menu.Divider key={`divider-${indexA}`} />;
        }
        if (item.type === 'itemGroup') {
          return (
            <Menu.ItemGroup
              // @ts-ignore
              eventKey={item.key || `item-group-${indexA}`}
              key={item.key || `item-group-${indexA}`}
              title={compile(item.title)}
            >
              {renderMenuItem(item.children)}
            </Menu.ItemGroup>
          );
        }
        if (item.type === 'subMenu') {
          return (
            <Menu.SubMenu
              // @ts-ignore
              eventKey={item.key || `sub-menu-${indexA}`}
              key={item.key || `sub-menu-${indexA}`}
              title={compile(item.title)}
            >
              {renderMenuItem(item.children)}
            </Menu.SubMenu>
          );
        }
        return (
          <Menu.Item
            eventKey={item.key}
            key={item.key}
            onClick={(info) => {
              onClick({ ...info, item });
            }}
          >
            {compile(item.title)}
          </Menu.Item>
        );
      });
    };
    return (
      // @ts-ignore
      <Menu.SubMenu eventKey={index} key={index} title={compile(children)} icon={icon}>
        {renderMenuItem(items)}
      </Menu.SubMenu>
    );
  }
  return (
    <Menu.Item
      eventKey={index}
      icon={icon}
      onClick={(opts) => {
        onClick({ ...opts, item: info });
      }}
      {...others}
    >
      {compile(children)}
    </Menu.Item>
  );
};

SchemaInitializer.itemWrap = (component?: SchemaInitializerItemComponent) => {
  return component;
};
