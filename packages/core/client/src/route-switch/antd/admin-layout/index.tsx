/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ProLayout, { RouteContext, RouteContextType } from '@ant-design/pro-layout';
import { HeaderViewProps } from '@ant-design/pro-layout/es/components/Header';
import { css } from '@emotion/css';
import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { theme as antdTheme, Badge, ConfigProvider, Grid, Tooltip } from 'antd';
import { createStyles, createGlobalStyle } from 'antd-style';
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  AdminDynamicPage,
  AdminShellProvider,
  NocoBaseDesktopRoute,
  NocoBaseDesktopRouteType,
  NocoBaseRouteContext,
  MobileLayoutProvider,
  useAllAccessDesktopRoutes,
  useMobileLayout,
  findFirstPageRoute,
} from '../../../admin-shell';
import {
  DndContext,
  Icon,
  ParentRouteContext,
  RemoteSchemaTemplateManagerPlugin,
  SortableItem,
  useDesignable,
  useGlobalTheme,
  useMenuDragEnd,
  useParseURLAndParams,
  useRouterBasename,
  useSchemaInitializerRender,
  useSystemSettings,
  useToken,
} from '../../../';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { Plugin } from '../../../application/Plugin';
import { navigateWithinSelf } from '../../../block-provider/hooks';
import { withTooltipComponent } from '../../../hoc/withTooltipComponent';
import { useEvaluatedExpression } from '../../../hooks/useParsedValue';
import { menuItemInitializer } from '../../../modules/menu/menuItemInitializer';
import { useMenuTranslation } from '../../../schema-component/antd/menu/locale';
import { VariableScope } from '../../../variables/VariableScope';
import { MenuSchemaToolbar, ResetThemeTokenAndKeepAlgorithm } from './menuItemSettings';
import { runAfterMobileMenuClosed } from './mobileMenuNavigation';
import { userCenterSettings } from './userCenterSettings';
import { useApplications } from './useApplications';
import { AdminLayoutModel } from './AdminLayoutModel';
import { AdminLayoutMenuItemModel, AdminLayoutMenuTreeModel } from './AdminLayoutMenuModels';
import { AdminLayoutContentModel, AdminLayoutHeaderActionsModel } from './AdminLayoutSlotModels';

export * from './useDeleteRouteSchema';
export {
  AdminDynamicPage,
  KeepAlive,
  LayoutContent,
  NocoBaseDesktopRouteType,
  NocoBaseRouteContext,
  findFirstPageRoute,
  findRouteBySchemaUid,
  useAllAccessDesktopRoutes,
  useCurrentRoute,
  useKeepAlive,
  useMobileLayout,
} from '../../../admin-shell';

const ADMIN_LAYOUT_MODEL_UID = 'admin-layout-model';

