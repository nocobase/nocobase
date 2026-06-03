/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AppstoreOutlined,
  BellOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  HighlightOutlined,
  HomeOutlined,
  LinkOutlined,
  MobileOutlined,
  PlusOutlined,
  QrcodeOutlined,
  SettingOutlined,
  TabletOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { BaseLayoutModel } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { Dropdown, Grid, type MenuProps, Popover, QRCode, theme, Tooltip } from 'antd';
import React, { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useOutlet } from 'react-router-dom';
import { NAMESPACE } from '../../constants';
import { MobileRootPageModel } from './MobilePageModels';

type FakeMobileDesktopRoute = {
  key: string;
  schemaUid: string;
  type: 'page' | 'link';
  label: string;
  description?: string;
  icon: ReactNode;
  sort: number;
  hideInMenu?: boolean;
  children?: FakeMobileDesktopRoute[];
};

type MobileHomeTabItem = {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

type MobileHomeAddMenuKey = 'page' | 'link';
type MobileHomeAddMenuItem = {
  key: MobileHomeAddMenuKey;
  label: string;
  icon: ReactNode;
};

type Translate = (key: string) => string;
type MobilePreviewSize = {
  width: number;
  height: number;
};
type MobileLayoutThemeToken = {
  colorSettings?: string;
  colorTextHeaderMenu?: string;
};

const MOBILE_PREVIEW_SIZE: MobilePreviewSize = {
  width: 390,
  height: 812,
};

const PAD_PREVIEW_SIZE: MobilePreviewSize = {
  width: 768,
  height: 667,
};

class MobileHomeRootPagePreviewModel extends MobileRootPageModel {
  content: ReactNode = null;

  onMount() {
    // Preview-only model: reuse MobileRootPageModel.render() without binding real route/view lifecycle.
  }

  protected onUnmount() {
    // Preview-only model: no lifecycle resources are registered.
  }

  renderFirstTab() {
    return this.content;
  }
}

function getVisibleDesktopRoutes(routes: FakeMobileDesktopRoute[]) {
  return [...routes].filter((route) => !route.hideInMenu).sort((a, b) => a.sort - b.sort);
}

export function createFakeMobileDesktopRoutes(t: Translate): FakeMobileDesktopRoute[] {
  return [
    {
      key: 'home',
      schemaUid: 'mobile-route-home',
      type: 'page',
      label: t('Home'),
      description: t('Daily overview'),
      icon: <HomeOutlined />,
      sort: 10,
      children: [
        {
          key: 'workbench',
          schemaUid: 'mobile-route-workbench-dashboard',
          type: 'page',
          label: t('Workbench'),
          description: t('Daily overview'),
          icon: <AppstoreOutlined />,
          sort: 10,
        },
        {
          key: 'tasks',
          schemaUid: 'mobile-route-workbench-tasks',
          type: 'page',
          label: t('Tasks'),
          description: t('Pending items'),
          icon: <CheckSquareOutlined />,
          sort: 20,
        },
        {
          key: 'customers',
          schemaUid: 'mobile-route-workbench-customers',
          type: 'page',
          label: t('Customers'),
          description: t('Customer records'),
          icon: <TeamOutlined />,
          sort: 30,
        },
        {
          key: 'reports',
          schemaUid: 'mobile-route-workbench-reports',
          type: 'page',
          label: t('Reports'),
          description: t('Data reports'),
          icon: <FileTextOutlined />,
          sort: 40,
        },
      ],
    },
    {
      key: 'notifications',
      schemaUid: 'mobile-route-notifications',
      type: 'page',
      label: t('Notifications'),
      icon: <BellOutlined />,
      sort: 20,
    },
    {
      key: 'settings',
      schemaUid: 'mobile-route-settings',
      type: 'page',
      label: t('Settings'),
      icon: <SettingOutlined />,
      sort: 30,
    },
  ];
}

export function createMobileHomeMenuItems(t: Translate): FakeMobileDesktopRoute[] {
  const [homeRoute] = getVisibleDesktopRoutes(createFakeMobileDesktopRoutes(t));

  return getVisibleDesktopRoutes(homeRoute?.children || []);
}

export function createMobileHomeTabItemsFromDesktopRoutes(
  routes: FakeMobileDesktopRoute[],
  activeRouteKey?: string,
): MobileHomeTabItem[] {
  const visibleRoutes = getVisibleDesktopRoutes(routes);
  const fallbackActiveKey = visibleRoutes[0]?.key;
  const currentActiveKey = activeRouteKey || fallbackActiveKey;

  return visibleRoutes.map((route) => ({
    key: route.key,
    label: route.label,
    icon: route.icon,
    active: route.key === currentActiveKey,
  }));
}

export function createMobileHomeTabItems(t: Translate): MobileHomeTabItem[] {
  return createMobileHomeTabItemsFromDesktopRoutes(createFakeMobileDesktopRoutes(t));
}

export function createMobileHomeAddMenuItems(t: Translate): MobileHomeAddMenuItem[] {
  return [
    {
      key: 'page',
      label: t('Page'),
      icon: <FileTextOutlined />,
    },
    {
      key: 'link',
      label: t('Link'),
      icon: <LinkOutlined />,
    },
  ];
}

function createRuntimeMobileDesktopRoute(
  type: MobileHomeAddMenuKey,
  index: number,
  t: Translate,
): FakeMobileDesktopRoute {
  const label = type === 'page' ? t('Page') : t('Link');

  return {
    key: `${type}-${index}`,
    schemaUid: `mobile-route-${type}-${index}`,
    type,
    label: index === 1 ? label : `${label} ${index}`,
    icon: type === 'page' ? <FileTextOutlined /> : <LinkOutlined />,
    sort: 100 + index,
  };
}

function useIsDesktopPreview(screenMD: number) {
  const screens = Grid.useBreakpoint();
  if (typeof screens.md === 'boolean') {
    return screens.md;
  }

  return typeof window === 'undefined' || window.innerWidth >= screenMD;
}

const MobileLayoutComponent = observer((props: { model: MobileLayoutModel }) => {
  const { model } = props;
  const outlet = useOutlet();
  const { token } = theme.useToken();
  const isDesktopPreview = useIsDesktopPreview(token.screenMD);
  const [previewSize, setPreviewSize] = useState<MobilePreviewSize>(MOBILE_PREVIEW_SIZE);
  const className = useMemo(
    () => css`
      width: 100%;
      height: 100dvh;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: ${isDesktopPreview ? token.colorBgLayout : token.colorBgContainer};

      .nb-ui-layout-mobile-preview {
        flex: 1 1 0;
        width: 100%;
        min-height: 0;
        display: ${isDesktopPreview ? 'flex' : 'block'};
        align-items: center;
        justify-content: center;
        overflow: auto;
        padding: ${isDesktopPreview ? `${token.paddingXL}px` : '0'};
        box-sizing: border-box;
      }

      .nb-ui-layout-mobile-frame {
        width: ${isDesktopPreview ? `min(${previewSize.width}px, calc(100vw - 32px))` : '100vw'};
        height: ${isDesktopPreview ? `min(${previewSize.height}px, calc(100dvh - 94px))` : '100dvh'};
        max-width: 100%;
        max-height: 100%;
        position: relative;
        overflow: hidden;
        background: ${token.colorBgContainer};
        border: ${isDesktopPreview ? `1px solid ${token.colorBorderSecondary}` : '0'};
        box-shadow: ${isDesktopPreview ? token.boxShadow : 'none'};
      }

      .nb-ui-layout-mobile-viewport {
        width: 100%;
        height: 100%;
        min-height: 0;
        position: relative;
        overflow: hidden;
        background: ${token.colorBgLayout};
        --nb-header-height: 0px;
      }
    `,
    [
      isDesktopPreview,
      previewSize.height,
      previewSize.width,
      token.boxShadow,
      token.colorBgContainer,
      token.colorBgLayout,
      token.colorBorderSecondary,
      token.paddingXL,
    ],
  );
  const handleViewportChange = useCallback(
    (element: HTMLDivElement | null) => {
      model.setLayoutContentElement(element);
    },
    [model],
  );

  useEffect(() => {
    model.setIsMobileLayout(true);
    return () => {
      model.setIsMobileLayout(false);
    };
  }, [model]);

  return (
    <div className={className}>
      {isDesktopPreview ? (
        <MobileDesktopModeHeader model={model} previewSize={previewSize} onPreviewSizeChange={setPreviewSize} />
      ) : null}
      <div className="nb-ui-layout-mobile-preview">
        <div className="nb-ui-layout-mobile-frame">
          <div ref={handleViewportChange} className="nb-ui-layout-mobile-viewport">
            {outlet || <MobileHomePlaceholder model={model} />}
          </div>
        </div>
      </div>
    </div>
  );
});

const MobileDesktopModeHeader = observer(
  (props: {
    model: MobileLayoutModel;
    previewSize: MobilePreviewSize;
    onPreviewSizeChange: (size: MobilePreviewSize) => void;
  }) => {
    const { model, previewSize, onPreviewSizeChange } = props;
    const { token } = theme.useToken();
    const customToken = token as typeof token & MobileLayoutThemeToken;
    const colorSettings = customToken.colorSettings || 'var(--colorSettings, #F18B62)';
    const colorTextHeaderMenu = customToken.colorTextHeaderMenu || '#fff';
    const t = useCallback(
      (key: string) => model.flowEngine.context.t(key, { ns: [NAMESPACE, 'client'] }),
      [model.flowEngine.context],
    );
    const qrCodeValue = typeof window === 'undefined' ? '' : window.location.href;
    const designModeEnabled = !!model.flowEngine.flowSettings.enabled;
    const className = useMemo(
      () => css`
        flex: 0 0 46px;
        height: 46px;
        display: flex;
        align-items: stretch;
        justify-content: flex-end;
        color: #fff;
        background: #001529;

        .nb-ui-layout-mobile-desktop-actions {
          display: inline-flex;
          align-items: stretch;
          height: 46px;
        }

        .nb-ui-layout-mobile-desktop-action {
          width: 46px;
          height: 46px;
          border: 0;
          border-radius: 0;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.72);
          background: transparent;
          cursor: pointer;
          font-size: ${token.fontSizeXL}px;
        }

        .nb-ui-layout-mobile-desktop-action:hover,
        .nb-ui-layout-mobile-desktop-action:focus-visible {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .nb-ui-layout-mobile-desktop-design-action[aria-pressed='true'] {
          color: #fff;
          background: ${colorSettings};
        }
      `,
      [colorSettings, token.fontSizeXL],
    );
    const handleToggleDesignMode = useCallback(async () => {
      if (model.flowEngine.flowSettings.enabled) {
        await model.flowEngine.flowSettings.disable();
        return;
      }
      await model.flowEngine.flowSettings.enable();
    }, [model.flowEngine.flowSettings]);

    return (
      <header className={className}>
        <div className="nb-ui-layout-mobile-desktop-actions">
          <Tooltip title={t('UI Editor')}>
            <button
              type="button"
              className="nb-ui-layout-mobile-desktop-action nb-ui-layout-mobile-desktop-design-action"
              data-testid="ui-editor-button"
              aria-label={t('UI Editor')}
              aria-pressed={designModeEnabled}
              title={t('UI Editor')}
              onClick={handleToggleDesignMode}
            >
              <HighlightOutlined style={{ color: colorTextHeaderMenu }} />
            </button>
          </Tooltip>
          <Tooltip title={t('Pad preview')}>
            <button
              type="button"
              className="nb-ui-layout-mobile-desktop-action"
              aria-label={t('Pad preview')}
              aria-pressed={previewSize.width === PAD_PREVIEW_SIZE.width}
              onClick={() => onPreviewSizeChange(PAD_PREVIEW_SIZE)}
            >
              <TabletOutlined />
            </button>
          </Tooltip>
          <Tooltip title={t('Mobile preview')}>
            <button
              type="button"
              className="nb-ui-layout-mobile-desktop-action"
              aria-label={t('Mobile preview')}
              aria-pressed={previewSize.width === MOBILE_PREVIEW_SIZE.width}
              onClick={() => onPreviewSizeChange(MOBILE_PREVIEW_SIZE)}
            >
              <MobileOutlined />
            </button>
          </Tooltip>
          <Popover trigger="hover" content={<QRCode value={qrCodeValue} bordered={false} />}>
            <button type="button" className="nb-ui-layout-mobile-desktop-action" aria-label={t('QR code')}>
              <QrcodeOutlined />
            </button>
          </Popover>
        </div>
      </header>
    );
  },
);

function MobileHomeRouteGrid(props: { routes: FakeMobileDesktopRoute[]; t: Translate }) {
  const { routes, t } = props;

  return (
    <div className="nb-ui-layout-mobile-home-menu" aria-label={t('Mobile menu')}>
      {routes.map((route) => (
        <button key={route.key} type="button" className="nb-ui-layout-mobile-home-menu-item">
          <span className="nb-ui-layout-mobile-home-menu-icon">{route.icon}</span>
          <span>
            <span className="nb-ui-layout-mobile-home-menu-label">{route.label}</span>
            {route.description ? (
              <span className="nb-ui-layout-mobile-home-menu-description">{route.description}</span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}

const MobileHomePlaceholder = observer((props: { model: MobileLayoutModel }) => {
  const { model } = props;
  const { token } = theme.useToken();
  const customToken = token as typeof token & MobileLayoutThemeToken;
  const colorSettings = customToken.colorSettings || 'var(--colorSettings, #F18B62)';
  const [runtimeDesktopRoutes, setRuntimeDesktopRoutes] = useState<FakeMobileDesktopRoute[]>([]);
  const t = useCallback(
    (key: string) => model.flowEngine.context.t(key, { ns: [NAMESPACE, 'client'] }),
    [model.flowEngine.context],
  );
  const fakeDesktopRoutes = useMemo(() => createFakeMobileDesktopRoutes(t), [t]);
  const addMenuItems = useMemo(() => createMobileHomeAddMenuItems(t), [t]);
  const desktopRoutes = useMemo(
    () => [...fakeDesktopRoutes, ...runtimeDesktopRoutes],
    [fakeDesktopRoutes, runtimeDesktopRoutes],
  );
  const [activeRouteKey, setActiveRouteKey] = useState(() => getVisibleDesktopRoutes(fakeDesktopRoutes)[0]?.key);
  const activeRoute = useMemo(() => {
    const visibleRoutes = getVisibleDesktopRoutes(desktopRoutes);
    return visibleRoutes.find((route) => route.key === activeRouteKey) || visibleRoutes[0];
  }, [activeRouteKey, desktopRoutes]);
  const menuItems = useMemo(() => getVisibleDesktopRoutes(activeRoute?.children || []), [activeRoute]);
  const tabItems = useMemo(
    () => createMobileHomeTabItemsFromDesktopRoutes(desktopRoutes, activeRoute?.key),
    [activeRoute?.key, desktopRoutes],
  );
  const designModeEnabled = !!model.flowEngine.flowSettings.enabled;
  const tabBarColumnCount = tabItems.length + (designModeEnabled ? 1 : 0);
  const dropdownMenuItems = useMemo<MenuProps['items']>(
    () =>
      addMenuItems.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
      })),
    [addMenuItems],
  );
  const handleAddTabMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      const type: MobileHomeAddMenuKey = key === 'link' ? 'link' : 'page';
      setRuntimeDesktopRoutes((items) => {
        const index = items.filter((item) => item.type === type).length + 1;
        const route = createRuntimeMobileDesktopRoute(type, index, t);
        setActiveRouteKey(route.key);
        return [...items, route];
      });
    },
    [t],
  );
  const rootPageModel = useMemo(() => {
    const pageModel = new MobileHomeRootPagePreviewModel({
      flowEngine: model.flowEngine,
      props: {
        displayTitle: true,
        enableTabs: false,
        title: t('Mobile'),
      },
      uid: `${model.uid}-fake-mobile-root-page`,
      use: 'MobileRootPageModel',
    } as never);

    pageModel.context.defineProperty('currentRoute', {
      get: () => ({
        enableTabs: false,
        id: 'fake-mobile-root-page-route',
      }),
    });

    return pageModel;
  }, [model.flowEngine, model.uid, t]);
  rootPageModel.content = <MobileHomeRouteGrid routes={menuItems} t={t} />;
  const className = useMemo(
    () => css`
      width: 100%;
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: ${token.colorText};
      background: ${token.colorBgLayout};

      .nb-ui-layout-mobile-home-menu {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: ${token.marginSM}px;
      }

      .nb-ui-layout-mobile-home-menu-item {
        min-width: 0;
        min-height: 104px;
        border: 1px solid ${token.colorBorderSecondary};
        border-radius: ${token.borderRadius}px;
        padding: ${token.paddingSM}px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;
        gap: ${token.marginSM}px;
        text-align: left;
        color: ${token.colorText};
        background: ${token.colorBgContainer};
        cursor: pointer;
      }

      .nb-ui-layout-mobile-home-menu-item:focus-visible,
      .nb-ui-layout-mobile-home-menu-item:hover {
        border-color: ${token.colorPrimary};
      }

      .nb-ui-layout-mobile-home-menu-icon {
        width: 36px;
        height: 36px;
        border-radius: ${token.borderRadiusSM}px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: ${token.colorPrimary};
        background: ${token.colorPrimaryBg};
        font-size: ${token.fontSizeXL}px;
      }

      .nb-ui-layout-mobile-home-menu-label {
        max-width: 100%;
        display: block;
        font-size: ${token.fontSize}px;
        font-weight: ${token.fontWeightStrong};
        line-height: ${token.lineHeight};
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .nb-ui-layout-mobile-home-menu-description {
        max-width: 100%;
        display: block;
        margin-top: ${token.marginXXS}px;
        color: ${token.colorTextSecondary};
        font-size: ${token.fontSizeSM}px;
        line-height: ${token.lineHeightSM};
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .nb-ui-layout-mobile-home-tabbar {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: repeat(${tabBarColumnCount}, minmax(0, 1fr));
        padding: ${token.paddingXXS}px ${token.paddingXS}px calc(${token.paddingXXS}px + env(safe-area-inset-bottom));
        background: ${token.colorBgContainer};
        border-top: 1px solid ${token.colorBorderSecondary};
      }

      .nb-ui-layout-mobile-home-tabbar-item {
        min-width: 0;
        height: 48px;
        border: 0;
        padding: 0;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${token.marginXXS}px;
        color: ${token.colorTextSecondary};
        background: transparent;
        cursor: pointer;
      }

      .nb-ui-layout-mobile-home-tabbar-item[aria-current='page'] {
        color: ${token.colorPrimary};
      }

      .nb-ui-layout-mobile-home-tabbar-add {
        display: inline-flex;
        align-self: center;
        justify-self: center;
        width: 44px;
        height: 44px;
        min-width: 44px;
        border: 1px dashed ${colorSettings};
        border-radius: ${token.borderRadiusSM}px;
        padding: 0;
        align-items: center;
        justify-content: center;
        color: ${colorSettings};
        background: transparent;
        cursor: pointer;
        font-size: ${token.fontSizeXL}px;
      }

      .nb-ui-layout-mobile-home-tabbar-add:hover,
      .nb-ui-layout-mobile-home-tabbar-add:focus-visible {
        color: ${colorSettings};
        border-color: ${colorSettings};
        background: rgba(241, 139, 98, 0.08);
      }

      .nb-ui-layout-mobile-home-tabbar-icon {
        font-size: ${token.fontSizeXL}px;
        line-height: 1;
      }

      .nb-ui-layout-mobile-home-tabbar-label {
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: ${token.fontSizeSM}px;
        line-height: ${token.lineHeightSM};
      }
    `,
    [
      token.borderRadius,
      token.borderRadiusSM,
      token.colorBgContainer,
      token.colorBgLayout,
      token.colorBorderSecondary,
      token.colorPrimary,
      token.colorPrimaryBg,
      token.colorText,
      token.colorTextSecondary,
      token.fontSize,
      token.fontSizeSM,
      token.fontSizeXL,
      token.fontWeightStrong,
      token.lineHeight,
      token.lineHeightSM,
      token.marginSM,
      token.marginXXS,
      token.paddingSM,
      token.paddingXS,
      token.paddingXXS,
      colorSettings,
      tabBarColumnCount,
    ],
  );

  return (
    <div className={className}>
      {rootPageModel.render()}
      <nav className="nb-ui-layout-mobile-home-tabbar" aria-label={t('Mobile tab bar')}>
        {tabItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className="nb-ui-layout-mobile-home-tabbar-item"
            aria-current={item.active ? 'page' : undefined}
            onClick={() => setActiveRouteKey(item.key)}
          >
            <span className="nb-ui-layout-mobile-home-tabbar-icon">{item.icon}</span>
            <span className="nb-ui-layout-mobile-home-tabbar-label">{item.label}</span>
          </button>
        ))}
        {designModeEnabled ? (
          <Dropdown
            menu={{ items: dropdownMenuItems, onClick: handleAddTabMenuClick }}
            placement="topRight"
            trigger={['hover', 'click']}
          >
            <button
              type="button"
              className="nb-ui-layout-mobile-home-tabbar-add"
              aria-label={t('Add mobile tab')}
              aria-haspopup="menu"
            >
              <PlusOutlined />
            </button>
          </Dropdown>
        ) : null}
      </nav>
    </div>
  );
});

export class MobileLayoutModel extends BaseLayoutModel {
  render() {
    return <MobileLayoutComponent model={this} />;
  }
}

export default MobileLayoutModel;
