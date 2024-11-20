/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import {
  FieldContext,
  observer,
  RecursionField,
  SchemaContext,
  SchemaExpressionScopeContext,
  useField,
  useFieldSchema,
} from '@formily/react';
import { uid } from '@formily/shared';
import { error } from '@nocobase/utils/client';
import { Menu as AntdMenu, MenuProps } from 'antd';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { createDesignable, DndContext, SortableItem, useDesignable, useDesigner } from '../..';
import { Icon, useAPIClient, useParseURLAndParams, useSchemaInitializerRender } from '../../../';
import { useCollectMenuItems, useMenuItem } from '../../../hooks/useMenuItem';
import { useProps } from '../../hooks/useProps';
import { useMenuTranslation } from './locale';
import { MenuDesigner } from './Menu.Designer';
import { findKeysByUid, findMenuItem } from './util';

import React, {
  createContext,
  // @ts-ignore
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const subMenuDesignerCss = css`
  position: relative;
  display: inline-block;
  margin-left: -24px;
  margin-right: -34px;
  padding: 0 34px 0 24px;
  width: calc(100% + 58px);
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
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
    background: var(--colorBgSettingsHover);
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
        align-self: stretch;
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
  height: 100%;
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
    background: var(--colorBgSettingsHover);
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
        align-self: stretch;
      }
    }
  }
`;

const headerMenuClass = css`
  .ant-menu-item:hover {
    > .ant-menu-title-content > div {
      .general-schema-designer {
        display: block;
      }
    }
  }
`;

const sideMenuClass = css`
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  .ant-menu-item {
    > .ant-menu-title-content {
      height: 100%;
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
      height: 100%;
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
`;

const menuItemClass = css`
  :active {
    background: inherit;
  }
`;

type ComposedMenu = React.FC<any> & {
  Item?: React.FC<any>;
  URL?: React.FC<any>;
  SubMenu?: React.FC<any>;
  Designer?: React.FC<any>;
};

const HeaderMenu = ({
  others,
  schema,
  mode,
  onSelect,
  setLoading,
  setDefaultSelectedKeys,
  defaultSelectedKeys,
  defaultOpenKeys,
  selectedKeys,
  designable,
  render,
  children,
}) => {
  const { Component, getMenuItems } = useMenuItem();
  const items = useMemo(() => {
    const designerBtn = {
      key: 'x-designer-button',
      style: { padding: '0 8px', order: 9999 },
      label: render({
        'data-testid': 'schema-initializer-Menu-header',
        style: { background: 'none' },
      }),
      notdelete: true,
      disabled: true,
    };
    const result = getMenuItems(() => {
      return children;
    });
    if (designable) {
      result.push(designerBtn);
    }

    return result;
  }, [children, designable]);

  const handleSelect = useCallback(
    (info: { item; key; keyPath; domEvent }) => {
      startTransition(() => {
        const s = schema.properties?.[info.key];

        if (!s) {
          return;
        }

        if (mode === 'mix') {
          if (s['x-component'] !== 'Menu.SubMenu') {
            onSelect?.(info);
          } else {
            const menuItemSchema = findMenuItem(s);
            if (!menuItemSchema) {
              return onSelect?.(info);
            }
            // TODO
            setLoading(true);
            const keys = findKeysByUid(schema, menuItemSchema['x-uid']);
            setDefaultSelectedKeys(keys);
            setTimeout(() => {
              setLoading(false);
            }, 100);
            onSelect?.({
              key: menuItemSchema.name,
              item: {
                props: {
                  schema: menuItemSchema,
                },
              },
            });
          }
        } else {
          onSelect?.(info);
        }
      });
    },
    [schema, mode, onSelect, setLoading, setDefaultSelectedKeys],
  );
  return (
    <>
      <Component />
      <AntdMenu
        {...others}
        className={headerMenuClass}
        onClick={handleSelect}
        mode={mode === 'mix' ? 'horizontal' : mode}
        defaultOpenKeys={defaultOpenKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        selectedKeys={selectedKeys}
        items={items}
      />
    </>
  );
};

const SideMenu = ({
  loading,
  mode,
  sideMenuSchema,
  sideMenuRef,
  openKeys,
  setOpenKeys,
  selectedKeys,
  onSelect,
  render,
  t,
  api,
  refresh,
  designable,
}) => {
  const { Component, getMenuItems } = useMenuItem();

  // 使用 ref 用来防止闭包问题
  const sideMenuSchemaRef = useRef(sideMenuSchema);
  sideMenuSchemaRef.current = sideMenuSchema;

  const handleSelect = useCallback(
    (info) => {
      startTransition(() => {
        onSelect?.(info);
      });
    },
    [onSelect],
  );

  const items = useMemo(() => {
    const result = getMenuItems(() => {
      return <RecursionField key={uid()} schema={sideMenuSchema} onlyRenderProperties />;
    });

    if (designable) {
      result.push({
        key: 'x-designer-button',
        disabled: true,
        label: render({
          'data-testid': 'schema-initializer-Menu-side',
          insert: (s) => {
            const dn = createDesignable({
              t,
              api,
              refresh,
              current: sideMenuSchemaRef.current,
            });
            dn.loadAPIClientEvents();
            dn.insertAdjacent('beforeEnd', s);
          },
        }),
        order: 1,
        notdelete: true,
      });
    }

    return result;
  }, [getMenuItems, designable, sideMenuSchema, render, t, api, refresh]);

  if (loading) {
    return null;
  }

  return (
    mode === 'mix' &&
    sideMenuSchema?.['x-component'] === 'Menu.SubMenu' &&
    sideMenuRef?.current?.firstChild &&
    createPortal(
      <MenuModeContext.Provider value={'inline'}>
        <Component />
        <AntdMenu
          mode={'inline'}
          openKeys={openKeys}
          selectedKeys={selectedKeys}
          onClick={handleSelect}
          onOpenChange={setOpenKeys}
          className={sideMenuClass}
          items={items as MenuProps['items']}
        />
      </MenuModeContext.Provider>,
      sideMenuRef.current.firstChild,
    )
  );
};

const MenuModeContext = createContext(null);
MenuModeContext.displayName = 'MenuModeContext';

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
MenuItemDesignerContext.displayName = 'MenuItemDesignerContext';

export const Menu: ComposedMenu = observer(
  (props) => {
    const {
      onSelect,
      mode,
      selectedUid,
      defaultSelectedUid,
      sideMenuRefScopeKey,
      defaultSelectedKeys: dSelectedKeys,
      defaultOpenKeys: dOpenKeys,
      children,
      ...others
    } = useProps(props);
    const { t } = useTranslation();
    const Designer = useDesigner();
    const schema = useFieldSchema();
    const { refresh } = useDesignable();
    const api = useAPIClient();
    const { render } = useSchemaInitializerRender(schema['x-initializer'], schema['x-initializer-props']);
    const sideMenuRef = useSideMenuRef();
    const [selectedKeys, setSelectedKeys] = useState<string[]>();
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

    const sideMenuSchema = useMemo(() => {
      let key;

      if (selectedUid) {
        const keys = findKeysByUid(schema, selectedUid);
        key = keys?.[0] || null;
      } else {
        key = defaultSelectedKeys?.[0] || null;
      }

      if (mode === 'mix' && key) {
        const s = schema.properties?.[key];
        // fix T-934
        if (s?.['x-component'] === 'Menu.SubMenu') {
          return s;
        }
      }
      return null;
    }, [defaultSelectedKeys, mode, schema, selectedUid]);

    useEffect(() => {
      if (!selectedUid) {
        setSelectedKeys(undefined);
        return;
      }

      const keys = findKeysByUid(schema, selectedUid);
      setSelectedKeys(keys);
      if (['inline', 'mix'].includes(mode)) {
        setDefaultOpenKeys(dOpenKeys || keys);
      }
    }, [selectedUid]);
    useEffect(() => {
      if (['inline', 'mix'].includes(mode)) {
        setDefaultOpenKeys(defaultSelectedKeys);
      }
    }, [defaultSelectedKeys]);
    const { designable } = useDesignable();
    return (
      <DndContext>
        <MenuItemDesignerContext.Provider value={Designer}>
          <MenuModeContext.Provider value={mode}>
            <HeaderMenu
              others={others}
              schema={schema}
              mode={mode}
              onSelect={onSelect}
              setLoading={setLoading}
              setDefaultSelectedKeys={setDefaultSelectedKeys}
              defaultSelectedKeys={defaultSelectedKeys}
              defaultOpenKeys={defaultOpenKeys}
              selectedKeys={selectedKeys}
              designable={designable}
              render={render}
            >
              {children}
            </HeaderMenu>
            <SideMenu
              loading={loading}
              mode={mode}
              sideMenuSchema={sideMenuSchema}
              sideMenuRef={sideMenuRef}
              openKeys={defaultOpenKeys}
              setOpenKeys={setDefaultOpenKeys}
              selectedKeys={selectedKeys}
              onSelect={onSelect}
              render={render}
              t={t}
              api={api}
              refresh={refresh}
              designable={designable}
            />
          </MenuModeContext.Provider>
        </MenuItemDesignerContext.Provider>
      </DndContext>
    );
  },
  { displayName: 'Menu' },
);

const menuItemTitleStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'inline-block',
  width: '100%',
  verticalAlign: 'middle',
};

Menu.Item = observer(
  (props) => {
    const { t } = useMenuTranslation();
    const { designable } = useDesignable();
    const { pushMenuItem } = useCollectMenuItems();
    const { icon, children, hidden, ...others } = props;
    const schema = useFieldSchema();
    const field = useField();
    const Designer = useContext(MenuItemDesignerContext);
    const item = useMemo(() => {
      return {
        ...others,
        hidden: designable ? false : hidden,
        className: menuItemClass,
        key: schema.name,
        eventKey: schema.name,
        schema,
        label: (
          <SchemaContext.Provider value={schema}>
            <FieldContext.Provider value={field}>
              <SortableItem
                role="button"
                aria-label={t(field.title)}
                className={designerCss}
                removeParentsIfNoChildren={false}
              >
                <Icon type={icon} />
                <span style={menuItemTitleStyle}>{t(schema.title)}</span>
                <Designer />
              </SortableItem>
            </FieldContext.Provider>
          </SchemaContext.Provider>
        ),
      };
    }, [schema.title, icon, schema, Designer]);

    if (!pushMenuItem) {
      error('Menu.Item must be wrapped by GetMenuItemsContext.Provider');
      return null;
    }

    pushMenuItem(item);
    return null;
  },
  { displayName: 'Menu.Item' },
);

const MenuURLButton = ({ href, params, icon }) => {
  const field = useField();
  const { t } = useMenuTranslation();
  const Designer = useContext(MenuItemDesignerContext);
  const { parseURLAndParams } = useParseURLAndParams();
  const urlRef = useRef(href);

  useEffect(() => {
    const run = async () => {
      try {
        urlRef.current = await parseURLAndParams(href, params || []);
      } catch (err) {
        console.error(err);
        urlRef.current = href;
      }
    };
    run();
  }, [href, JSON.stringify(params), parseURLAndParams]);

  return (
    <SortableItem
      className={designerCss}
      onClick={(event) => {
        window.open(urlRef.current, '_blank');
        event.preventDefault();
        event.stopPropagation();
      }}
      removeParentsIfNoChildren={false}
      aria-label={t(field.title)}
    >
      <Icon type={icon} />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'inline-block',
          width: '100%',
          verticalAlign: 'middle',
        }}
      >
        {t(field.title)}
      </span>
      <Designer />
    </SortableItem>
  );
};

