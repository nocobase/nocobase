/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EllipsisOutlined, HighlightOutlined } from '@ant-design/icons';
import ProLayout, { RouteContext, RouteContextType } from '@ant-design/pro-layout';
import { HeaderViewProps } from '@ant-design/pro-layout/es/components/Header';
import { css } from '@emotion/css';
import { Popover, Result, Tooltip } from 'antd';
import React, { createContext, FC, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ACLRolesCheckProvider,
  CurrentAppInfoProvider,
  DndContext,
  Icon,
  ParentRouteContext,
  PinnedPluginList,
  RemoteCollectionManagerProvider,
  RemoteSchemaComponent,
  RemoteSchemaTemplateManagerPlugin,
  RemoteSchemaTemplateManagerProvider,
  SortableItem,
  useDesignable,
  useMenuDragEnd,
  useParseURLAndParams,
  useRequest,
  useSchemaInitializerRender,
  useSystemSettings,
  useToken,
  useRouterBasename,
} from '../../../';
import {
  CurrentPageUidContext,
  CurrentPageUidProvider,
  CurrentTabUidProvider,
  IsSubPageClosedByPageMenuProvider,
  useCurrentPageUid,
  useLocationNoUpdate,
} from '../../../application/CustomRouterContextProvider';
import { Plugin } from '../../../application/Plugin';
import { AppNotFound } from '../../../common/AppNotFound';
import { withTooltipComponent } from '../../../hoc/withTooltipComponent';
import { menuItemInitializer } from '../../../modules/menu/menuItemInitializer';
import { useMenuTranslation } from '../../../schema-component/antd/menu/locale';
import { KeepAlive, useKeepAlive } from './KeepAlive';
import { NocoBaseDesktopRoute, NocoBaseDesktopRouteType } from './convertRoutesToSchema';
import { MenuSchemaToolbar, ResetThemeTokenAndKeepAlgorithm } from './menuItemSettings';
import { userCenterSettings } from './userCenterSettings';
import { navigateWithinSelf } from '../../../block-provider/hooks';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';

export { KeepAlive, NocoBaseDesktopRouteType, useKeepAlive };

export const NocoBaseRouteContext = createContext<NocoBaseDesktopRoute | null>(null);
NocoBaseRouteContext.displayName = 'NocoBaseRouteContext';

export const CurrentRouteProvider: FC<{ uid: string }> = memo(({ children, uid }) => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const routeNode = useMemo(() => findRouteBySchemaUid(uid, allAccessRoutes), [uid, allAccessRoutes]);
  return <NocoBaseRouteContext.Provider value={routeNode}>{children}</NocoBaseRouteContext.Provider>;
});

export const useCurrentRoute = () => {
  return useContext(NocoBaseRouteContext) || {};
};

const emptyArray = [];
const AllAccessDesktopRoutesContext = createContext<{
  allAccessRoutes: NocoBaseDesktopRoute[];
  refresh: () => void;
}>({
  allAccessRoutes: emptyArray,
  refresh: () => {},
});
AllAccessDesktopRoutesContext.displayName = 'AllAccessDesktopRoutesContext';

export const useAllAccessDesktopRoutes = () => {
  return useContext(AllAccessDesktopRoutesContext);
};

