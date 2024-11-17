/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ConfigProvider, Divider, Layout } from 'antd';
import { createGlobalStyle } from 'antd-style';
import React, { createContext, FC, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  ACLRolesCheckProvider,
  CurrentAppInfoProvider,
  CurrentUser,
  findByUid,
  findMenuItem,
  NavigateIfNotSignIn,
  PinnedPluginList,
  RemoteCollectionManagerProvider,
  RemoteSchemaTemplateManagerPlugin,
  RemoteSchemaTemplateManagerProvider,
  RouteSchemaComponent,
  SchemaComponent,
  useACLRoleContext,
  useAdminSchemaUid,
  useDocumentTitle,
  useRequest,
  useSystemSettings,
  useToken,
} from '../../../';
import {
  CurrentPageUidProvider,
  CurrentTabUidProvider,
  IsSubPageClosedByPageMenuProvider,
  useCurrentPageUid,
  useIsInSettingsPage,
  useMatchAdmin,
  useMatchAdminName,
  useNavigateNoUpdate,
} from '../../../application/CustomRouterContextProvider';
import { Plugin } from '../../../application/Plugin';
import { useMenuTranslation } from '../../../schema-component/antd/menu/locale';
import { Help } from '../../../user/Help';
import { VariablesProvider } from '../../../variables';

const filterByACL = (schema, options) => {
  const { allowAll, allowMenuItemIds = [] } = options;
  if (allowAll) {
    return schema;
  }
  const filterSchema = (s) => {
    if (!s) {
      return;
    }
    for (const key in s.properties) {
      if (Object.prototype.hasOwnProperty.call(s.properties, key)) {
        const element = s.properties[key];
        if (element['x-uid'] && !allowMenuItemIds.includes(element['x-uid'])) {
          delete s.properties[key];
        }
        if (element['x-uid']) {
          filterSchema(element);
        }
      }
    }
  };
  filterSchema(schema);
  return schema;
};

const useMenuProps = () => {
  const currentPageUid = useCurrentPageUid();
  return {
    selectedUid: currentPageUid,
    defaultSelectedUid: currentPageUid,
  };
};

const MenuSchemaRequestContext = createContext(null);
MenuSchemaRequestContext.displayName = 'MenuSchemaRequestContext';

const MenuSchemaRequestProvider: FC = ({ children }) => {
  const { t } = useMenuTranslation();
  const { setTitle: _setTitle } = useDocumentTitle();
  const setTitle = useCallback((title) => _setTitle(t(title)), [_setTitle, t]);
  const navigate = useNavigateNoUpdate();
  const isMatchAdmin = useMatchAdmin();
  const isMatchAdminName = useMatchAdminName();
  const currentPageUid = useCurrentPageUid();
  const isDynamicPage = !!currentPageUid;
  const ctx = useACLRoleContext();
  const adminSchemaUid = useAdminSchemaUid();

  const { data } = useRequest<{
    data: any;
  }>(
    {
      url: `/uiSchemas:getJsonSchema/${adminSchemaUid}`,
    },
    {
      refreshDeps: [adminSchemaUid],
      onSuccess(data) {
        const schema = filterByACL(data?.data, ctx);
        // url 为 `/admin` 的情况
        if (isMatchAdmin) {
          const s = findMenuItem(schema);
          if (s) {
            navigate(`/admin/${s['x-uid']}`);
            setTitle(s.title);
          } else {
            navigate(`/admin/`);
          }
          return;
        }

        // url 不为 `/admin/xxx` 的情况，不做处理
        if (!isMatchAdminName || !isDynamicPage) return;

        // url 为 `admin/xxx` 的情况
        const s = findByUid(schema, currentPageUid);
        if (s) {
          setTitle(s.title);
        } else {
          const s = findMenuItem(schema);
          if (s) {
            navigate(`/admin/${s['x-uid']}`);
            setTitle(s.title);
          } else {
            navigate(`/admin/`);
          }
        }
      },
    },
  );

  return <MenuSchemaRequestContext.Provider value={data?.data}>{children}</MenuSchemaRequestContext.Provider>;
};

