/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ProLayout from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { ConfigProvider, Divider, Layout } from 'antd';
import React, { createContext, FC, useContext, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import {
  ACLRolesCheckProvider,
  CurrentAppInfoProvider,
  CurrentUser,
  Icon,
  NavigateIfNotSignIn,
  PinnedPluginList,
  RemoteCollectionManagerProvider,
  RemoteSchemaComponent,
  RemoteSchemaTemplateManagerPlugin,
  RemoteSchemaTemplateManagerProvider,
  useDesignable,
  useRequest,
  useSchemaInitializerRender,
  useSystemSettings,
  useToken,
} from '../../../';
import {
  CurrentPageUidProvider,
  CurrentTabUidProvider,
  IsSubPageClosedByPageMenuProvider,
  useCurrentPageUid,
} from '../../../application/CustomRouterContextProvider';
import { Plugin } from '../../../application/Plugin';
import { menuItemInitializer } from '../../../modules/menu/menuItemInitializer';
import { Help } from '../../../user/Help';
import { KeepAlive } from './KeepAlive';
import { NocoBaseDesktopRoute, NocoBaseDesktopRouteType } from './convertRoutesToSchema';
import { MenuSchemaToolbar } from './menuItemSettings';

export { KeepAlive, NocoBaseDesktopRouteType };

const RouteContext = createContext<NocoBaseDesktopRoute | null>(null);
RouteContext.displayName = 'RouteContext';

const CurrentRouteProvider: FC<{ uid: string }> = ({ children, uid }) => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const routeNode = useMemo(() => getRouteNodeBySchemaUid(uid, allAccessRoutes), [uid, allAccessRoutes]);
  return <RouteContext.Provider value={routeNode}>{children}</RouteContext.Provider>;
};

export const useCurrentRoute = () => {
  return useContext(RouteContext) || {};
};

const emptyArray = [];
const AllAccessDesktopRoutesContext = createContext<{
  allAccessRoutes: NocoBaseDesktopRoute[];
  refresh: () => void;
}>({
  allAccessRoutes: emptyArray,
  refresh: () => { },
});
AllAccessDesktopRoutesContext.displayName = 'AllAccessDesktopRoutesContext';

export const useAllAccessDesktopRoutes = () => {
  return useContext(AllAccessDesktopRoutesContext);
};

