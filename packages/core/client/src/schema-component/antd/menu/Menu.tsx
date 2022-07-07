import { css } from '@emotion/css';
import {
  observer,
  RecursionField,
  Schema,
  SchemaExpressionScopeContext,
  useField,
  useFieldSchema,
} from '@formily/react';
import { Menu as AntdMenu } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { createDesignable, DndContext, SortableItem, useDesignable, useDesigner } from '../..';
import { Icon, useAPIClient, useSchemaInitializer } from '../../../';
import { useProps } from '../../hooks/useProps';
import { MenuDesigner } from './Menu.Designer';
import { findKeysByUid, findMenuItem } from './util';

const subMenuDesignerCss = css`
  position: relative;
  display: inline-block;
  margin-left: -24px;
  margin-right: -34px;
  padding: 0 34px 0 24px;
  width: calc(100% + 58px);
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  &.nb-action-link {
    > .general-schema-designer {
      top: -10px;
      bottom: -10px;
      left: -10px;
      right: -10px;
    }
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: rgba(241, 139, 98, 0.06);
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

const designerCss = css`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: -20px;
  margin-right: -20px;
  padding: 0 20px;
  width: calc(100% + 40px);
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  &.nb-action-link {
    > .general-schema-designer {
      top: -10px;
      bottom: -10px;
      left: -10px;
      right: -10px;
    }
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: rgba(241, 139, 98, 0.06);
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

type ComposedMenu = React.FC<any> & {
  Item?: React.FC<any>;
  URL?: React.FC<any>;
  SubMenu?: React.FC<any>;
  Designer?: React.FC<any>;
};

const MenuModeContext = createContext(null);

const useSideMenuRef = () => {
  const schema = useFieldSchema();
  const scope = useContext(SchemaExpressionScopeContext);
  const scopeKey = schema?.['x-component-props']?.['sideMenuRefScopeKey'];
  if (!scopeKey) {
    return;
  }
  return scope[scopeKey];
};

const MenuItemDesignerContext = createContext(null);

export const Menu: ComposedMenu = observer((props) => {
  let {
    onSelect,
    mode,
    selectedUid,
    defaultSelectedUid,
    sideMenuRefScopeKey,
    defaultSelectedKeys: dSelectedKeys,
    defaultOpenKeys: dOpenKeys,
    ...others
  } = useProps(props);
  const { t } = useTranslation();
  const Designer = useDesigner();
  const schema = useFieldSchema();
  const { refresh } = useDesignable();
  const api = useAPIClient();
  const { render } = useSchemaInitializer(schema['x-initializer']);
  const sideMenuRef = useSideMenuRef();
  const [defaultSelectedKeys, setDefaultSelectedKeys] = useState(() => {
    if (dSelectedKeys) {
      return dSelectedKeys;
    }
    if (defaultSelectedUid) {
      return findKeysByUid(schema, defaultSelectedUid);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [defaultOpenKeys, setDefaultOpenKeys] = useState(() => {
    if (['inline', 'mix'].includes(mode)) {
      return dOpenKeys || defaultSelectedKeys;
    }
    return dOpenKeys;
  });
  const [sideMenuSchema, setSideMenuSchema] = useState<Schema>(() => {
    const key = defaultSelectedKeys?.[0] || null;
    if (mode === 'mix' && key) {
      const s = schema.properties?.[key];
      if (s['x-component'] === 'Menu.SubMenu') {
        return s;
      }
    }
    return null;
  });
  useEffect(() => {
    const keys = findKeysByUid(schema, selectedUid);
    setDefaultSelectedKeys(keys);
    if (['inline', 'mix'].includes(mode)) {
      setDefaultOpenKeys(dOpenKeys || keys);
    }
    const key = keys?.[0] || null;
    if (mode === 'mix') {
      if (key) {
        const s = schema.properties?.[key];
        if (s['x-component'] === 'Menu.SubMenu') {
          setSideMenuSchema(s);
        }
      } else {
        setSideMenuSchema(null);
      }
    }
  }, [selectedUid]);
  useEffect(() => {
    if (['inline', 'mix'].includes(mode)) {
      setDefaultOpenKeys(defaultSelectedKeys);
    }
  }, [defaultSelectedKeys]);
  useEffect(() => {
    const sideMenuElement = sideMenuRef?.current as HTMLElement;
    if (!sideMenuElement) {
      return;
    }
    sideMenuElement.style.display = sideMenuSchema?.['x-component'] === 'Menu.SubMenu' ? 'block' : 'none';
  }, [sideMenuSchema?.name, sideMenuRef]);
  const { designable } = useDesignable();
  return (
    <DndContext>
      <MenuItemDesignerContext.Provider value={Designer}>
        <MenuModeContext.Provider value={mode}>
          <AntdMenu
            {...others}
            style={
              {
                // width: mode === 'mix' ? '100%' : undefined,
              }
            }
            className={css`
              .ant-menu-item:hover {
                > .ant-menu-title-content > div {
                  .general-schema-designer {
                    display: block;
                  }
                }
              }
            `}
            onSelect={(info: any) => {
              const s = schema.properties[info.key];
              if (mode === 'mix') {
                setSideMenuSchema(s);
                if (s['x-component'] !== 'Menu.SubMenu') {
                  onSelect && onSelect(info);
                } else {
                  const menuItemSchema = findMenuItem(s);
                  if (!menuItemSchema) {
                    return;
                  }
                  // TODO
                  setLoading(true);
                  const keys = findKeysByUid(schema, menuItemSchema['x-uid']);
                  setDefaultSelectedKeys(keys);
                  setTimeout(() => {
                    setLoading(false);
                  }, 100);
                  onSelect &&
                    onSelect({
                      key: menuItemSchema.name,
                      item: {
                        props: {
                          schema: menuItemSchema,
                        },
                      },
                    });
                }
              } else {
                onSelect && onSelect(info);
              }
            }}
            mode={mode === 'mix' ? 'horizontal' : mode}
            defaultOpenKeys={defaultOpenKeys}
            defaultSelectedKeys={defaultSelectedKeys}
            selectedKeys={defaultSelectedKeys}
          >
            {designable && (
              <AntdMenu.Item disabled style={{ padding: '0 8px', order: 9999 }}>
                {render({ style: { background: 'none' } })}
              </AntdMenu.Item>
            )}
            {props.children}
          </AntdMenu>
          {loading
            ? null
            : mode === 'mix' &&
              sideMenuSchema?.['x-component'] === 'Menu.SubMenu' &&
              sideMenuRef?.current?.firstChild &&
              createPortal(
                <MenuModeContext.Provider value={'inline'}>
                  <AntdMenu
                    mode={'inline'}
                    defaultOpenKeys={defaultOpenKeys}
                    defaultSelectedKeys={defaultSelectedKeys}
                    onSelect={(info) => {
                      onSelect && onSelect(info);
                    }}
                    className={css`
                      .ant-menu-item {
                        > .ant-menu-title-content {
                          margin-left: -24px;
                          margin-right: -16px;
                          padding: 0 16px 0 24px;
                          > div {
                            > .general-schema-designer {
                              right: 6px !important;
                            }
                          }
                        }
                      }
                      .ant-menu-submenu-title {
                        .ant-menu-title-content {
                          margin-left: -24px;
                          margin-right: -34px;
                          padding: 0 34px 0 24px;
                          > div {
                            > .general-schema-designer {
                              right: 6px !important;
                            }
                            > span.anticon {
                              margin-right: 10px;
                            }
                          }
                        }
                      }
                    `}
                  >
                    <RecursionField schema={sideMenuSchema} onlyRenderProperties />
                    {render({
                      style: { margin: 8 },
                      insert: (s) => {
                        const dn = createDesignable({
                          t,
                          api,
                          refresh,
                          current: sideMenuSchema,
                        });
                        dn.loadAPIClientEvents();
                        dn.insertAdjacent('beforeEnd', s);
                      },
                    })}
                  </AntdMenu>
                </MenuModeContext.Provider>,
                sideMenuRef.current.firstChild,
              )}
        </MenuModeContext.Provider>
      </MenuItemDesignerContext.Provider>
    </DndContext>
  );
});

Menu.Item = observer((props) => {
  const { icon, ...others } = props;
  const schema = useFieldSchema();
  const field = useField();
  const Designer = useContext(MenuItemDesignerContext);
  return (
    <AntdMenu.Item
      {...others}
      className={css`
        :active {
          background: inherit;
        }
      `}
      key={schema.name}
      eventKey={schema.name}
      schema={schema}
    >
      <SortableItem className={designerCss}>
        <Icon type={icon} />
        <span
          className={css`
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            width: 100%;
            vertical-align: middle;
          `}
        >
          {field.title}
        </span>
        <Designer />
      </SortableItem>
    </AntdMenu.Item>
  );
});

Menu.URL = observer((props) => {
  const { icon, ...others } = props;
  const schema = useFieldSchema();
  const field = useField();
  const Designer = useContext(MenuItemDesignerContext);
  return (
    <AntdMenu.Item
      {...others}
      className={css`
        :active {
          background: inherit;
        }
      `}
      key={schema.name}
      eventKey={schema.name}
      schema={schema}
      onClick={() => {
        window.open(props.href, '_blank');
      }}
    >
      <SortableItem className={designerCss}>
        <Icon type={icon} />
        <span
          className={css`
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            width: 100%;
            vertical-align: middle;
          `}
        >
          {field.title}
        </span>
        <Designer />
      </SortableItem>
    </AntdMenu.Item>
  );
});

Menu.SubMenu = observer((props) => {
  const { icon, ...others } = props;
  const schema = useFieldSchema();
  const field = useField();
  const mode = useContext(MenuModeContext);
  const Designer = useContext(MenuItemDesignerContext);
  if (mode === 'mix') {
    return <Menu.Item {...props} />;
  }
  return (
    <AntdMenu.SubMenu
      {...others}
      className={css`
        :active {
          background: inherit;
        }
      `}
      key={schema.name}
      eventKey={schema.name}
      title={
        <SortableItem className={subMenuDesignerCss}>
          <Icon type={icon} />
          {field.title}
          <Designer />
        </SortableItem>
      }
    >
      <RecursionField schema={schema} onlyRenderProperties />
    </AntdMenu.SubMenu>
  );
});

Menu.Designer = MenuDesigner;