const RoutesRequestProvider: FC = ({ children }) => {
  const mountedRef = useRef(false);
  const { data, refresh, loading } = useRequest<{
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

  // Only valid on first load
  if (loading && !mountedRef.current) {
    return null;
  } else {
    mountedRef.current = true;
  }

  return (
    <AllAccessDesktopRoutesContext.Provider value={allAccessRoutesValue}>
      {children}
    </AllAccessDesktopRoutesContext.Provider>
  );
};

const noAccessPermission = (currentPageUid: string, allAccessRoutes: NocoBaseDesktopRoute[]) => {
  if (!currentPageUid) {
    return false;
  }

  const routeNode = findRouteBySchemaUid(currentPageUid, allAccessRoutes);
  if (!routeNode) {
    return true;
  }

  return false;
};

export const AdminDynamicPage = () => {
  const currentPageUid = useCurrentPageUid();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();

  // Group page should not request schema data
  if (isGroup(currentPageUid, allAccessRoutes)) {
    return null;
  }

  // 404 page
  if (noAccessPermission(currentPageUid, allAccessRoutes)) {
    return <AppNotFound />;
  }

  return (
    <KeepAlive uid={currentPageUid}>
      {(uid) => (
        <CurrentPageUidContext.Provider value={uid}>
          <CurrentRouteProvider uid={uid}>
            <RemoteSchemaComponent uid={uid} />
          </CurrentRouteProvider>
        </CurrentPageUidContext.Provider>
      )}
    </KeepAlive>
  );
};

const layoutContentClass = css`
  display: flex;
  flex-direction: column;
  position: relative;
  height: calc(100vh - var(--nb-header-height));
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

const className1 = css`
  width: 168px;
  height: var(--nb-header-height);
  margin-right: 4px;
  display: inline-flex;
  flex-shrink: 0;
  color: #fff;
  padding: 0;
  align-items: center;
`;
const className2 = css`
  object-fit: contain;
  width: 100%;
  height: 100%;
`;
const className3 = css`
  width: 100%;
  height: 100%;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const pageContentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const ShowTipWhenNoPages = () => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const { designable } = useDesignable();
  const { token } = useToken();
  const { t } = useTranslation();
  const location = useLocation();

  // Check if there are any pages
  if (allAccessRoutes.length === 0 && !designable && ['/admin', '/admin/'].includes(location.pathname)) {
    return (
      <Result
        icon={<HighlightOutlined style={{ fontSize: '8em', color: token.colorText }} />}
        title={t('No pages yet, please configure first')}
        subTitle={t(`Click the "UI Editor" icon in the upper right corner to enter the UI Editor mode`)}
      />
    );
  }

  return null;
};

export const LayoutContent = () => {
  /* Use the "nb-subpages-slot-without-header-and-side" class name to locate the position of the subpages */
  return (
    <div className={`${layoutContentClass} nb-subpages-slot-without-header-and-side`}>
      <div style={pageContentStyle}>
        <Outlet />
        <ShowTipWhenNoPages />
      </div>
    </div>
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

/**
 * Fix the issue where SchemaToolbar cannot be displayed normally in Group
 * @returns
 */
const MenuSchemaToolbarWithContainer = () => {
  const divRef = useRef(null);
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setContainer(divRef.current.parentElement.parentElement.parentElement);
  }, []);

  return (
    <>
      <MenuSchemaToolbar container={container} />
      <div ref={divRef}></div>
    </>
  );
};

const GroupItem: FC<{ item: any }> = (props) => {
  const { item } = props;
  const { designable } = useDesignable();

  // fake schema used to pass routing information to SortableItem
  const fakeSchema: any = { __route__: item._route };

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <SortableItem id={item._route.id} schema={fakeSchema} aria-label={item.name}>
          {props.children}
          {designable && <MenuSchemaToolbarWithContainer />}
        </SortableItem>
      </NocoBaseRouteContext.Provider>
    </ParentRouteContext.Provider>
  );
};

const WithTooltip: FC<{ title: string; hidden: boolean }> = (props) => {
  const { inHeader } = useContext(headerContext);

  return (
    <RouteContext.Consumer>
      {(context) =>
        context.collapsed && !props.hidden && !inHeader ? (
          <Tooltip title={props.title} placement="right">
            {props.children}
          </Tooltip>
        ) : (
          props.children
        )
      }
    </RouteContext.Consumer>
  );
};

