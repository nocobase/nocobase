/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { useSessionStorageState } from 'ahooks';
import { App, ConfigProvider, Divider, Layout } from 'antd';
import { createGlobalStyle } from 'antd-style';
import React, { FC, createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useMatch, useParams } from 'react-router-dom';
import {
  ACLRolesCheckProvider,
  CurrentAppInfoProvider,
  CurrentUser,
  NavigateIfNotSignIn,
  PinnedPluginList,
  RemoteCollectionManagerProvider,
  RemoteSchemaTemplateManagerPlugin,
  RemoteSchemaTemplateManagerProvider,
  RouteSchemaComponent,
  SchemaComponent,
  findByUid,
  findMenuItem,
  useACLRoleContext,
  useAdminSchemaUid,
  useDocumentTitle,
  useRequest,
  useSystemSettings,
  useToken,
} from '../../../';
import { useLocationNoUpdate, useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { Plugin } from '../../../application/Plugin';
import { useAppSpin } from '../../../application/hooks/useAppSpin';
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

const SchemaIdContext = createContext(null);
SchemaIdContext.displayName = 'SchemaIdContext';
const useMenuProps = () => {
  const defaultSelectedUid = useContext(SchemaIdContext);
  return {
    selectedUid: defaultSelectedUid,
    defaultSelectedUid,
  };
};

const MenuEditor = (props) => {
  const { notification } = App.useApp();
  const [, setHasNotice] = useSessionStorageState('plugin-notice', { defaultValue: false });
  const { t } = useMenuTranslation();
  const { setTitle: _setTitle } = useDocumentTitle();
  const setTitle = useCallback((title) => _setTitle(t(title)), []);
  const navigate = useNavigateNoUpdate();
  const params = useParams<any>();
  const location = useLocationNoUpdate();
  const isMatchAdmin = useMatch('/admin');
  const isMatchAdminName = useMatch('/admin/:name');
  const defaultSelectedUid = params.name;
  const isDynamicPage = !!defaultSelectedUid;
  const { sideMenuRef } = props;
  const ctx = useACLRoleContext();
  const [current, setCurrent] = useState(null);

  const onSelect = useCallback(({ item }: { item; key; keyPath; domEvent }) => {
    const schema = item.props.schema;
    setTitle(schema.title);
    setCurrent(schema);
    navigate(`/admin/${schema['x-uid']}`);
  }, []);
  const { render } = useAppSpin();
  const adminSchemaUid = useAdminSchemaUid();
  const { data, loading } = useRequest<{
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
        const s = findByUid(schema, defaultSelectedUid);
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

  useEffect(() => {
    const properties = Object.values(current?.root?.properties || {}).shift()?.['properties'] || data?.data?.properties;
    if (sideMenuRef.current) {
      const pageType =
        properties &&
        Object.values(properties).find((item) => item['x-uid'] === params.name && item['x-component'] === 'Menu.Item');
      const isSettingPage = location?.pathname.includes('/settings');
      if (pageType || isSettingPage) {
        sideMenuRef.current.style.display = 'none';
      } else {
        sideMenuRef.current.style.display = 'block';
      }
    }
  }, [data?.data, params.name, sideMenuRef, location?.pathname]);

  const schema = useMemo(() => {
    const s = filterByACL(data?.data, ctx);
    if (s?.['x-component-props']) {
      s['x-component-props']['useProps'] = useMenuProps;
    }
    return s;
  }, [data?.data]);

  useEffect(() => {
    if (isMatchAdminName) {
      const s = findByUid(schema, defaultSelectedUid);
      if (s) {
        setTitle(s.title);
      }
    }
  }, [defaultSelectedUid, isMatchAdmin, isMatchAdminName, schema, setTitle]);

  useRequest(
    {
      url: 'applicationPlugins:list',
      params: {
        sort: 'id',
        paginate: false,
      },
    },
    {
      onSuccess: ({ data }) => {
        setHasNotice(true);
        const errorPlugins = data.filter((item) => !item.isCompatible);
        if (errorPlugins.length) {
          notification.error({
            message: 'Plugin dependencies check failed',
            description: (
              <div>
                <div>
                  These plugins failed dependency checks. Please go to the{' '}
                  <Link to="/admin/pm/list/local/">plugin management page</Link> for more details.{' '}
                </div>
                <ul>
                  {errorPlugins.map((item) => (
                    <li key={item.id}>
                      {item.displayName} - {item.packageName}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          });
        }
      },
      manual: true,
      // ready: !hasNotice,
    },
  );

  const scope = useMemo(() => {
    return { useMenuProps, onSelect, sideMenuRef, defaultSelectedUid };
  }, []);

  if (loading) {
    return render();
  }
  return (
    <SchemaIdContext.Provider value={defaultSelectedUid}>
      <SchemaComponent distributed scope={scope} schema={schema} />
    </SchemaIdContext.Provider>
  );
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

  return (
    <>
      <GlobalStyleForAdminLayout />
      <ConfigProvider getPopupContainer={() => containerRef.current}>{children}</ConfigProvider>
    </>
  );
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
  const params = useParams<any>();
  return <InternalAdminSideBar pageUid={params.name} sideMenuRef={sideMenuRef} />;
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

  return (
    <Layout>
      <GlobalStyleForAdminLayout />
      <Layout.Header className={layoutHeaderCss}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
          }}
        >
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              flex: '1 1 auto',
              display: 'flex',
              height: '100%',
            }}
          >
            <div
              className={css`
                width: 200px;
                display: inline-flex;
                flex-shrink: 0;
                color: #fff;
                padding: 0;
                align-items: center;
              `}
            >
              {result?.data?.data?.logo?.url ? (
                <img
                  className={css`
                    padding: 0 16px;
                    object-fit: contain;
                    width: 100%;
                    height: 100%;
                  `}
                  src={result?.data?.data?.logo?.url}
                />
              ) : (
                <span
                  style={{ fontSize: token.fontSizeHeading1 }}
                  className={css`
                    padding: 0 16px;
                    width: 100%;
                    height: 100%;
                    font-weight: 500;
                  `}
                >
                  {result?.data?.data?.title}
                </span>
              )}
            </div>
            <div
              className={css`
                flex: 1 1 auto;
                width: 0;
              `}
            >
              <SetThemeOfHeaderSubmenu>
                <MenuEditor sideMenuRef={sideMenuRef} />
              </SetThemeOfHeaderSubmenu>
            </div>
          </div>
          <div
            className={css`
              position: relative;
              flex-shrink: 0;
              height: 100%;
              z-index: 10;
            `}
          >
            <PinnedPluginList />
            <ConfigProvider
              theme={{
                token: {
                  colorSplit: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
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
    <CurrentAppInfoProvider>
      <NavigateIfNotSignIn>
        <RemoteSchemaTemplateManagerProvider>
          <RemoteCollectionManagerProvider>
            <VariablesProvider>
              <ACLRolesCheckProvider>{props.children}</ACLRolesCheckProvider>
            </VariablesProvider>
          </RemoteCollectionManagerProvider>
        </RemoteSchemaTemplateManagerProvider>
      </NavigateIfNotSignIn>
    </CurrentAppInfoProvider>
  );
};

export const AdminLayout = (props) => {
  return (
    <AdminProvider>
      <InternalAdminLayout {...props} />
    </AdminProvider>
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