Menu.URL = observer(
  (props) => {
    const { pushMenuItem } = useCollectMenuItems();
    const { designable } = useDesignable();
    const { icon, children, hidden, ...others } = props;
    const schema = useFieldSchema();
    const field = useField();
    const Designer = useContext(MenuItemDesignerContext);

    if (!pushMenuItem) {
      error('Menu.URL must be wrapped by GetMenuItemsContext.Provider');
      return null;
    }

    const item = useMemo(() => {
      return {
        ...others,
        hidden: designable ? false : hidden,
        className: menuItemClass,
        key: schema.name,
        eventKey: schema.name,
        schema,
        onClick: () => {},
        label: (
          <SchemaContext.Provider value={schema}>
            <FieldContext.Provider value={field}>
              <MenuURLButton icon={icon} href={props.href} params={props.params} />
            </FieldContext.Provider>
          </SchemaContext.Provider>
        ),
      };
    }, [field.title, designable, hidden, icon, props.href, schema, JSON.stringify(props.params)]);

    pushMenuItem(item);
    return null;
  },
  { displayName: 'MenuURL' },
);

Menu.SubMenu = observer(
  (props) => {
    const { t } = useMenuTranslation();
    const { designable } = useDesignable();
    const { Component, getMenuItems } = useMenuItem();
    const { pushMenuItem } = useCollectMenuItems();
    const { icon, children, hidden, ...others } = props;
    const schema = useFieldSchema();
    const field = useField();
    const mode = useContext(MenuModeContext);
    const Designer = useContext(MenuItemDesignerContext);
    const submenu = useMemo(() => {
      return {
        ...others,
        hidden: designable ? false : hidden,
        className: menuItemClass,
        key: schema.name,
        eventKey: schema.name,
        label: (
          <SchemaContext.Provider value={schema}>
            <FieldContext.Provider value={field}>
              <SortableItem
                className={subMenuDesignerCss}
                removeParentsIfNoChildren={false}
                aria-label={t(field.title)}
              >
                <Icon type={icon} />
                {t(field.title)}
                <Designer />
              </SortableItem>
            </FieldContext.Provider>
          </SchemaContext.Provider>
        ),
        children: getMenuItems(() => {
          return <RecursionField schema={schema} onlyRenderProperties />;
        }),
      };
    }, [field.title, icon, schema, children, Designer]);

    if (!pushMenuItem) {
      error('Menu.SubMenu must be wrapped by GetMenuItemsContext.Provider');
      return null;
    }

    if (mode === 'mix') {
      return <Menu.Item {...props} />;
    }

    pushMenuItem(submenu);
    return <Component />;
  },
  { displayName: 'Menu.SubMenu' },
);

Menu.Designer = MenuDesigner;
