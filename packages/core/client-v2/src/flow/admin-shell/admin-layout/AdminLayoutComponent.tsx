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
import type { CollisionDetection, DragEndEvent } from '@dnd-kit/core';
import { closestCenter, pointerWithin } from '@dnd-kit/core';
import { EllipsisOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { DndProvider, observer, useFlowEngine } from '@nocobase/flow-engine';
import { theme as antdTheme, ConfigProvider, Grid, Popover } from 'antd';
import { createStyles, createGlobalStyle } from 'antd-style';
import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  AdminLayoutMenuModelRenderer,
  type AdminLayoutMenuNode,
  type AdminLayoutMenuRenderOptions,
  HeaderContext,
  MobileMenuControlContext,
  resolveAdminLayoutMenuDragMoveOptionsFromEvent,
} from './AdminLayoutMenuModels';
import type { AdminLayoutModel } from './AdminLayoutModel';
import { AdminLayoutContent } from './AdminLayoutSlotModels';
import { ADMIN_LAYOUT_MODEL_UID } from './constants';
import { ResetThemeTokenAndKeepAlgorithm } from './ResetThemeTokenAndKeepAlgorithm';
import { PinnedPluginListLite } from './PinnedPluginListLite';
import { useApplications } from './useApplications';
import { useGlobalTheme, type CustomToken } from '../../../theme';
import { useSystemSettings } from '../../system-settings';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../../../flow-compat';
import {
  FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT,
  FLOW_SETTINGS_PREFERENCE_STORAGE_KEY,
  readFlowSettingsPreference,
} from './flowSettingsPreference';

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

const NocoBaseLogo = observer(() => {
  const { token } = antdTheme.useToken();
  const customToken = token as CustomToken;
  const result = useSystemSettings();
  const { t } = useTranslation('lm-collections');
  const fontSizeStyle = useMemo(() => ({ fontSize: customToken.fontSizeHeading3 }), [customToken.fontSizeHeading3]);

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
});

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
const popoverStyle = css`
  .ant-popover-inner {
    padding: 0;
    overflow: hidden;
  }
`;

const CollapsedButton: FC<{ collapsed: boolean }> = (props) => {
  const { token } = antdTheme.useToken();
  const customToken = token as CustomToken;
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
                  left: ${props.collapsed ? 52 : (customToken.siderWidth || 200) - 12}px;
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

const actionsRender = (props: HeaderViewProps): React.ReactNode[] => {
  if (props.isMobile) {
    return [<MobileActions key="mobile-actions" />];
  }

  return [<PinnedPluginListLite key="pinned-plugin-list" />];
};

const rootStyle: React.CSSProperties = { display: 'flex', height: '100vh' };
const appContainerStyle: React.CSSProperties = {
  flex: 1,
  transform: 'translateZ(0)',
  overflow: 'hidden',
  scrollPaddingTop: 'var(--nb-header-height)', // 解决调用 scrollIntoView 时顶部菜单被遮挡的问题
};
const embedContainerStyle: React.CSSProperties = { width: 'fit-content', position: 'relative' };
const FLOAT_MENU_HOST_SELECTOR = '[data-has-float-menu="true"][data-float-menu-model-uid]';

const GlobalStyle = () => {
  const { token } = antdTheme.useToken();
  const customToken = token as CustomToken;
  const El: FC<any> = useMemo(() => {
    if (customToken.globalStyle) {
      return createGlobalStyle`${customToken.globalStyle}`;
    }
    return () => null;
  }, [customToken.globalStyle]);

  return <El />;
};

const MobileActions: FC = () => {
  const { token } = antdTheme.useToken();
  const customToken = token as CustomToken;
  const [open, setOpen] = useState(false);

  const handleContentClick = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Popover
      rootClassName={popoverStyle}
      content={<PinnedPluginListLite onClick={handleContentClick} />}
      color={customToken.colorBgHeader}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
    >
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', height: '100%', marginRight: -16 }}>
        <EllipsisOutlined
          style={{
            color: customToken.colorTextHeaderMenu,
            fontSize: 20,
          }}
        />
      </div>
    </Popover>
  );
};