const className1 = css`
  height: var(--nb-header-height);
  margin-right: 4px;
  display: inline-flex;
  flex-shrink: 0;
  color: #fff;
  padding: 0;
  align-items: center;
`;
const className1WithFixedWidth = css`
  ${className1}
  width: 168px;
`;
const className1WithAutoWidth = css`
  ${className1}
  width: auto;
  min-width: 168px;
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

const NocoBaseLogo = () => {
  const result = useSystemSettings();
  const { token } = useToken();
  const { t } = useTranslation('lm-collections');
  const fontSizeStyle = useMemo(() => ({ fontSize: token.fontSizeHeading3 }), [token.fontSizeHeading3]);

  const hasLogo = result?.data?.data?.logo?.url;
  const logo = hasLogo ? (
    <img className={className2} src={result?.data?.data?.logo?.url} />
  ) : (
    <span style={fontSizeStyle} className={className3}>
      {t(result?.data?.data?.title)}
    </span>
  );

  return (
    <div className={hasLogo ? className1WithFixedWidth : className1WithAutoWidth}>{result?.loading ? null : logo}</div>
  );
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

const menuItemStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const MobileMenuControlContext = React.createContext<{
  closeMobileMenu: () => void;
}>({
  closeMobileMenu: () => {},
});

const GroupItem: FC<{ item: any }> = (props) => {
  const { item } = props;
  const { designable } = useDesignable();
  const badgeCount = useEvaluatedExpression(item._route.options?.badge?.count);

  // fake schema used to pass routing information to SortableItem
  const fakeSchema: any = { __route__: item._route };

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <SortableItem id={item._route.id} schema={fakeSchema} aria-label={item.name} style={menuItemStyle}>
          {props.children}
          {designable && <MenuSchemaToolbarWithContainer />}
          {badgeCount != null && (
            <Badge
              {...item._route.options.badge}
              count={badgeCount}
              style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
              dot={false}
            ></Badge>
          )}
        </SortableItem>
      </NocoBaseRouteContext.Provider>
    </ParentRouteContext.Provider>
  );
};

const WithTooltip: FC<{ title: string; hidden: boolean; badgeProps: any }> = (props) => {
  const { inHeader } = useContext(HeaderContext);

  return (
    <RouteContext.Consumer>
      {(context) =>
        context.collapsed && !props.hidden && !inHeader ? (
          <Tooltip title={props.title} placement="right">
            <Badge {...props.badgeProps} style={{ transform: 'none', maxWidth: '10em' }} dot={false}>
              {props.children}
            </Badge>
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
  const badgeCount = useEvaluatedExpression(item._route.options?.badge?.count);
  const navigate = useNavigateNoUpdate();
  const basenameOfCurrentRouter = useRouterBasename();
  const { closeMobileMenu } = useContext(MobileMenuControlContext);
  // 如果点击的是一个 group，直接跳转到第一个子页面
  const path = item.redirect || item.path;
  const badgeProps = { ...item._route.options?.badge, count: badgeCount };

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
          if (props.options?.isMobile) {
            closeMobileMenu();
          }
          window.open(url, '_blank');
        } else {
          runAfterMobileMenuClosed({
            isMobile: !!props.options?.isMobile,
            closeMobileMenu,
            callback: () => {
              navigateWithinSelf(href, navigate, window.location.origin + basenameOfCurrentRouter);
            },
          });
        }
      } catch (err) {
        console.error(err);
        if (props.options?.isMobile) {
          closeMobileMenu();
        }
        window.open(href, '_blank');
      }
    },
    [parseURLAndParams, item, props.options?.isMobile, closeMobileMenu, navigate, basenameOfCurrentRouter],
  );

  const handleClickMenuItem = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!props.options?.isMobile) {
        navigate(path);
        return;
      }

      // 移动端先收起菜单，再跳转，避免返回时菜单残留在打开态。
      runAfterMobileMenuClosed({
        isMobile: !!props.options?.isMobile,
        closeMobileMenu,
        callback: () => {
          navigate(path);
        },
      });
    },
    [props.options?.isMobile, closeMobileMenu, navigate, path],
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
          <SortableItem id={item._route.id} schema={fakeSchema} style={menuItemStyle}>
            <div onClick={handleClickLink}>
              {/* 这里是为了扩大点击区域 */}
              <Link to={location.pathname} aria-label={item.name}>
                {props.children}
              </Link>
            </div>
            <MenuSchemaToolbar />
            {badgeCount != null && (
              <Badge
                {...item._route.options?.badge}
                count={badgeCount}
                style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
                dot={false}
              ></Badge>
            )}
          </SortableItem>
        </NocoBaseRouteContext.Provider>
      </ParentRouteContext.Provider>
    );
  }

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <SortableItem id={item._route.id} schema={fakeSchema} style={menuItemStyle}>
          <WithTooltip
            title={item.name}
            hidden={item._route.type === NocoBaseDesktopRouteType.group || item._depth > 0}
            badgeProps={badgeProps}
          >
            <Link to={path} aria-label={item.name} onClick={handleClickMenuItem}>
              {props.children}
            </Link>
          </WithTooltip>
          <MenuSchemaToolbar />
          {badgeCount != null && (
            <Badge
              {...badgeProps}
              style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
              dot={false}
            ></Badge>
          )}
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

const HeaderContext = React.createContext<{ inHeader: boolean }>({ inHeader: false });

const MenuItemTitle: React.FC = (props) => {
  return <>{props.children}</>;
};

const MenuItemTitleWithTooltip = withTooltipComponent(MenuItemTitle);

const menuItemRender = (item, dom, options) => {
  return (
    <VariableScope scopeId={item._route.schemaUid} type="menuItem">
      <MenuItem item={item} options={options}>
        <MenuItemTitleWithTooltip tooltip={item._route?.tooltip}>{dom}</MenuItemTitleWithTooltip>
      </MenuItem>
    </VariableScope>
  );
};

const subMenuItemRender = (item, dom) => {
  return (
    <VariableScope scopeId={item._route.schemaUid} type="groupItem">
      <GroupItem item={item}>
        <MenuItemTitleWithTooltip tooltip={item._route?.tooltip}>{dom}</MenuItemTitleWithTooltip>
      </GroupItem>
    </VariableScope>
  );
};

const CollapsedButton: FC<{ collapsed: boolean }> = (props) => {
  const { token } = useToken();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setContainer(document.querySelector<HTMLDivElement>('#nocobase-app-container'));
  }, []);

  if (!container) {
    return null;
  }

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
                  left: ${props.collapsed ? 52 : (token.siderWidth || 200) - 12}px;
                  z-index: 200;
                  transition: left 0.2s;
                }
              `}
            >
              {props.children}
            </div>,
            container,
          )
        )
      }
    </RouteContext.Consumer>
  );
};