const MenuItem: FC<{ item: any; options: { isMobile: boolean; collapsed: boolean } }> = (props) => {
  const { item } = props;
  const { parseURLAndParams } = useParseURLAndParams();
  const divRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigateNoUpdate();
  const basenameOfCurrentRouter = useRouterBasename();

  useEffect(() => {
    if (divRef.current) {
      // 顶部 Add menu item 按钮放置在右侧
      divRef.current.parentElement.parentElement.style.order = 999;

      divRef.current.parentElement.parentElement.style.paddingLeft = 0;
      divRef.current.parentElement.parentElement.style.padding = 0;
    }
  }, []);

  const handleClickLink = useCallback(
    async (event: React.MouseEvent) => {
      const href = item._route.options?.href;
      const params = item._route.options?.params;
      const openInNewWindow = item._route.options?.openInNewWindow;

      event.preventDefault();
      event.stopPropagation();

      try {
        const url = await parseURLAndParams(href, params || []);

        if (openInNewWindow !== false) {
          window.open(url, '_blank');
        } else {
          navigateWithinSelf(href, navigate, window.location.origin + basenameOfCurrentRouter);
        }
      } catch (err) {
        console.error(err);
        window.open(href, '_blank');
      }
    },
    [parseURLAndParams, item],
  );

  if (item._hidden) {
    return null;
  }

  const fakeSchema: any = { __route__: item._route };

  // "Add menu item" does not need SchemaToolbar
  if (item.key === 'x-designer-button') {
    return (
      <div ref={divRef}>
        <ResetThemeTokenAndKeepAlgorithm>
          <ParentRouteContext.Provider value={item._parentRoute}>
            <NocoBaseRouteContext.Provider value={item._route}>{props.children}</NocoBaseRouteContext.Provider>
          </ParentRouteContext.Provider>
        </ResetThemeTokenAndKeepAlgorithm>
      </div>
    );
  }

  if (item._route?.type === NocoBaseDesktopRouteType.link) {
    // fake schema used to pass routing information to SortableItem
    return (
      <ParentRouteContext.Provider value={item._parentRoute}>
        <NocoBaseRouteContext.Provider value={item._route}>
          <SortableItem id={item._route.id} schema={fakeSchema}>
            <div onClick={handleClickLink}>
              {/* 这里是为了扩大点击区域 */}
              <Link to={location.pathname} aria-label={item.name}>
                {props.children}
              </Link>
            </div>
            <MenuSchemaToolbar />
          </SortableItem>
        </NocoBaseRouteContext.Provider>
      </ParentRouteContext.Provider>
    );
  }

  // 如果点击的是一个 group，直接跳转到第一个子页面
  const path = item.redirect || item.path;

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <SortableItem id={item._route.id} schema={fakeSchema}>
          <WithTooltip
            title={item.name}
            hidden={item._route.type === NocoBaseDesktopRouteType.group || item._depth > 0}
          >
            <Link to={path} aria-label={item.name}>
              {props.children}
            </Link>
          </WithTooltip>
          <MenuSchemaToolbar />
        </SortableItem>
      </NocoBaseRouteContext.Provider>
    </ParentRouteContext.Provider>
  );
};

const resetStyle = css`
  .ant-layout-sider-children {
    margin-inline-end: 0 !important;
  }

  .ant-layout-header.ant-pro-layout-header {
    border-block-end: none !important;
  }

  // 固定菜单中图标和标题的距离，防止当切换到紧凑模式后，图标和标题之间的距离过近
  .ant-menu-title-content .ant-pro-base-menu-inline-item-title,
  .ant-menu-title-content .ant-pro-base-menu-horizontal-item-title {
    gap: 8px;
  }

  // 修复紧凑模式下且菜单收起时，菜单的高度不够的问题
  .ant-pro-base-menu-vertical-collapsed .ant-pro-base-menu-vertical-menu-item {
    height: auto;
  }
`;

const contentStyle = {
  paddingBlock: 0,
  paddingInline: 0,
};

const headerContext = React.createContext<{ inHeader: boolean }>({ inHeader: false });

const popoverStyle = css`
  .ant-popover-inner {
    padding: 0;
    overflow: hidden;
  }
`;