/**
 * 用来调用 setIsMobileLayout 的组件
 * @param props
 * @returns
 */
function SetIsMobileLayout(props: { isMobile: boolean; children: any }) {
  const flowEngine = useFlowEngine();
  const adminLayoutModel = flowEngine.getModel<AdminLayoutModel>(ADMIN_LAYOUT_MODEL_UID);

  useEffect(() => {
    adminLayoutModel?.setIsMobileLayout(props.isMobile);
  }, [adminLayoutModel, props.isMobile]);

  return props.children;
}

const DesignerButtonMenuItem: FC<{ item: AdminLayoutMenuNode; fallbackParentRoute?: NocoBaseDesktopRoute }> = (
  props,
) => {
  const divRef = useRef<HTMLDivElement>(null);
  const parentRoute = props.item._parentRoute || props.fallbackParentRoute;
  const isHeaderDesignerButton = !parentRoute;

  useEffect(() => {
    if (divRef.current && isHeaderDesignerButton) {
      // 顶部 Add menu item 按钮放置在右侧
      divRef.current.parentElement.parentElement.style.order = '999';
      divRef.current.parentElement.parentElement.style.paddingLeft = '0';
      divRef.current.parentElement.parentElement.style.padding = '0';
    }
  }, [isHeaderDesignerButton]);

  return (
    <div ref={divRef}>
      <ResetThemeTokenAndKeepAlgorithm>{props.item.name}</ResetThemeTokenAndKeepAlgorithm>
    </div>
  );
};