const collapsedButtonRender = (collapsed, dom) => {
  return <CollapsedButton collapsed={collapsed}>{dom}</CollapsedButton>;
};

/**
 * 这个问题源自 antd 的一个 bug，等 antd 修复了这个问题后，可以删除这个样式。
 * - issue: https://github.com/ant-design/pro-components/issues/8593
 * - issue: https://github.com/ant-design/pro-components/issues/8522
 * - issue: https://github.com/ant-design/pro-components/issues/8432
 */
const useHeaderStyle = createStyles(({ token }: any) => {
  return {
    headerPopup: {
      '&.ant-menu-submenu-popup>.ant-menu': {
        backgroundColor: `${token.colorBgHeader}`,
      },
    },
    headerMenuActive: {
      '& .ant-menu-submenu-selected>.ant-menu-submenu-title': {
        color: token.colorTextHeaderMenuActive,
      },
    },
  };
});
const headerContextValue = { inHeader: true };
const HeaderWrapper: FC = (props) => {
  const { styles } = useHeaderStyle();

  return (
    <span className={styles.headerMenuActive}>
      <HeaderContext.Provider value={headerContextValue}>{props.children}</HeaderContext.Provider>
    </span>
  );
};
const headerRender = (props: HeaderViewProps, defaultDom: React.ReactNode) => {
  return <HeaderWrapper>{defaultDom}</HeaderWrapper>;
};

/**
 * 渲染 Layout 内容区子模型。
 *
 * 这里仍然由 `InternalAdminLayout` 控制 ProLayout 容器，
 * 但页面主体已经改为从 root model 的 `layoutContent` slot 读取。
 */
const AdminLayoutContentSlot = () => {
  const flowEngine = useFlowEngine();
  const model = flowEngine.getModel<AdminLayoutModel>(ADMIN_LAYOUT_MODEL_UID)?.subModels.layoutContent;

  if (!model) {
    return null;
  }

  return <FlowModelRenderer model={model} />;
};

