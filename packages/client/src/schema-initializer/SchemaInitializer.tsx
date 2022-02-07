import { observer, Schema } from '@formily/react';
import { useDesignable } from '@nocobase/client';
import { Button, Dropdown, Menu } from 'antd';
import React, { createContext, useContext, useState } from 'react';

const defaultWrap = (s: Schema) => s;

export const SchemaInitializerItemContext = createContext(null);

export const SchemaInitializer = () => null;

SchemaInitializer.Button = observer((props: any) => {
  const { wrap = defaultWrap, items = [], insertPosition, dropdown, ...others } = props;
  const { insertAdjacent, findComponent } = useDesignable();

  const menu = (
    <Menu>
      {items?.map((item, indexA) => {
        if (item.type === 'divider') {
          return <Menu.Divider key={`item-${indexA}`} />;
        }
        if (item.component) {
          const Component = findComponent(item.component);
          return (
            Component && (
              <SchemaInitializerItemContext.Provider
                key={`item-${indexA}`}
                value={{
                  index: indexA,
                  item,
                  info: item,
                  insert: (schema) => {
                    insertAdjacent(insertPosition, wrap(schema));
                  },
                }}
              >
                <Component
                  {...item}
                  insert={(schema) => {
                    insertAdjacent(insertPosition, wrap(schema));
                  }}
                />
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
                        insert: (schema) => {
                          insertAdjacent(insertPosition, wrap(schema));
                        },
                      }}
                    >
                      <Component
                        {...child}
                        insert={(schema) => {
                          insertAdjacent(insertPosition, wrap(schema));
                        }}
                      />
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
  const [visible, setVisible] = useState(false);

  return (
    <Dropdown
      visible={visible}
      onVisibleChange={(visible) => {
        setVisible(visible);
      }}
      {...dropdown}
      overlay={menu}
    >
      <Button {...others} />
    </Dropdown>
  );
});

SchemaInitializer.Item = (props) => {
  const { items = [], children, icon, onClick, ...others } = props;
  const { index, info } = useContext(SchemaInitializerItemContext);
  if (items?.length > 0) {
    const renderMenuItem = (items) => {
      if (!items?.length) {
        return null;
      }
      return items.map((item, indexA) => {
        if (item.type === 'itemGroup') {
          return (
            <Menu.ItemGroup eventKey={indexA} key={indexA} title={item.title}>
              {renderMenuItem(item.children)}
            </Menu.ItemGroup>
          );
        }
        if (item.type === 'subMenu') {
          return (
            // @ts-ignore
            <Menu.SubMenu eventKey={indexA} key={indexA} title={item.title}>
              {renderMenuItem(item.children)}
            </Menu.SubMenu>
          );
        }
        return (
          <Menu.Item eventKey={item.key} key={item.key} onClick={onClick}>
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
    <Menu.Item eventKey={info.key || index} icon={icon} onClick={onClick} {...others}>
      {children}
    </Menu.Item>
  );
};