const MobileActions: FC = (props) => {
  const { token } = useToken();

  return (
    <Popover rootClassName={popoverStyle} content={<PinnedPluginList />} color={token.colorBgHeader}>
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', height: '100%', marginRight: -16 }}>
        <EllipsisOutlined
          style={{
            color: token.colorTextHeaderMenu,
            fontSize: 20,
          }}
        />
      </div>
    </Popover>
  );
};

const actionsRender: any = (props) => {
  if (props.isMobile) {
    return <MobileActions />;
  }

  return <PinnedPluginList />;
};

const MenuItemTitle: React.FC = (props) => {
  return <>{props.children}</>;
};

const MenuItemTitleWithTooltip = withTooltipComponent(MenuItemTitle);

const menuItemRender = (item, dom, options) => {
  return (
    <MenuItem item={item} options={options}>
      <MenuItemTitleWithTooltip tooltip={item._route?.tooltip}>{dom}</MenuItemTitleWithTooltip>
    </MenuItem>
  );
};

const subMenuItemRender = (item, dom) => {
  return (
    <GroupItem item={item}>
      <MenuItemTitleWithTooltip tooltip={item._route?.tooltip}>{dom}</MenuItemTitleWithTooltip>
    </GroupItem>
  );
};

const CollapsedButton: FC<{ collapsed: boolean }> = (props) => {
  return (
    <RouteContext.Consumer>
      {(context) =>
        context.isMobile ? (
          <>{props.children}</>
        ) : (
          ReactDOM.createPortal(
            <div
              className={css`
                // Fix the issue where the collapse/expand button is covered by subpages
                .ant-pro-sider-collapsed-button {
                  top: 64px;
                  left: ${props.collapsed ? 52 : 188}px;
                  z-index: 200;
                  transition: left 0.2s;
                }
              `}
            >
              {props.children}
            </div>,
            document.body,
          )
        )
      }
    </RouteContext.Consumer>
  );
};

const collapsedButtonRender = (collapsed, dom) => {
  return <CollapsedButton collapsed={collapsed}>{dom}</CollapsedButton>;
};

const headerContextValue = { inHeader: true };
const headerRender = (props: HeaderViewProps, defaultDom: React.ReactNode) => {
  return <headerContext.Provider value={headerContextValue}>{defaultDom}</headerContext.Provider>;
};

export const InternalAdminLayout = () => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const { designable } = useDesignable();
  const location = useLocation();
  const { onDragEnd } = useMenuDragEnd();
  const { token } = useToken();
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const doNotChangeCollapsedRef = useRef(false);
  const { t } = useMenuTranslation();
  const route = useMemo(() => {
    return {
      path: '/',
      children: convertRoutesToLayout(allAccessRoutes, { designable, isMobile, t }),
    };
  }, [allAccessRoutes, designable, isMobile, t]);
  const layoutToken = useMemo(() => {
    return {
      header: {
        colorBgHeader: token.colorBgHeader,
        colorTextMenu: token.colorTextHeaderMenu,
        colorTextMenuSelected: token.colorTextHeaderMenuActive,
        colorTextMenuActive: token.colorTextHeaderMenuActive,
        colorBgMenuItemHover: token.colorBgHeaderMenuHover,
        colorBgMenuItemSelected: token.colorBgHeaderMenuActive,
        heightLayoutHeader: 46,
        colorHeaderTitle: token.colorTextHeaderMenu,
      },
      sider: {
        colorMenuBackground: token.colorBgContainer,
        colorTextMenu: token.colorText,
        colorTextMenuSelected: token.colorPrimary,
        colorBgMenuItemSelected: token.colorPrimaryBg,
        colorBgMenuItemActive: token.colorPrimaryBg,
        colorBgMenuItemHover: token.colorBgTextHover,
      },
      bgLayout: token.colorBgLayout,
    };
  }, [token]);

  const onCollapse = useCallback((collapsed: boolean) => {
    if (doNotChangeCollapsedRef.current) {
      return;
    }
    setCollapsed(collapsed);
  }, []);

  const onPageChange = useCallback(() => {
    doNotChangeCollapsedRef.current = true;
    setTimeout(() => {
      doNotChangeCollapsedRef.current = false;
    });
  }, []);

  return (
    <DndContext onDragEnd={onDragEnd}>
      <ProLayout
        contentStyle={contentStyle}
        siderWidth={200}
        className={resetStyle}
        location={location}
        route={route}
        actionsRender={actionsRender}
        logo={<NocoBaseLogo />}
        title={''}
        layout="mix"
        splitMenus
        token={layoutToken}
        headerRender={headerRender}
        menuItemRender={menuItemRender}
        subMenuItemRender={subMenuItemRender}
        collapsedButtonRender={collapsedButtonRender}
        onCollapse={onCollapse}
        collapsed={collapsed}
        onPageChange={onPageChange}
      >
        <RouteContext.Consumer>
          {(value: RouteContextType) => {
            const { isMobile: _isMobile } = value;

            if (_isMobile !== isMobile) {
              setIsMobile(_isMobile);
            }

            return <LayoutContent />;
          }}
        </RouteContext.Consumer>
      </ProLayout>
    </DndContext>
  );
};