const MenuSchemaRequestProvider: FC = ({ children }) => {
  const { data, refresh } = useRequest<{
    data: any;
  }>({
    url: `/desktopRoutes:listAccessible`,
    params: { tree: true, sort: 'sort' },
  });

  const allAccessRoutesValue = useMemo(() => {
    return {
      allAccessRoutes: data?.data || emptyArray,
      refresh,
    };
  }, [data?.data, refresh]);

  return (
    <AllAccessDesktopRoutesContext.Provider value={allAccessRoutesValue}>
      {children}
    </AllAccessDesktopRoutesContext.Provider>
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

export const AdminDynamicPage = () => {
  const currentPageUid = useCurrentPageUid();

  return (
    <KeepAlive uid={currentPageUid}>{(uid) => <RemoteSchemaComponent onlyRenderProperties uid={uid} />}</KeepAlive>
  );
};

const layoutContentClass = css`
  display: flex;
  flex-direction: column;
  position: relative;
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

const pageContentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

export const LayoutContent = () => {
  const currentPageUid = useCurrentPageUid();

  /* Use the "nb-subpages-slot-without-header-and-side" class name to locate the position of the subpages */
  return (
    <CurrentRouteProvider uid={currentPageUid}>
      <Layout.Content className={`${layoutContentClass} nb-subpages-slot-without-header-and-side`}>
        <header className={layoutContentHeaderClass}></header>
        <div style={pageContentStyle}>
          <Outlet />
        </div>
        {/* {service.contentLoading ? render() : <Outlet />} */}
      </Layout.Content>
    </CurrentRouteProvider>
  );
};

const NocoBaseLogo = () => {
  const result = useSystemSettings();
  const { token } = useToken();
  const fontSizeStyle = useMemo(() => ({ fontSize: token.fontSizeHeading3 }), [token.fontSizeHeading3]);

  const logo = result?.data?.data?.logo?.url ? (
    <img className={className2} src={result?.data?.data?.logo?.url} />
  ) : (
    <span style={fontSizeStyle} className={className3}>
      {result?.data?.data?.title}
    </span>
  );

  return <div className={className1}>{result?.loading ? null : logo}</div>;
};

const MenuItem: FC<{ item: any }> = (props) => {
  const { item } = props;

  // "Add menu item" does not need SchemaToolbar
  if (!item._route) {
    return <>{props.children}</>;
  }

  return (
    <div>
      <RouteContext.Provider value={item._route}>
        {props.children}
        <MenuSchemaToolbar />
      </RouteContext.Provider>
    </div>
  );
};

export const InternalAdminLayout = () => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const { render: renderInitializer } = useSchemaInitializerRender(menuItemInitializer);
  const { designable } = useDesignable();

  return (
    <ProLayout
      className={css`
        .anticon-menu {
          color: #fff;
        }
      `}
      route={{
        path: '/',
        children: convertRoutesToLayout(allAccessRoutes, { renderInitializer, designable }),
      }}
      actionsRender={(props) => {
        if (props.isMobile) return [];
        if (typeof window === 'undefined') return [];
        return [<PinnedPluginList key="pinned-plugin-list" />, <Help key="help" />, <CurrentUser key="current-user" />];
      }}
      logo={<NocoBaseLogo />}
      title={''}
      layout="mix"
      splitMenus
      token={{
        header: {
          colorBgHeader: '#001529',
          colorTextMenu: '#eee',
          colorTextMenuSelected: '#fff',
          colorTextMenuActive: '#fff',
          colorBgMenuItemHover: '#001529',
          colorBgMenuItemSelected: '#001529',
        },
        sider: {
          colorTextMenuSecondary: '#fff',
        },
        colorTextAppListIcon: '#fff',
        colorTextAppListIconHover: '#fff',
        colorBgAppListIconHover: '#fff',
      }}
      menuItemRender={(item, dom) => {
        return <MenuItem item={item}>{dom}</MenuItem>;
      }}
    >
      <Layout.Header>
        <div style={style1}>
          <div style={style2}>
            <NocoBaseLogo />
            <div className={className4}></div>
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
      <LayoutContent />
    </ProLayout>
  );
};

export const AdminProvider = (props) => {
  return (
    <CurrentPageUidProvider>
      <CurrentTabUidProvider>
        <IsSubPageClosedByPageMenuProvider>
          <NavigateIfNotSignIn>
            <ACLRolesCheckProvider>
              <MenuSchemaRequestProvider>
                <RemoteCollectionManagerProvider>
                  <CurrentAppInfoProvider>
                    <RemoteSchemaTemplateManagerProvider>{props.children}</RemoteSchemaTemplateManagerProvider>
                  </CurrentAppInfoProvider>
                </RemoteCollectionManagerProvider>
              </MenuSchemaRequestProvider>
            </ACLRolesCheckProvider>
          </NavigateIfNotSignIn>
        </IsSubPageClosedByPageMenuProvider>
      </CurrentTabUidProvider>
    </CurrentPageUidProvider>
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

function getRouteNodeBySchemaUid(schemaUid: string, treeArray: any[]) {
  for (const node of treeArray) {
    if (schemaUid === node.schemaUid || schemaUid === node.menuSchemaUid) {
      return node;
    }

    if (node.children?.length) {
      const result = getRouteNodeBySchemaUid(schemaUid, node.children);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function convertRoutesToLayout(routes: NocoBaseDesktopRoute[], { renderInitializer, designable }: any) {
  if (!routes) return;

  const result = [];

  // add a designer button
  if (designable) {
    result.push({
      key: 'x-designer-button',
      name: renderInitializer({
        style: { background: 'none' },
        'data-testid': 'schema-initializer-Menu-header',
      }),
      path: '/',
      disabled: true,
      icon: <Icon type="setting" />,
    });
  }

  return result.concat(
    routes.map((item) => {
      if (item.type === 'link') {
        return {
          name: item.title,
          icon: <Icon type={item.icon} />,
          path: `/admin/${item.schemaUid}`,
          routes: convertRoutesToLayout(item.children, { renderInitializer, designable }),
          hideInMenu: item.hideInMenu,
          _route: item,
        };
      }

      return {
        name: item.title,
        icon: <Icon type={item.icon} />,
        path: `/admin/${item.schemaUid}`,
        routes: convertRoutesToLayout(item.children, { renderInitializer, designable }),
        hideInMenu: item.hideInMenu,
        _route: item,
      };
    }),
  );
}