/**
 * 渲染 Layout 右上角操作区子模型。
 *
 * 当前阶段仅把原有插件区收口到 FlowModel，
 * 后续再继续拆成更细的 header subModels。
 */
const AdminLayoutHeaderActionsSlot: FC<{ isMobile?: boolean }> = ({ isMobile }) => {
  const flowEngine = useFlowEngine();
  const model = flowEngine.getModel<AdminLayoutModel>(ADMIN_LAYOUT_MODEL_UID)?.subModels.headerActions;

  if (!model) {
    return null;
  }

  return <FlowModelRenderer model={model.createFork({ isMobile }, `admin-layout-header-actions-${isMobile}`)} />;
};

const actionsRender: any = (props) => {
  return <AdminLayoutHeaderActionsSlot isMobile={props.isMobile} />;
};

const rootStyle: React.CSSProperties = { display: 'flex', height: '100vh' };
const appContainerStyle: React.CSSProperties = {
  flex: 1,
  transform: 'translateZ(0)',
  overflow: 'hidden',
  scrollPaddingTop: 'var(--nb-header-height)', // 解决调用 scrollIntoView 时顶部菜单被遮挡的问题
};
const embedContainerStyle: React.CSSProperties = { width: 'fit-content', position: 'relative' };

const GlobalStyle = () => {
  const { token } = useToken();
  const El: FC<any> = useMemo(() => {
    if (token.globalStyle) {
      return createGlobalStyle`${token.globalStyle}`;
    }
    return () => null;
  }, [token.globalStyle]);

  return <El />;
};

