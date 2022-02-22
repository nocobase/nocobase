import { ISchema, observer } from '@formily/react';
import { Button, Dropdown, Menu } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useDesignable } from '../schema-component/hooks';
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
    style,
    ...others
  } = props;
  let { insertAdjacent, findComponent, designable } = useDesignable();
  const [visible, setVisible] = useState(false);
  const insertSchema = (schema) => {
    if (props.insert) {
      props.insert(wrap(schema));
    } else {
      insertAdjacent(insertPosition, wrap(schema));
    }
  };
  const menu = (
    <Menu>
      {items?.map((item, indexA) => {
        if (item.type === 'divider') {
          return <Menu.Divider key={`item-${indexA}`} />;
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
                <Component {...item} item={item} insert={insertSchema} />
              </SchemaInitializerItemContext.Provider>
            )
          );
        }
        return (
          item?.children?.length > 0 && (
            <Menu.ItemGroup key={`item-group-${indexA}`} title={item.title}>
              {item?.children?.map((child, indexB) => {
                if (!child.component) {
                  return null;
                }
                const Component = findComponent(child.component);
                return (
                  Component && (
                    <SchemaInitializerItemContext.Provider
                      key={`item-${indexB}`}
                      value={{
                        index: indexB,
                        item: child,
                        info: child,
                        insert: insertSchema,
                      }}
                    >
                      <Component {...child} item={child} insert={insertSchema} />
                    </SchemaInitializerItemContext.Provider>
                  )
                );
              })}
            </Menu.ItemGroup>
          )
        );
      })}
    </Menu>
  );

  if (!designable) {
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
      <Button
        {...others}
        type={'dashed'}
        style={{
          ...style,
          borderColor: '#f18b62',
          color: '#f18b62',
        }}
      >
        {props.children || props.title}
      </Button>
    </Dropdown>
  );
});

SchemaInitializer.Item = (props: SchemaInitializerItemProps) => {
  const { index, info } = useContext(SchemaInitializerItemContext);
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
            // @ts-ignore
            <Menu.ItemGroup eventKey={`item-group-${indexA}`} key={`item-group-${indexA}`} title={item.title}>
              {renderMenuItem(item.children)}
            </Menu.ItemGroup>
          );
        }
        if (item.type === 'subMenu') {
          return (
            // @ts-ignore
            <Menu.SubMenu eventKey={`sub-menu-${indexA}`} key={`sub-menu-${indexA}`} title={item.title}>
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
            {item.title}
          </Menu.Item>
        );
      });
    };
    return (
      // @ts-ignore
      <Menu.SubMenu eventKey={index} key={index} title={children} icon={icon}>
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
      {children}
    </Menu.Item>
  );
};

SchemaInitializer.itemWrap = (component?: SchemaInitializerItemComponent) => {
  return component;
};