const MenuEditor = (props) => {
  const { t } = useMenuTranslation();
  const { setTitle: _setTitle } = useDocumentTitle();
  const setTitle = useCallback((title) => _setTitle(t(title)), [_setTitle, t]);
  const navigate = useNavigateNoUpdate();
  const isInSettingsPage = useIsInSettingsPage();
  const isMatchAdmin = useMatchAdmin();
  const isMatchAdminName = useMatchAdminName();
  const currentPageUid = useCurrentPageUid();
  const { sideMenuRef } = props;
  const ctx = useACLRoleContext();
  const [current, setCurrent] = useState(null);
  const menuSchema = useContext(MenuSchemaRequestContext);

  const onSelect = useCallback(
    ({ item }: { item; key; keyPath; domEvent }) => {
      const schema = item.props.schema;
      setTitle(schema.title);
      setCurrent(schema);
      navigate(`/admin/${schema['x-uid']}`);
    },
    [navigate, setTitle],
  );

  useEffect(() => {
    const properties = Object.values(current?.root?.properties || {}).shift()?.['properties'] || menuSchema?.properties;
    if (sideMenuRef.current) {
      const pageType =
        properties &&
        Object.values(properties).find(
          (item) => item['x-uid'] === currentPageUid && item['x-component'] === 'Menu.Item',
        );
      if (pageType || isInSettingsPage) {
        sideMenuRef.current.style.display = 'none';
      } else {
        sideMenuRef.current.style.display = 'block';
      }
    }
  }, [current?.root?.properties, currentPageUid, menuSchema?.properties, isInSettingsPage, sideMenuRef]);

  const schema = useMemo(() => {
    const s = filterByACL(menuSchema, ctx);
    if (s?.['x-component-props']) {
      s['x-component-props']['useProps'] = useMenuProps;
    }
    return s;
  }, [menuSchema]);

  useEffect(() => {
    if (isMatchAdminName) {
      const s = findByUid(schema, currentPageUid);
      if (s) {
        setTitle(s.title);
      }
    }
  }, [currentPageUid, isMatchAdmin, isMatchAdminName, schema, setTitle]);

  const scope = useMemo(() => {
    return { useMenuProps, onSelect, sideMenuRef, defaultSelectedUid: currentPageUid };
  }, [currentPageUid, onSelect, sideMenuRef]);

  return <SchemaComponent distributed scope={scope} schema={schema} />;
};

/**
 * 鼠标悬浮在顶部“更多”按钮时显示的子菜单的样式
 */
const GlobalStyleForAdminLayout = createGlobalStyle`
  .nb-container-of-header-submenu {
    .ant-menu.ant-menu-submenu.ant-menu-submenu-popup {
      .ant-menu.ant-menu-sub.ant-menu-vertical {
        background-color: ${(p) => {
          // @ts-ignore
          return p.theme.colorBgHeader + ' !important';
        }};
        color: ${(p) => {
          // @ts-ignore
          return p.theme.colorTextHeaderMenu + ' !important';
        }};
        .ant-menu-item:hover {
          color: ${(p) => {
            // @ts-ignore
            return p.theme.colorTextHeaderMenuHover + ' !important';
          }};
          background-color: ${(p) => {
            // @ts-ignore
            return p.theme.colorBgHeaderMenuHover + ' !important';
          }};
        }
        .ant-menu-item.ant-menu-item-selected {
          color: ${(p) => {
            // @ts-ignore
            return p.theme.colorTextHeaderMenuActive + ' !important';
          }};
          background-color: ${(p) => {
            // @ts-ignore
            return p.theme.colorBgHeaderMenuActive + ' !important';
          }};
        }
      }
    }
  }
`;

/**
 * 确保顶部菜单的子菜单的主题样式正确
 * @param param0
 * @returns
 */
const SetThemeOfHeaderSubmenu = ({ children }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current = document.createElement('div');
    containerRef.current.classList.add('nb-container-of-header-submenu');
    document.body.appendChild(containerRef.current);

    return () => {
      document.body.removeChild(containerRef.current);
    };
  }, []);

  const getPopupContainer = useCallback(() => containerRef.current, []);

  return <ConfigProvider getPopupContainer={getPopupContainer}>{children}</ConfigProvider>;
};

const sideClass = css`
  height: 100%;
  /* position: fixed; */
  position: relative;
  left: 0;
  top: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 100;
  .ant-layout-sider-children {
    top: var(--nb-header-height);
    position: fixed;
    width: 200px;
    height: calc(100vh - var(--nb-header-height));
  }
`;

const InternalAdminSideBar: FC<{ pageUid: string; sideMenuRef: any }> = memo((props) => {
  if (!props.pageUid) return null;
  return <Layout.Sider className={sideClass} theme={'light'} ref={props.sideMenuRef}></Layout.Sider>;
});
InternalAdminSideBar.displayName = 'InternalAdminSideBar';

const AdminSideBar = ({ sideMenuRef }) => {
  const currentPageUid = useCurrentPageUid();
  return <InternalAdminSideBar pageUid={currentPageUid} sideMenuRef={sideMenuRef} />;
};

export const AdminDynamicPage = () => {
  return <RouteSchemaComponent />;
};

const layoutContentClass = css`
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  height: 100vh;
  > div {
    position: relative;
  }
  .ant-layout-footer {
    position: absolute;
    bottom: 0;
    text-align: center;
    width: 100%;
    z-index: 0;
    padding: 0px 50px;
  }
`;

const layoutContentHeaderClass = css`
  flex-shrink: 0;
  height: var(--nb-header-height);
  line-height: var(--nb-header-height);
  background: transparent;
  pointer-events: none;
`;

const style1: any = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
};

const style2: any = {
  position: 'relative',
  zIndex: 1,
  flex: '1 1 auto',
  display: 'flex',
  height: '100%',
};

const className1 = css`
  width: 200px;
  display: inline-flex;
  flex-shrink: 0;
  color: #fff;
  padding: 0;
  align-items: center;
`;
const className2 = css`
  padding: 0 16px;
  object-fit: contain;
  width: 100%;
  height: 100%;
`;
const className3 = css`
  padding: 0 16px;
  width: 100%;
  height: 100%;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const className4 = css`
  flex: 1 1 auto;
  width: 0;