const NavigateToDefaultPage: FC = (props) => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const location = useLocationNoUpdate();

  const defaultPageUid = findFirstPageRoute(allAccessRoutes)?.schemaUid;

  return (
    <>
      {props.children}
      {defaultPageUid && (location.pathname === '/admin' || location.pathname === '/admin/') && (
        <Navigate replace to={`/admin/${defaultPageUid}`} />
      )}
    </>
  );
};

const findRouteByMenuSchemaUid = (schemaUid: string, routes: NocoBaseDesktopRoute[]) => {
  if (!routes) return;

  for (const route of routes) {
    if (route.menuSchemaUid === schemaUid) {
      return route;
    }

    if (route.children?.length) {
      const result = findRouteByMenuSchemaUid(schemaUid, route.children);
      if (result) {
        return result;
      }
    }
  }
};

/**
 * Compatibility with legacy page routes
 * @param props
 * @returns
 */
const LegacyRouteCompat: FC = (props) => {
  const currentPageUid = useCurrentPageUid();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const route = findRouteByMenuSchemaUid(currentPageUid, allAccessRoutes);
    if (route) {
      navigate(location.pathname.replace(currentPageUid, route.schemaUid) + location.search);
    }
  }, [allAccessRoutes, currentPageUid, location.pathname, location.search, navigate]);

  return <>{props.children}</>;
};

export const AdminProvider = (props) => {
  return (
    <CurrentPageUidProvider>
      <CurrentTabUidProvider>
        <IsSubPageClosedByPageMenuProvider>
          <ACLRolesCheckProvider>
            <RoutesRequestProvider>
              <NavigateToDefaultPage>
                <LegacyRouteCompat>
                  <RemoteCollectionManagerProvider>
                    <CurrentAppInfoProvider>
                      <RemoteSchemaTemplateManagerProvider>{props.children}</RemoteSchemaTemplateManagerProvider>
                    </CurrentAppInfoProvider>
                  </RemoteCollectionManagerProvider>
                </LegacyRouteCompat>
              </NavigateToDefaultPage>
            </RoutesRequestProvider>
          </ACLRolesCheckProvider>
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
    this.app.schemaSettingsManager.add(userCenterSettings);
    this.app.addComponents({ AdminLayout, AdminDynamicPage });
  }
}