const matchesRoutePath = (route: NocoBaseDesktopRoute | undefined, pathname: string): boolean => {
  if (!route) {
    return false;
  }

  const candidates = [
    route.id != null ? `/admin/${route.id}` : null,
    route.schemaUid ? `/admin/${route.schemaUid}` : null,
  ].filter(Boolean) as string[];

  if (candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`))) {
    return true;
  }

  return Array.isArray(route.children) ? route.children.some((child) => matchesRoutePath(child, pathname)) : false;
};

const findSelectedTopGroupRoute = (routes: NocoBaseDesktopRoute[], pathname: string) => {
  return routes.find((route) => route.type === NocoBaseDesktopRouteType.group && matchesRoutePath(route, pathname));
};

const renderMenuNodeWithModel = (
  item: AdminLayoutMenuNode,
  dom: React.ReactNode,
  renderType: 'item' | 'group',
  options?: AdminLayoutMenuRenderOptions,
  fallbackParentRoute?: NocoBaseDesktopRoute,
) => {
  const isDesignerButton =
    item?.key === 'x-designer-button' ||
    (item != null && item.disabled && !!item._launcherModel && !item?._route?.id && !item?._route?.schemaUid);

  if (isDesignerButton) {
    return <DesignerButtonMenuItem item={item} fallbackParentRoute={fallbackParentRoute} />;
  }

  if (item?._model) {
    return (
      <AdminLayoutMenuModelRenderer
        model={item._model}
        item={item}
        dom={dom}
        options={options}
        renderType={renderType}
        key={`admin-layout-menu-${renderType}-${item._model.uid}-${item.path}-${options?.isMobile}-${options?.collapsed}`}
      />
    );
  }

  return dom;
};

export const AdminLayoutComponent = observer((props: any) => {
  const flowEngine = useFlowEngine();
  const adminLayoutModel = flowEngine.getModel<AdminLayoutModel>(ADMIN_LAYOUT_MODEL_UID);
  const [allAccessRoutes, setAllAccessRoutes] = useState<NocoBaseDesktopRoute[]>(
    () => flowEngine.context.routeRepository?.listAccessible?.() || [],
  );
  const screens = Grid.useBreakpoint();
  const isMobileViewport =
    screens.md === false || (screens.md === undefined && typeof window !== 'undefined' && window.innerWidth < 768);
  const location = useLocation();
  const { token } = antdTheme.useToken();
  const customToken = token as CustomToken;
  const isMobileLayout = !!adminLayoutModel?.isMobileLayout;
  const isMobileSider = isMobileLayout || isMobileViewport;
  const [collapsed, setCollapsed] = useState(isMobileSider);
  const [preferredFlowSettingsEnabled, setPreferredFlowSettingsEnabled] = useState(() => readFlowSettingsPreference());
  const [route, setRoute] = useState<{ path: string; children: AdminLayoutMenuNode[] }>({
    path: '/',
    children: [],
  });
  const doNotChangeCollapsedRef = useRef(false);
  const t = useCallback(
    (value: any) =>
      typeof flowEngine.context.t === 'function' ? flowEngine.context.t(value, { ns: 'lm-desktop-routes' }) : value,
    [flowEngine],
  );
  const designable = !isMobileSider && preferredFlowSettingsEnabled;
  const { styles } = useHeaderStyle();
  const { Component: AppsComponent } = useApplications();
  const flowSettingsSyncRef = useRef(0);
  const desiredFlowSettingsEnabledRef = useRef(false);
  const handleLayoutContentElementChange = useCallback(
    (element: HTMLDivElement | null) => {
      adminLayoutModel?.setLayoutContentElement(element);
    },
    [adminLayoutModel],
  );
  const selectedTopGroupRoute = useMemo(
    () => findSelectedTopGroupRoute(allAccessRoutes, location.pathname),
    [allAccessRoutes, location.pathname],
  );

  const handleMenuDragEnd = useCallback(
    (event: DragEndEvent) => {
      const moveOptions = resolveAdminLayoutMenuDragMoveOptionsFromEvent(flowEngine, event);

      if (!moveOptions) {
        return;
      }

      void flowEngine.context.routeRepository.moveRoute(moveOptions).catch((error) => {
        console.error('[NocoBase] AdminLayoutShell failed to move menu route.', error);
      });
    },
    [flowEngine],
  );

  const menuCollisionDetection = useCallback<CollisionDetection>(
    ({ droppableContainers, pointerCoordinates, ...args }) => {
      if (pointerCoordinates && typeof document !== 'undefined') {
        const elementUnderPointer = document.elementFromPoint(pointerCoordinates.x, pointerCoordinates.y);
        const hostModelUid = elementUnderPointer
          ?.closest(FLOAT_MENU_HOST_SELECTOR)
          ?.getAttribute('data-float-menu-model-uid');

        if (hostModelUid) {
          const matchedDroppable = droppableContainers.find((container) => String(container.id) === hostModelUid);
          if (matchedDroppable) {
            return [
              {
                id: matchedDroppable.id,
                data: {
                  droppableContainer: matchedDroppable,
                  value: Number.MAX_SAFE_INTEGER,
                },
              },
            ];
          }
        }
      }

      const pointerCollisions = pointerWithin({ droppableContainers, pointerCoordinates, ...args });
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }

      return closestCenter({ droppableContainers, pointerCoordinates, ...args });
    },
    [],
  );

  useEffect(() => {
    const routeRepository = flowEngine.context.routeRepository;
    const subscriber = () => {
      const updatedRoutes = routeRepository?.listAccessible() || [];
      setAllAccessRoutes(updatedRoutes);
    };

    routeRepository?.subscribe(subscriber);
    routeRepository?.ensureAccessibleLoaded?.().catch((error) => {
      console.error('[NocoBase] AdminLayoutComponent failed to initialize accessible routes.', error);
    });

    return () => {
      routeRepository?.unsubscribe(subscriber);
    };
  }, [flowEngine]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncPreferredFlowSettings = () => {
      setPreferredFlowSettingsEnabled(readFlowSettingsPreference());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== FLOW_SETTINGS_PREFERENCE_STORAGE_KEY) {
        return;
      }

      syncPreferredFlowSettings();
    };

    window.addEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, syncPreferredFlowSettings);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, syncPreferredFlowSettings);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useLayoutEffect(() => {
    adminLayoutModel?.syncMenuRoutes(allAccessRoutes);
    const nextRoute = adminLayoutModel?.toProLayoutRoute({
      designable,
      isMobile: isMobileSider,
      t,
    }) || {
      path: '/',
      children: [],
    };
    setRoute(nextRoute);
  }, [adminLayoutModel, allAccessRoutes, designable, isMobileSider, t]);

  useEffect(() => {
    const syncId = ++flowSettingsSyncRef.current;
    const shouldEnable = preferredFlowSettingsEnabled && !isMobileSider;
    desiredFlowSettingsEnabledRef.current = shouldEnable;

    const applyFlowSettingsState = async (enabled: boolean) => {
      if (enabled) {
        await flowEngine.flowSettings.enable();
        return;
      }
      await flowEngine.flowSettings.disable();
    };

    const syncFlowSettings = async () => {
      try {
        await applyFlowSettingsState(shouldEnable);
        if (syncId !== flowSettingsSyncRef.current) {
          await applyFlowSettingsState(desiredFlowSettingsEnabledRef.current);
        }
      } catch (error) {
        console.error('[NocoBase] AdminLayoutShell failed to sync flow settings state.', error);
      }
    };

    void syncFlowSettings();

    return () => {
      if (flowSettingsSyncRef.current === syncId) {
        flowSettingsSyncRef.current += 1;
      }
    };
  }, [flowEngine, isMobileSider, preferredFlowSettingsEnabled]);

  const layoutToken = useMemo(() => {
    return {
      header: {
        colorBgHeader: customToken.colorBgHeader,
        colorTextMenu: customToken.colorTextHeaderMenu,
        colorTextMenuSelected: customToken.colorTextHeaderMenuActive,
        colorTextMenuActive: customToken.colorTextHeaderMenuHover,
        colorBgMenuItemHover: customToken.colorBgHeaderMenuHover,
        colorBgMenuItemSelected: customToken.colorBgHeaderMenuActive,
        heightLayoutHeader: 46,
        colorHeaderTitle: customToken.colorTextHeaderMenu,
      },
      sider: {
        colorMenuBackground: customToken.colorBgSider,
        colorTextMenu: customToken.colorTextSiderMenu,
        colorTextMenuSelected: customToken.colorTextSiderMenuActive,
        colorBgMenuItemSelected: customToken.colorBgSiderMenuActive,
        colorBgMenuItemActive: customToken.colorBgSiderMenuActive,
        colorBgMenuItemHover: customToken.colorBgSiderMenuHover,
      },
      bgLayout: customToken.colorBgLayout,
    };
  }, [customToken]);
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

  const menuItemRender = useCallback(
    (item, dom, options) => {
      const fallbackParentRoute = options?.menuRenderType === 'header' ? undefined : selectedTopGroupRoute;
      return renderMenuNodeWithModel(item as AdminLayoutMenuNode, dom, 'item', options, fallbackParentRoute);
    },
    [selectedTopGroupRoute],
  );

  const subMenuItemRender = useCallback(
    (item, dom) => {
      return renderMenuNodeWithModel(item as AdminLayoutMenuNode, dom, 'group', undefined, selectedTopGroupRoute);
    },
    [selectedTopGroupRoute],
  );

  return (
    <div style={rootStyle}>
      <div id="nocobase-app-container" style={appContainerStyle}>
        <MobileMenuControlContext.Provider value={{ closeMobileMenu }}>
          <DndProvider collisionDetection={menuCollisionDetection} onDragEnd={handleMenuDragEnd}>
            <ProLayout
              {...props}
              contentStyle={contentStyle}
              siderWidth={customToken.siderWidth || 200}
              className={resetStyle}
              location={location}
              route={route}
              actionsRender={props.actionsRender || actionsRender}
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
                        <AdminLayoutContent onContentElementChange={handleLayoutContentElementChange} />
                      </ConfigProvider>
                    </SetIsMobileLayout>
                  );
                }}
              </RouteContext.Consumer>
            </ProLayout>
          </DndProvider>
        </MobileMenuControlContext.Provider>
      </div>
      <div id="nocobase-embed-container" style={embedContainerStyle}></div>
    </div>
  );
});