`;
const className5 = css`
  position: relative;
  flex-shrink: 0;
  height: 100%;
  z-index: 10;
`;
const theme = {
  token: {
    colorSplit: 'rgba(255, 255, 255, 0.1)',
  },
};
export const InternalAdminLayout = () => {
  const result = useSystemSettings();
  const { token } = useToken();
  const sideMenuRef = useRef<HTMLDivElement>();

  const layoutHeaderCss = useMemo(() => {
    return css`
      .ant-menu.ant-menu-dark .ant-menu-item-selected,
      .ant-menu-submenu-popup.ant-menu-dark .ant-menu-item-selected,
      .ant-menu-submenu-horizontal.ant-menu-submenu-selected {
        background-color: ${token.colorBgHeaderMenuActive} !important;
        color: ${token.colorTextHeaderMenuActive} !important;
      }
      .ant-menu-submenu-horizontal.ant-menu-submenu-selected > .ant-menu-submenu-title {
        color: ${token.colorTextHeaderMenuActive} !important;
      }
      .ant-menu-dark.ant-menu-horizontal > .ant-menu-item:hover {
        background-color: ${token.colorBgHeaderMenuHover} !important;
        color: ${token.colorTextHeaderMenuHover} !important;
      }

      position: fixed;
      left: 0;
      right: 0;
      height: var(--nb-header-height);
      line-height: var(--nb-header-height);
      padding: 0;
      z-index: 100;
      background-color: ${token.colorBgHeader} !important;

      .ant-menu {
        background-color: transparent;
      }

      .ant-menu-item,
      .ant-menu-submenu-horizontal {
        color: ${token.colorTextHeaderMenu} !important;
      }
    `;
  }, [
    token.colorBgHeaderMenuActive,
    token.colorTextHeaderMenuActive,
    token.colorBgHeaderMenuHover,
    token.colorTextHeaderMenuHover,
    token.colorBgHeader,
    token.colorTextHeaderMenu,
  ]);
  const fontSizeStyle = useMemo(() => ({ fontSize: token.fontSizeHeading3 }), [token.fontSizeHeading3]);

  const logo = result?.data?.data?.logo?.url ? (
    <img className={className2} src={result?.data?.data?.logo?.url} />
  ) : (
    <span style={fontSizeStyle} className={className3}>
      {result?.data?.data?.title}
    </span>
  );

  return (
    <Layout>
      <GlobalStyleForAdminLayout />
      <Layout.Header className={layoutHeaderCss}>
        <div style={style1}>
          <div style={style2}>
            <div className={className1}>{result?.loading ? null : logo}</div>
            <div className={className4}>
              <SetThemeOfHeaderSubmenu>
                <MenuEditor sideMenuRef={sideMenuRef} />
              </SetThemeOfHeaderSubmenu>
            </div>
          </div>
          <div className={className5}>
            <PinnedPluginList />
            <ConfigProvider theme={theme}>
              <Divider type="vertical" />
            </ConfigProvider>
            <Help />
            <CurrentUser />
          </div>
        </div>
      </Layout.Header>
      <AdminSideBar sideMenuRef={sideMenuRef} />
      {/* Use the "nb-subpages-slot-without-header-and-side" class name to locate the position of the subpages */}
      <Layout.Content className={`${layoutContentClass} nb-subpages-slot-without-header-and-side`}>
        <header className={layoutContentHeaderClass}></header>
        <Outlet />
        {/* {service.contentLoading ? render() : <Outlet />} */}
      </Layout.Content>
    </Layout>
  );
};

export const AdminProvider = (props) => {
  return (
    <ACLRolesCheckProvider>
      <MenuSchemaRequestProvider>
        <RemoteCollectionManagerProvider>
          <CurrentAppInfoProvider>
            <NavigateIfNotSignIn>
              <RemoteSchemaTemplateManagerProvider>
                <VariablesProvider>{props.children}</VariablesProvider>
              </RemoteSchemaTemplateManagerProvider>
            </NavigateIfNotSignIn>
          </CurrentAppInfoProvider>
        </RemoteCollectionManagerProvider>
      </MenuSchemaRequestProvider>
    </ACLRolesCheckProvider>
  );
};

export const AdminLayout = (props) => {
  return (
    <CurrentPageUidProvider>
      <CurrentTabUidProvider>
        <IsSubPageClosedByPageMenuProvider>
          <AdminProvider>
            <InternalAdminLayout {...props} />
          </AdminProvider>
        </IsSubPageClosedByPageMenuProvider>
      </CurrentTabUidProvider>
    </CurrentPageUidProvider>
  );
};

export class AdminLayoutPlugin extends Plugin {
  async afterAdd() {
    await this.app.pm.add(RemoteSchemaTemplateManagerPlugin);
  }
  async load() {
    this.app.addComponents({ AdminLayout, AdminDynamicPage });
  }
}