export function findRouteBySchemaUid(schemaUid: string, treeArray: any[]) {
  if (!treeArray) return;

  for (const node of treeArray) {
    if (schemaUid === node.schemaUid || schemaUid === node.menuSchemaUid) {
      return node;
    }

    if (node.children?.length) {
      const result = findRouteBySchemaUid(schemaUid, node.children);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

const MenuDesignerButton: FC<{ testId: string }> = (props) => {
  const { render: renderInitializer } = useSchemaInitializerRender(menuItemInitializer);

  return renderInitializer({
    style: { background: 'none' },
    'data-testid': props.testId,
  });
};

const MenuTitleWithIcon: FC<{ icon: any; title: string }> = (props) => {
  if (props.icon) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon type={props.icon} />
        <span>{props.title}</span>
      </div>
    );
  }

  return props.title;
};

function convertRoutesToLayout(
  routes: NocoBaseDesktopRoute[],
  { designable, parentRoute, isMobile, t, depth = 0 }: any,
) {
  if (!routes) return;

  const getInitializerButton = (testId: string) => {
    return {
      key: 'x-designer-button',
      name: <MenuDesignerButton testId={testId} />,
      path: '/',
      disabled: true,
      _route: {},
      _parentRoute: {},
      icon: <Icon type="setting" />,
    };
  };

  const result: any[] = routes.map((item) => {
    const name = depth > 1 ? <MenuTitleWithIcon icon={item.icon} title={t(item.title)} /> : t(item.title); // ProLayout 组件不显示第二级菜单的 icon，所以这里自己实现

    if (item.type === NocoBaseDesktopRouteType.link) {
      return {
        name,
        icon: item.icon ? <Icon type={item.icon} /> : null,
        path: '/',
        hideInMenu: item.hideInMenu,
        _route: item,
        _parentRoute: parentRoute,
      };
    }

    if (item.type === NocoBaseDesktopRouteType.page) {
      return {
        name,
        icon: item.icon ? <Icon type={item.icon} /> : null,
        path: `/admin/${item.schemaUid}`,
        redirect: `/admin/${item.schemaUid}`,
        hideInMenu: item.hideInMenu,
        _route: item,
        _parentRoute: parentRoute,
      };
    }

    if (item.type === NocoBaseDesktopRouteType.group) {
      const children =
        convertRoutesToLayout(item.children, { designable, parentRoute: item, depth: depth + 1, t }) || [];

      // add a designer button
      if (designable && depth === 0) {
        children.push({ ...getInitializerButton('schema-initializer-Menu-side'), _parentRoute: item });
      }

      return {
        name,
        icon: item.icon ? <Icon type={item.icon} /> : null,
        path: `/admin/${item.id}`,
        redirect:
          children[0]?.key === 'x-designer-button'
            ? undefined
            : `/admin/${findFirstPageRoute(item.children)?.schemaUid || item.id}`,
        routes: children.length === 0 ? [{ path: '/', name: ' ', disabled: true, _hidden: true }] : children,
        hideInMenu: item.hideInMenu,
        _route: item,
        _depth: depth,
      };
    }
  });

  if (designable && depth === 0) {
    isMobile
      ? result.push({ ...getInitializerButton('schema-initializer-Menu-header') })
      : result.unshift({ ...getInitializerButton('schema-initializer-Menu-header') });
  }

  return result;
}

function isGroup(groupId: string, allAccessRoutes: NocoBaseDesktopRoute[]) {
  const route = findRouteById(groupId, allAccessRoutes);
  return route?.type === NocoBaseDesktopRouteType.group;
}

function findRouteById(id: string, treeArray: any[]) {
  for (const node of treeArray) {
    if (Number(id) === Number(node.id)) {
      return node;
    }

    if (node.children?.length) {
      const result = findRouteById(id, node.children);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function findFirstPageRoute(routes: NocoBaseDesktopRoute[]) {
  if (!routes) return;

  for (const route of routes.filter((item) => !item.hideInMenu)) {
    if (route.type === NocoBaseDesktopRouteType.page) {
      return route;
    }

    if (route.type === NocoBaseDesktopRouteType.group && route.children?.length) {
      const result = findFirstPageRoute(route.children);
      if (result) return result;
    }
  }
}