export const InternalAdminLayout = (props) => {
  const flowEngine = useFlowEngine();
  const adminLayoutModel = flowEngine.getModel<AdminLayoutModel>(ADMIN_LAYOUT_MODEL_UID);
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const { designable: _designable } = useDesignable();
  const screens = Grid.useBreakpoint();
  const isMobileViewport =
    screens.md === false || (screens.md === undefined && typeof window !== 'undefined' && window.innerWidth < 768);
  const location = useLocation();
  const { onDragEnd } = useMenuDragEnd();
  const { token } = useToken();
  const { isMobileLayout } = useMobileLayout();
  const isMobileSider = isMobileLayout || isMobileViewport;
  const [collapsed, setCollapsed] = useState(isMobileSider);
  const doNotChangeCollapsedRef = useRef(false);
  const { t } = useMenuTranslation();
  const designable = isMobileSider ? false : _designable;
  const { styles } = useHeaderStyle();
  const { Component: AppsComponent } = useApplications();

  useEffect(() => {
    adminLayoutModel?.syncMenuRoutes(allAccessRoutes);
  }, [adminLayoutModel, allAccessRoutes]);

  const route = useMemo(() => {
    // 菜单首屏直接基于最新路由派生，避免复用旧 model 时短暂渲染出过期菜单。
    const children = convertRoutesToLayout(allAccessRoutes, {
      designable,
      isMobile: isMobileSider,
      t,
    });
    return {
      path: '/',
      children: Array.isArray(children) ? children : [],
    };
  }, [allAccessRoutes, designable, isMobileSider, t]);
  const layoutToken = useMemo(() => {
    return {
      header: {
        colorBgHeader: token.colorBgHeader,
        colorTextMenu: token.colorTextHeaderMenu,
        colorTextMenuSelected: token.colorTextHeaderMenuActive,
        colorTextMenuActive: token.colorTextHeaderMenuHover,
        colorBgMenuItemHover: token.colorBgHeaderMenuHover,
        colorBgMenuItemSelected: token.colorBgHeaderMenuActive,
        heightLayoutHeader: 46,
        colorHeaderTitle: token.colorTextHeaderMenu,
      },
      sider: {
        colorMenuBackground: token.colorBgSider,
        colorTextMenu: token.colorTextSiderMenu,
        colorTextMenuSelected: token.colorTextSiderMenuActive,
        colorBgMenuItemSelected: token.colorBgSiderMenuActive,
        colorBgMenuItemActive: token.colorBgSiderMenuActive,
        colorBgMenuItemHover: token.colorBgSiderMenuHover,
      },
      bgLayout: token.colorBgLayout,
    };
  }, [token]);
  const { theme, isDarkTheme } = useGlobalTheme();
  const mobileTheme = useMemo(() => {
    return {
      ...theme,
      token: {
        ...theme.token,
        paddingPageHorizontal: 8, // Horizontal page padding
        paddingPageVertical: 8, // Vertical page padding
        marginBlock: 12, // Spacing between blocks
        borderRadiusBlock: 8, // Block border radius
        fontSize: 16, // Font size
      },
      algorithm: isDarkTheme ? [antdTheme.compactAlgorithm, antdTheme.darkAlgorithm] : antdTheme.compactAlgorithm, // Set mobile mode to always use compact algorithm
    };
  }, [theme, isDarkTheme]);

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

  const menuProps = useMemo(() => {
    return {
      overflowedIndicatorPopupClassName: styles.headerPopup,
    };
  }, [styles.headerPopup]);

  const closeMobileMenu = useCallback(() => {
    if (!isMobileSider) {
      return;
    }
    setCollapsed(true);
  }, [isMobileSider]);

  return (
    <div style={rootStyle}>
      <div id="nocobase-app-container" style={appContainerStyle}>
        <MobileMenuControlContext.Provider value={{ closeMobileMenu }}>
          <DndContext onDragEnd={onDragEnd}>
            <ProLayout
              {...props}
              contentStyle={contentStyle}
              siderWidth={token.siderWidth || 200}
              className={resetStyle}
              location={location}
              route={route}
              actionsRender={actionsRender}
              logo={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {AppsComponent && <AppsComponent />}
                  <NocoBaseLogo />
                </div>
              }
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
              menu={{
                // 1.x 暂默认禁用菜单手风琴效果，2.x 支持配置
                autoClose: false,
              }}
              menuProps={menuProps}
            >
              <RouteContext.Consumer>
                {(value: RouteContextType) => {
                  const { isMobile } = value;

                  return (
                    <SetIsMobileLayout isMobile={isMobile}>
                      <ConfigProvider theme={isMobile ? mobileTheme : theme}>
                        <GlobalStyle />
                        <AdminLayoutContentSlot />
                      </ConfigProvider>
                    </SetIsMobileLayout>
                  );
                }}
              </RouteContext.Consumer>
            </ProLayout>
          </DndContext>
        </MobileMenuControlContext.Provider>
      </div>
      <div id="nocobase-embed-container" style={embedContainerStyle}></div>
    </div>
  );
};

/**
 * 用来调用 setIsMobileLayout 的组件
 * @param props
 * @returns
 */
function SetIsMobileLayout(props: { isMobile: boolean; children: any }) {
  const { setIsMobileLayout } = useMobileLayout();

  useEffect(() => {
    setIsMobileLayout(props.isMobile);
  }, [props.isMobile, setIsMobileLayout]);

  return props.children;
}

export const AdminProvider = AdminShellProvider;

export const AdminLayout = (props) => {
  const flowEngine = useFlowEngine();
  const modelRef = useRef<AdminLayoutModel>(null);
  const modelChildren = (
    <AdminProvider>
      <InternalAdminLayout {...props} />
    </AdminProvider>
  );

  if (!modelRef.current) {
    modelRef.current =
      flowEngine.getModel<AdminLayoutModel>(ADMIN_LAYOUT_MODEL_UID) ||
      flowEngine.createModel<AdminLayoutModel>({
        uid: ADMIN_LAYOUT_MODEL_UID,
        use: AdminLayoutModel,
        props: { ...props, children: modelChildren },
      });
  }

  const model = modelRef.current;

  useEffect(() => {
    model.setProps({ ...props, children: modelChildren });
  }, [model, modelChildren, props]);

  return <FlowModelRenderer model={model} />;
};

