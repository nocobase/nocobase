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
import { createDesignable, DndContext, SchemaComponentContext, SortableItem, useDesignable, useDesigner } from '../..';
import {
  Icon,
  NocoBaseRecursionField,
  useAllAccessDesktopRoutes,
  useAPIClient,
  useParseURLAndParams,
  useSchemaInitializerRender,
} from '../../../';
import { useCollectMenuItems, useMenuItem } from '../../../hooks/useMenuItem';
import { useProps } from '../../hooks/useProps';
import { useMenuTranslation } from './locale';
import { MenuDesigner } from './Menu.Designer';
import { findKeysByUid, findMenuItem } from './util';

import { useUpdate } from 'ahooks';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRefreshComponent, useRefreshFieldSchema } from '../../../formily/NocoBaseRecursionField';
import { NocoBaseDesktopRoute } from '../../../route-switch/antd/admin-layout/convertRoutesToSchema';
import { withTooltipComponent } from '../../../hoc/withTooltipComponent';

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
  // justify-content: center;
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

const MenuItemTitle: React.FC<{
  schema: any;
  style?: React.CSSProperties;
}> = ({ schema, style }) => {
  const { t } = useMenuTranslation();
  return <span style={style}>{t(schema.title)}</span>;
};

const MenuItemTitleWithTooltip = withTooltipComponent(MenuItemTitle);

export const ParentRouteContext = createContext<NocoBaseDesktopRoute>(null);
ParentRouteContext.displayName = 'ParentRouteContext';

export const useParentRoute = () => {
  return useContext(ParentRouteContext);
};

/**
 * Note: The routes here are different from React Router routes - these refer specifically to menu routing/navigation items
 * @param collectionName
 * @returns
 */
export const useNocoBaseRoutes = (collectionName = 'desktopRoutes') => {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource(collectionName), [api, collectionName]);
  const { refresh: refreshRoutes } = useAllAccessDesktopRoutes();

  const createRoute = useCallback(
    async (values: NocoBaseDesktopRoute, refreshAfterCreate = true) => {
      const res = await resource.create({
        values,
      });
      refreshAfterCreate && refreshRoutes();
      return res;
    },
    [resource, refreshRoutes],
  );

  const updateRoute = useCallback(
    async (filterByTk: any, values: NocoBaseDesktopRoute, refreshAfterUpdate = true) => {
      const res = await resource.update({
        filterByTk,
        values,
      });
      refreshAfterUpdate && refreshRoutes();
      return res;
    },
    [resource, refreshRoutes],
  );

  const deleteRoute = useCallback(
    async (filterByTk: any, refreshAfterDelete = true) => {
      const res = await resource.destroy({
        filterByTk,
      });
      refreshAfterDelete && refreshRoutes();
      return res;
    },
    [refreshRoutes, resource],
  );

  const moveRoute = useCallback(
    async ({
      sourceId,
      targetId,
      targetScope,
      sortField,
      sticky,
      method,
      refreshAfterMove = true,
    }: {
      sourceId: string | number;
      targetId?: string | number;
      targetScope?: any;
      sortField?: string;
      sticky?: boolean;
      /**
       * Insertion type - specifies whether to insert before or after the target element
       */
      method?: 'insertAfter' | 'prepend';
      refreshAfterMove?: boolean;
    }) => {
      const res = await resource.move({ sourceId, targetId, targetScope, sortField, sticky, method });
      refreshAfterMove && refreshRoutes();
      return res;
    },
    [refreshRoutes, resource],
  );

  return { createRoute, updateRoute, deleteRoute, moveRoute };
};

const HeaderMenu = React.memo<{
  schema: any;
  mode: any;
  onSelect: any;
  setDefaultSelectedKeys: any;
  defaultSelectedKeys: any;
  defaultOpenKeys: any;
  selectedKeys: any;
  designable: boolean;
  render: any;
  children: any;
  disabled: boolean;
  onBlur: any;
  onChange: any;
  onFocus: any;
  theme: any;
}>(
  ({
    schema,
    mode,
    onSelect,
    setDefaultSelectedKeys,
    defaultSelectedKeys,
    defaultOpenKeys,
    selectedKeys,
    designable,
    render,
    children,
    disabled,
    onBlur,
    onChange,
    onFocus,
    theme,
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [children, designable]);

    const handleSelect = useCallback(
      (info: { item; key; keyPath; domEvent }) => {
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
            const keys = findKeysByUid(schema, menuItemSchema['x-uid']);
            setDefaultSelectedKeys(keys);
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
      },
      [schema, mode, onSelect, setDefaultSelectedKeys],
    );
    return (
      <>
        <Component />
        <AntdMenu
          disabled={disabled}
          onBlur={onBlur}
          onChange={onChange}
          onFocus={onFocus}
          theme={theme}
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
  },
);

type SideMenuProps = Omit<MenuProps, 'mode'> & {
  mode: 'mix' | MenuProps['mode'];
  [key: string]: any;
};

const SideMenu = React.memo<SideMenuProps>(
  ({
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
    designable,
  }) => {
    const { Component, getMenuItems } = useMenuItem();

    const update = useUpdate();
    const refreshFieldSchema = useRefreshFieldSchema();
    const refreshComponent = useRefreshComponent();
    const refresh = useCallback(
      (options?: { refreshParentSchema?: boolean }) => {
        console.log('refresh');
        // refresh current component
        update();
        // refresh fieldSchema context value
        refreshFieldSchema?.(options);
        // refresh component context value
        refreshComponent?.();
      },
      [update, refreshFieldSchema, refreshComponent],
    );

    const handleSelect = useCallback(
      (info) => {
        onSelect?.(info);
      },
      [onSelect],
    );

    const items = useMemo(() => {
      const result = getMenuItems(() => {
        return <NocoBaseRecursionField key={uid()} schema={sideMenuSchema} onlyRenderProperties />;
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
                refresh: refresh,
                current: sideMenuSchema,
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
    }, [api, designable, getMenuItems, refresh, render, sideMenuSchema, t]);

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
  },
);

SideMenu.displayName = 'SideMenu';

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

export const useMenuDragEnd = () => {
  const { moveRoute } = useNocoBaseRoutes();

  const onDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      const activeSchema = active?.data?.current?.schema;
      const overSchema = over?.data?.current?.schema;

      if (!activeSchema || !overSchema) {
        return;
      }

      moveRoute({
        sourceId: activeSchema.__route__.id,
        targetId: overSchema.__route__.id,
        sortField: 'sort',
      });
    },
    [moveRoute],
  );

  return { onDragEnd };
};

export const Menu: ComposedMenu = React.memo((props) => {
  const {
    onSelect,
    mode,
    selectedUid,
    defaultSelectedUid,
    defaultSelectedKeys: dSelectedKeys,
    defaultOpenKeys: dOpenKeys,
    children,
    disabled,
    onBlur,
    onChange,
    onFocus,
    theme,
  } = useProps(props);

  const { t } = useTranslation();
  const Designer = useDesigner();
  const schema = useFieldSchema();
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
  const [defaultOpenKeys, setDefaultOpenKeys] = useState(() => {
    if (['inline', 'mix'].includes(mode)) {
      return dOpenKeys || defaultSelectedKeys;
    }
    return dOpenKeys;
  });

  const sideMenuSchema: any = useMemo(() => {
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

  const ctx = useContext(SchemaComponentContext);
  const { onDragEnd } = useMenuDragEnd();

  return (
    <DndContext onDragEnd={onDragEnd}>
      <MenuItemDesignerContext.Provider value={Designer}>
        <MenuModeContext.Provider value={mode}>
          <HeaderMenu
            disabled={disabled}
            onBlur={onBlur}
            onChange={onChange}
            onFocus={onFocus}
            theme={theme}
            schema={schema}
            mode={mode}
            onSelect={onSelect}
            setDefaultSelectedKeys={setDefaultSelectedKeys}
            defaultSelectedKeys={defaultSelectedKeys}
            defaultOpenKeys={defaultOpenKeys}
            selectedKeys={selectedKeys}
            designable={ctx.designable}
            render={render}
          >
            {children}
          </HeaderMenu>
          <ParentRouteContext.Provider value={sideMenuSchema?.__route__}>
            <SideMenu
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
              designable={ctx.designable}
            />
          </ParentRouteContext.Provider>
        </MenuModeContext.Provider>
      </MenuItemDesignerContext.Provider>
    </DndContext>
  );
});

Menu.displayName = 'Menu';

const menuItemTitleStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'inline-block',
  // width: '100%',
  verticalAlign: 'middle',
  // marginInlineEnd: '4px',
};

Menu.Item = observer(
  (props) => {
    const { t } = useMenuTranslation();
    const { pushMenuItem } = useCollectMenuItems();
    const { icon, children, hidden, ...others } = props;
    const schema = useFieldSchema();
    const field = useField();
    const Designer = useContext(MenuItemDesignerContext);
    const item = useMemo(() => {
      return {
        ...others,
        hidden: hidden,
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
                <MenuItemTitleWithTooltip
                  schema={schema}
                  style={menuItemTitleStyle}
                  tooltip={schema?.['x-component-props']?.tooltip}
                />
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
  const schema = useFieldSchema();
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
      <MenuItemTitleWithTooltip
        schema={schema}
        style={menuItemTitleStyle}
        tooltip={schema?.['x-component-props']?.tooltip}
      />
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
                <MenuItemTitleWithTooltip
                  schema={schema}
                  style={{ marginInlineStart: 0 }}
                  tooltip={schema?.['x-component-props']?.tooltip}
                />
                <Designer />
              </SortableItem>
            </FieldContext.Provider>
          </SchemaContext.Provider>
        ),
        children: getMenuItems(() => {
          return <NocoBaseRecursionField schema={schema} onlyRenderProperties />;
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