export class AdminLayoutPlugin extends Plugin {
  async afterAdd() {
    await this.app.pm.add(RemoteSchemaTemplateManagerPlugin);
  }
  async load() {
    this.app.flowEngine.registerModels({
      AdminLayoutModel,
      AdminLayoutMenuTreeModel,
      AdminLayoutMenuItemModel,
      AdminLayoutContentModel,
      AdminLayoutHeaderActionsModel,
    });
    this.app.schemaSettingsManager.add(userCenterSettings);
    this.app.addComponents({ AdminLayout, AdminDynamicPage });
    this.app.use(MobileLayoutProvider);
  }
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

  return <>{props.title}</>;
};

export const shouldRenderIconInTitle = ({ depth, isMobile }: { depth: number; isMobile: boolean }) => {
  // ProLayout 在深层菜单和移动端侧栏一级菜单里都可能忽略 icon 字段，因此统一把图标渲染到标题内部。
  return depth > 1 || (isMobile && depth > 0);
};

function convertRoutesToLayout(
  routes: NocoBaseDesktopRoute[],
  { designable, parentRoute, isMobile, t, depth = 0 }: any,
) {
  if (!routes || !Array.isArray(routes)) return [];

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

  const result: any[] = routes
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const shouldShowIconInTitle = shouldRenderIconInTitle({ depth, isMobile });
      const name = shouldShowIconInTitle ? <MenuTitleWithIcon icon={item.icon} title={t(item.title)} /> : t(item.title);
      const icon = shouldShowIconInTitle ? null : item.icon ? <Icon type={item.icon} /> : null;

      if (item.type === NocoBaseDesktopRouteType.link) {
        return {
          name,
          icon,
          path: '/',
          hideInMenu: item.hideInMenu,
          _route: item,
          _parentRoute: parentRoute,
          _depth: depth,
        };
      }

      if (item.type === NocoBaseDesktopRouteType.page) {
        return {
          name,
          icon,
          path: `/admin/${item.schemaUid}`,
          redirect: `/admin/${item.schemaUid}`,
          hideInMenu: item.hideInMenu,
          _route: item,
          _parentRoute: parentRoute,
          _depth: depth,
        };
      }

      if (item.type === NocoBaseDesktopRouteType.flowPage) {
        return {
          name,
          icon,
          path: `/admin/${item.schemaUid}`,
          redirect: `/admin/${item.schemaUid}`,
          hideInMenu: item.hideInMenu,
          _route: item,
          _parentRoute: parentRoute,
          _depth: depth,
        };
      }

      if (item.type === NocoBaseDesktopRouteType.group) {
        const itemChildren = Array.isArray(item.children) ? item.children : [];
        const children =
          convertRoutesToLayout(itemChildren, { designable, parentRoute: item, depth: depth + 1, isMobile, t }) || [];

        // add a designer button
        if (designable && depth === 0) {
          children.push({ ...getInitializerButton('schema-initializer-Menu-side'), _parentRoute: item });
        }

        const groupRoute: any = {
          name,
          icon,
          path: `/admin/${item.id}`,
          redirect:
            children[0]?.key === 'x-designer-button'
              ? undefined
              : `/admin/${findFirstPageRoute(itemChildren)?.schemaUid || item.id}`,
          hideInMenu: item.hideInMenu,
          _route: item,
          _depth: depth,
        };

        if (children.length > 0) {
          groupRoute.routes = children;
        }

        return groupRoute;
      }

      return null;
    })
    .filter(Boolean);

  if (designable && depth === 0) {
    isMobile
      ? result.push({ ...getInitializerButton('schema-initializer-Menu-header') })
      : result.unshift({ ...getInitializerButton('schema-initializer-Menu-header') });
  }

  return result;
}
