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
import type { DragEndEvent } from '@dnd-kit/core';
import { define, observable } from '@formily/reactive';
import { css } from '@emotion/css';
import {
  BaseLayoutModel,
  BaseLayoutRouteCoordinator,
  KeepAlive,
  type LayoutDefinition,
  type RouteModel,
  type RoutePageMeta,
} from '@nocobase/client-v2';
import {
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  GLOBAL_EMBED_CONTAINER_ID,
  observer,
  parsePathnameToViewParams,
  type FlowModel,
} from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import {
  Alert,
  App,
  Dropdown,
  Empty,
  Form,
  Grid,
  Input,
  type MenuProps,
  Modal,
  Popover,
  QRCode,
  theme,
  Tooltip,
} from 'antd';
import React, { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NAMESPACE } from '../../constants';
import {
  ensureMobileLayoutAccessibleRoutes,
  installMobileLayoutRouteRepository,
  refreshMobileLayoutAccessibleRoutes,
} from '../mobileRouteRepository';
import {
  Icon,
  IconPicker,
  NocoBaseDesktopRouteType,
  type NocoBaseDesktopRoute,
  zIndexContext,
} from './mobileFlowCompat';
import {
  collectMobileTabRoutes,
  type MobileLayoutMenuStructure,
  type MobileTabNode,
  type MobileTabNodeOptions,
  reconcileMobileLayoutMenuItems,
  resolveMobileMenuDragMoveOptionsFromEvent,
  toMobileRouterNavigationPath,
} from './MobileMenuModels';
import { getMobilePagePath, mobileRouteTreeContainsTabKey } from './MobileMenuUtils';
import { MobilePageSurface } from './mobileComponents';

type MobileHomeAddMenuKey = 'page' | 'link';

type FakeMobileDesktopRoute = {
  key: string;
  schemaUid: string;
  type: NocoBaseDesktopRouteType | MobileHomeAddMenuKey;
  label: string;
  description?: string;
  icon: ReactNode;
  sort: number;
  path?: string;
  href?: string;
  route?: NocoBaseDesktopRoute;
  hidden?: boolean;
  hideInMenu?: boolean;
  children?: FakeMobileDesktopRoute[];
};

type MobileHomeTabItem = {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

type MobileHomeAddMenuItem = {
  key: MobileHomeAddMenuKey;
  label: string;
  icon: ReactNode;
};

type MobileTabSettingsMenuKey = 'edit' | 'linkageRules' | 'copyUid' | 'delete';
type MobileTabSettingsMenuItem = {
  key: MobileTabSettingsMenuKey;
  label: string;
  danger?: boolean;
};
type MobileAddBlockMenuGroup = {
  key: string;
  label: string;
  children: Array<{
    key: string;
    label: string;
  }>;
};
type MobileTabConfigurationValues = {
  title?: string;
  icon?: string;
  href?: string;
};

const MobileAddTabIconPicker = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof IconPicker>>(
  (props, ref) => (
    <div ref={ref}>
      <IconPicker {...props} />
    </div>
  ),
);

MobileAddTabIconPicker.displayName = 'MobileAddTabIconPicker';

type FormValidationError = {
  errorFields?: Array<{
    errors?: unknown[];
  }>;
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
type MobileRoutesLoadState = 'ready' | 'error';

const MOBILE_PREVIEW_SIZE: MobilePreviewSize = {
  width: 390,
  height: 812,
};

const PAD_PREVIEW_SIZE: MobilePreviewSize = {
  width: 768,
  height: 667,
};

const MOBILE_TABBAR_ITEM_MIN_WIDTH = 72;

// Keep the desktop preview header in sync with the v2 AdminLayout UI Editor preference.
export const FLOW_SETTINGS_PREFERENCE_STORAGE_KEY = 'NOCOBASE_V2_FLOW_SETTINGS_ENABLED';
export const FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT = 'nocobase:v2:flow-settings-preference-change';
export const MOBILE_TAB_FLOW_SETTINGS_OPTIONS = {
  showBackground: false,
  showBorder: false,
  showDynamicFlowsEditor: false,
  toolbarPosition: 'inside',
} as const;

type MobileFlowSettingsPreferenceSnapshot = {
  enabled: boolean;
  hasStoredPreference: boolean;
};

function setMobileRootPageModel(routeModel: RouteModel, rootPageModelClass?: string) {
  const openViewParams = routeModel.getStepParams('popupSettings', 'openView') || {};

  routeModel.setStepParams('popupSettings', 'openView', {
    mode: 'embed',
    preventClose: true,
    ...openViewParams,
    pageModelClass: rootPageModelClass || 'MobileRootPageModel',
  });
}

function defineMobileRouteRuntimeContext(routeModel: RouteModel, getLayout?: () => LayoutDefinition | undefined) {
  routeModel.context.defineProperty('isMobileLayout', {
    value: true,
  });
  routeModel.context.defineProperty('layout', {
    get: getLayout,
    cache: false,
  });
}

class MobileLayoutRouteCoordinator extends BaseLayoutRouteCoordinator {
  registerPage(pageUid: string, meta: RoutePageMeta) {
    const routeModel = super.registerPage(pageUid, meta);

    defineMobileRouteRuntimeContext(routeModel, () => this.layout);
    setMobileRootPageModel(routeModel, this.layout?.rootPageModelClass);

    return routeModel;
  }
}

function readMobileFlowSettingsPreferenceSnapshot(): MobileFlowSettingsPreferenceSnapshot {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      hasStoredPreference: false,
    };
  }

  try {
    const storedValue = window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);

    return {
      enabled: storedValue === '1',
      hasStoredPreference: storedValue === '1' || storedValue === '0',
    };
  } catch (error) {
    console.error('[NocoBase] plugin-ui-layout failed to read flow settings preference.', error);
    return {
      enabled: false,
      hasStoredPreference: false,
    };
  }
}

export function readMobileFlowSettingsPreference() {
  return readMobileFlowSettingsPreferenceSnapshot().enabled;
}

export function writeMobileFlowSettingsPreference(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY, enabled ? '1' : '0');
    window.dispatchEvent(
      new CustomEvent(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, {
        detail: {
          enabled,
        },
      }),
    );
  } catch (error) {
    console.error('[NocoBase] plugin-ui-layout failed to write flow settings preference.', error);
  }
}

function getVisibleDesktopRoutes(routes: FakeMobileDesktopRoute[]) {
  return [...routes].filter((route) => !route.hidden && !route.hideInMenu).sort((a, b) => a.sort - b.sort);
}

function hasVisibleMobileTabRoutes(routes: NocoBaseDesktopRoute[]) {
  return collectMobileTabRoutes(Array.isArray(routes) ? routes : []).length > 0;
}

function isMobileRouteRepositoryMenuEmpty(model: MobileLayoutModel) {
  const routeRepository = model.flowEngine.context.routeRepository;
  if (!routeRepository?.listAccessible) {
    return false;
  }

  const routes = routeRepository.listAccessible() || [];
  if (!routes.length && routeRepository.isAccessibleLoaded?.() === false) {
    return false;
  }

  return !hasVisibleMobileTabRoutes(routes);
}

function getAccessibleDesktopRouteKey(route: NocoBaseDesktopRoute, indexPath: number[]) {
  const stableKey =
    route.schemaUid ||
    route.menuSchemaUid ||
    route.pageSchemaUid ||
    (typeof route.id === 'number' ? `id-${route.id}` : undefined);

  return stableKey || `route-${indexPath.join('-')}`;
}

function getAccessibleDesktopRouteTitle(route: NocoBaseDesktopRoute, t: Translate) {
  if (route.title) {
    return t(route.title);
  }

  return route.schemaUid || route.pageSchemaUid || route.menuSchemaUid || t('Untitled');
}

function getAccessibleDesktopRouteIcon(route: NocoBaseDesktopRoute) {
  if (route.icon) {
    return <Icon type={route.icon} />;
  }

  if (route.type === NocoBaseDesktopRouteType.link) {
    return <LinkOutlined />;
  }

  if (route.type === NocoBaseDesktopRouteType.group) {
    return <AppstoreOutlined />;
  }

  return <FileTextOutlined />;
}

export function normalizeAccessibleDesktopRoutesToMobileRoutes(
  routes: NocoBaseDesktopRoute[],
  t: Translate,
  parentIndexPath: number[] = [],
  basePathname?: string,
): FakeMobileDesktopRoute[] {
  return routes.map((route, index) => {
    const indexPath = [...parentIndexPath, index];
    const key = getAccessibleDesktopRouteKey(route, indexPath);
    const children = normalizeAccessibleDesktopRoutesToMobileRoutes(route.children || [], t, indexPath, basePathname);
    const type = route.type || NocoBaseDesktopRouteType.flowPage;

    return {
      key,
      schemaUid: route.schemaUid || route.pageSchemaUid || route.menuSchemaUid || key,
      type,
      label: getAccessibleDesktopRouteTitle(route, t),
      description: route.tooltip && route.tooltip !== route.title ? t(route.tooltip) : undefined,
      icon: getAccessibleDesktopRouteIcon(route),
      sort: typeof route.sort === 'number' ? route.sort : index,
      path: type === NocoBaseDesktopRouteType.flowPage ? getMobilePagePath(basePathname, route) : undefined,
      href:
        type === NocoBaseDesktopRouteType.link && typeof route.options?.href === 'string'
          ? route.options.href
          : undefined,
      route,
      hidden: route.hidden,
      hideInMenu: route.hideInMenu,
      children,
    };
  });
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

export function createMobileTabSettingsMenuItems(t: Translate): MobileTabSettingsMenuItem[] {
  return [
    {
      key: 'edit',
      label: t('Edit'),
    },
    {
      key: 'linkageRules',
      label: t('Menu linkage rules'),
    },
    {
      key: 'copyUid',
      label: t('Copy UID'),
    },
    {
      key: 'delete',
      label: t('Delete'),
      danger: true,
    },
  ];
}

export function createMobileAddBlockMenuItems(t: Translate): MobileAddBlockMenuGroup[] {
  return [
    {
      key: 'dataBlocks',
      label: t('Data blocks'),
      children: [
        {
          key: 'data-table',
          label: t('Table'),
        },
        {
          key: 'data-form',
          label: t('Form'),
        },
        {
          key: 'data-details',
          label: t('Details'),
        },
        {
          key: 'data-grid-card',
          label: t('Grid Card'),
        },
      ],
    },
    {
      key: 'filterBlocks',
      label: t('Filter blocks'),
      children: [
        {
          key: 'filter-form',
          label: t('Form'),
        },
      ],
    },
    {
      key: 'otherBlocks',
      label: t('Other blocks'),
      children: [
        {
          key: 'other-markdown',
          label: t('Markdown'),
        },
        {
          key: 'other-settings',
          label: t('Settings'),
        },
      ],
    },
  ];
}

function getMobileTabConfigurationTitle(type: MobileHomeAddMenuKey, t: Translate) {
  return type === 'page' ? t('Add page') : t('Add link');
}

function getFirstFormValidationMessage(error: unknown) {
  const firstError = (error as FormValidationError).errorFields?.[0]?.errors?.[0];
  return typeof firstError === 'string' ? firstError : undefined;
}

export function createMobileDesktopRouteCreationValues(
  type: MobileHomeAddMenuKey,
  values: MobileTabConfigurationValues = {},
): { route: NocoBaseDesktopRoute; activeRouteKey: string } {
  const title = values.title?.trim();
  const icon = values.icon?.trim();
  const href = values.href?.trim();

  if (type === 'link') {
    const schemaUid = uid();

    return {
      route: {
        type: NocoBaseDesktopRouteType.link,
        title,
        icon,
        schemaUid,
        options: {
          href,
          openInNewWindow: true,
        },
      },
      activeRouteKey: schemaUid,
    };
  }

  const pageSchemaUid = uid();
  const menuSchemaUid = uid();
  const tabSchemaUid = uid();
  const tabSchemaName = uid();

  return {
    route: {
      type: NocoBaseDesktopRouteType.flowPage,
      title,
      icon,
      schemaUid: pageSchemaUid,
      menuSchemaUid,
      enableTabs: false,
      children: [
        {
          type: NocoBaseDesktopRouteType.tabs,
          schemaUid: tabSchemaUid,
          tabSchemaName,
          hidden: true,
        },
      ],
    },
    activeRouteKey: pageSchemaUid,
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
  const { token } = theme.useToken();
  const isDesktopPreview = useIsDesktopPreview(token.screenMD);
  const [previewSize, setPreviewSize] = useState<MobilePreviewSize>(MOBILE_PREVIEW_SIZE);
  const [flowSettingsPreference, setFlowSettingsPreference] = useState(() =>
    readMobileFlowSettingsPreferenceSnapshot(),
  );
  const [isMobileMenuEmpty, setIsMobileMenuEmpty] = useState(() => isMobileRouteRepositoryMenuEmpty(model));
  const [flowSettingsSyncVersion, setFlowSettingsSyncVersion] = useState(0);
  const flowSettingsSyncRef = useRef(0);
  const desiredFlowSettingsEnabledRef = useRef(false);
  const preferredFlowSettingsEnabled = flowSettingsPreference.hasStoredPreference
    ? flowSettingsPreference.enabled
    : isMobileMenuEmpty;
  const className = useMemo(
    () => css`
      width: 100%;
      height: 100dvh;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: ${isDesktopPreview ? token.colorBgLayout : token.colorBgContainer};

      .nb-ui-layout-mobile-workspace {
        flex: 1 1 0;
        width: 100%;
        min-height: 0;
        display: ${isDesktopPreview ? 'flex' : 'block'};
        overflow: hidden;
        background: ${isDesktopPreview ? token.colorBgLayout : token.colorBgContainer};
      }

      .nb-ui-layout-mobile-preview {
        flex: 1 1 0;
        width: 100%;
        min-width: 0;
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
        --nb-mobile-tabbar-height: 57px;
      }

      .nb-ui-layout-mobile-embed-container {
        display: ${isDesktopPreview ? 'block' : 'none'};
        flex: 0 0 auto;
        width: fit-content;
        height: 100%;
        min-width: 0;
        position: relative;
        overflow: hidden;
        background: ${token.colorBgContainer};
        box-shadow: ${isDesktopPreview ? `inset 1px 0 0 ${token.colorBorderSecondary}` : 'none'};
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
  useLayoutEffect(() => {
    return installMobileLayoutRouteRepository(model);
  }, [model]);

  useEffect(() => {
    const routeRepository = model.flowEngine.context.routeRepository;
    const syncMobileMenuEmptyState = () => {
      setIsMobileMenuEmpty(isMobileRouteRepositoryMenuEmpty(model));
    };

    syncMobileMenuEmptyState();
    routeRepository?.subscribe?.(syncMobileMenuEmptyState);

    return () => {
      routeRepository?.unsubscribe?.(syncMobileMenuEmptyState);
    };
  }, [model]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncPreferredFlowSettings = () => {
      setFlowSettingsPreference(readMobileFlowSettingsPreferenceSnapshot());
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

  useEffect(() => {
    const syncId = ++flowSettingsSyncRef.current;
    desiredFlowSettingsEnabledRef.current = preferredFlowSettingsEnabled;

    const applyFlowSettingsState = async (enabled: boolean) => {
      if (enabled) {
        await model.flowEngine.flowSettings.enable();
        return;
      }
      await model.flowEngine.flowSettings.disable();
    };

    const syncFlowSettings = async () => {
      try {
        await applyFlowSettingsState(preferredFlowSettingsEnabled);
        if (syncId !== flowSettingsSyncRef.current) {
          await applyFlowSettingsState(desiredFlowSettingsEnabledRef.current);
        }
        if (syncId === flowSettingsSyncRef.current) {
          setFlowSettingsSyncVersion((version) => version + 1);
        }
      } catch (error) {
        console.error('[NocoBase] plugin-ui-layout failed to sync flow settings preference.', error);
      }
    };

    syncFlowSettings();

    return () => {
      if (flowSettingsSyncRef.current === syncId) {
        flowSettingsSyncRef.current += 1;
      }
    };
  }, [model.flowEngine.flowSettings, preferredFlowSettingsEnabled]);

  const handleFlowSettingsPreferenceChange = useCallback((enabled: boolean) => {
    setFlowSettingsPreference({
      enabled,
      hasStoredPreference: true,
    });
    writeMobileFlowSettingsPreference(enabled);
  }, []);

  return (
    <div className={className}>
      {isDesktopPreview ? (
        <MobileDesktopModeHeader
          designModeEnabled={preferredFlowSettingsEnabled}
          model={model}
          previewSize={previewSize}
          onDesignModeChange={handleFlowSettingsPreferenceChange}
          onPreviewSizeChange={setPreviewSize}
        />
      ) : null}
      <div className="nb-ui-layout-mobile-workspace">
        <div className="nb-ui-layout-mobile-preview">
          <div className="nb-ui-layout-mobile-frame">
            <div
              className="nb-ui-layout-mobile-viewport"
              data-nb-mobile-view-stack-depth={model.getMobileViewStackDepth()}
            >
              <MobileHomePlaceholder
                designModeEnabled={preferredFlowSettingsEnabled}
                flowSettingsSyncVersion={flowSettingsSyncVersion}
                model={model}
              />
            </div>
          </div>
        </div>
        <div
          id={GLOBAL_EMBED_CONTAINER_ID}
          className="nb-ui-layout-mobile-embed-container"
          hidden={!isDesktopPreview}
        ></div>
      </div>
    </div>
  );
});

const MobileDesktopModeHeader = observer(
  (props: {
    designModeEnabled: boolean;
    model: MobileLayoutModel;
    previewSize: MobilePreviewSize;
    onDesignModeChange: (enabled: boolean) => void;
    onPreviewSizeChange: (size: MobilePreviewSize) => void;
  }) => {
    const { designModeEnabled, model, previewSize, onDesignModeChange, onPreviewSizeChange } = props;
    const { token } = theme.useToken();
    const customToken = token as typeof token & MobileLayoutThemeToken;
    const colorSettings = customToken.colorSettings || 'var(--colorSettings, #F18B62)';
    const colorTextHeaderMenu = customToken.colorTextHeaderMenu || '#fff';
    const t = useCallback(
      (key: string) => model.flowEngine.context.t(key, { ns: [NAMESPACE, 'client'] }),
      [model.flowEngine.context],
    );
    const [qrCodeOpen, setQrCodeOpen] = useState(false);
    const qrCodeValue = typeof window === 'undefined' ? '' : window.location.href;
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
    const handleToggleDesignMode = useCallback(() => {
      onDesignModeChange(!designModeEnabled);
    }, [designModeEnabled, onDesignModeChange]);

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
          <Popover
            trigger={['hover', 'click']}
            open={qrCodeOpen}
            onOpenChange={setQrCodeOpen}
            content={<QRCode value={qrCodeValue} bordered={false} />}
          >
            <button
              type="button"
              className="nb-ui-layout-mobile-desktop-action"
              aria-label={t('QR code')}
              aria-haspopup="dialog"
              aria-expanded={qrCodeOpen}
            >
              <QrcodeOutlined />
            </button>
          </Popover>
        </div>
      </header>
    );
  },
);

function MobileHomeRouteGrid(props: {
  addBlockMenuItems: MenuProps['items'];
  designModeEnabled: boolean;
  hasTabItems: boolean;
  loadState: MobileRoutesLoadState;
  onRouteClick?: (route: FakeMobileDesktopRoute) => void;
  routes: FakeMobileDesktopRoute[];
  t: Translate;
}) {
  const { addBlockMenuItems, designModeEnabled, hasTabItems, loadState, onRouteClick, routes, t } = props;
  const status =
    loadState === 'error' ? (
      <Alert type="error" showIcon message={t('Failed to load mobile pages')} />
    ) : !hasTabItems ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No mobile pages yet')} />
    ) : null;

  return (
    <div className="nb-ui-layout-mobile-home-content">
      {designModeEnabled && hasTabItems ? (
        <div className="nb-ui-layout-mobile-home-add-block">
          <Dropdown menu={{ items: addBlockMenuItems }} placement="bottomLeft" trigger={['hover', 'click']}>
            <button
              type="button"
              className="nb-ui-layout-mobile-home-add-block-button"
              data-flow-add-block
              aria-haspopup="menu"
            >
              <PlusOutlined />
              <span>{t('Add block')}</span>
            </button>
          </Dropdown>
        </div>
      ) : null}
      {status ? <div className="nb-ui-layout-mobile-home-status">{status}</div> : null}
      <div className="nb-ui-layout-mobile-home-menu" aria-label={t('Mobile menu')}>
        {routes.map((route) => (
          <button
            key={route.key}
            type="button"
            className="nb-ui-layout-mobile-home-menu-item"
            onClick={() => onRouteClick?.(route)}
          >
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
    </div>
  );
}

type MobileMenuItemModelLike = FlowModel & {
  getRoute?: () => NocoBaseDesktopRoute | undefined;
};

function isMobileMenuItemModelLike(model: FlowModel): model is MobileMenuItemModelLike {
  return typeof (model as MobileMenuItemModelLike).getRoute === 'function';
}

async function rerenderMobileMenuItems(model: { subModels: MobileLayoutMenuStructure['subModels'] }) {
  await Promise.all((model.subModels.menuItems || []).map((item) => item.rerender()));
}

function normalizeRenderableMobileTabItems(tabItems: MobileTabNode[], designModeEnabled: boolean) {
  const renderableTabItems = designModeEnabled ? tabItems : tabItems.filter((item) => !item.model.hidden);

  if (!renderableTabItems.length || renderableTabItems.some((item) => item.active)) {
    return renderableTabItems;
  }

  const fallbackItem =
    renderableTabItems.find((item) => item.type === NocoBaseDesktopRouteType.flowPage) || renderableTabItems[0];

  return renderableTabItems.map((item) => ({
    ...item,
    active: item.key === fallbackItem.key,
  }));
}

function normalizeRenderableMobileMenuItems(routes: FakeMobileDesktopRoute[], designModeEnabled: boolean) {
  const renderableRoutes = designModeEnabled ? routes : routes.filter((route) => !route.hidden && !route.hideInMenu);

  return renderableRoutes.map((route) => ({
    ...route,
    children: normalizeRenderableMobileMenuItems(route.children || [], designModeEnabled),
  }));
}

function isActiveRouteRepresentedByMobileTabs(tabItems: MobileTabNode[], activeRouteKey: string | undefined) {
  if (!activeRouteKey) {
    return false;
  }

  return tabItems.some(
    (item) => item.key === activeRouteKey || mobileRouteTreeContainsTabKey(item.route.children, activeRouteKey),
  );
}

const MobileTabDragToolbarButton = observer((props: { model: FlowModel }) => {
  const route = isMobileMenuItemModelLike(props.model) ? props.model.getRoute?.() : undefined;
  if (!route?.id) {
    return null;
  }

  return <DragHandler model={props.model} />;
});

const mobileTabToolbarItems = [
  {
    key: 'mobile-menu-drag-handler',
    component: MobileTabDragToolbarButton,
    sort: 1,
  },
];

const MobileTabBarItemRenderer = observer(
  (props: { designModeEnabled: boolean; dom: ReactNode; item: MobileTabNode }) => {
    const { designModeEnabled, dom, item } = props;

    useEffect(() => {
      item.model.setProps({
        dom,
        item,
      });
    }, [dom, item]);

    return (
      <Droppable model={item.model}>
        <div
          className="nb-ui-layout-mobile-home-tabbar-item-shell"
          data-flow-model-uid={item.model.uid}
          data-nb-hidden-mobile-tab={item.model.hidden || undefined}
        >
          <FlowModelRenderer
            model={item.model}
            showFlowSettings={designModeEnabled ? MOBILE_TAB_FLOW_SETTINGS_OPTIONS : false}
            extraToolbarItems={mobileTabToolbarItems}
          />
        </div>
      </Droppable>
    );
  },
);

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('//');
}

function normalizeMobileRouterBasename(basename?: string) {
  if (!basename || basename === '/') {
    return '';
  }

  return `/${basename.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function getMobileRouterBasename(model: MobileLayoutModel) {
  return (
    model.flowEngine.context.app?.router?.getBasename?.() ||
    model.flowEngine.context.app?.router?.basename ||
    model.flowEngine.context.router?.basename
  );
}

function isStandaloneDocumentUrl(url: string) {
  return /^[a-z][a-z\d+\-.]*:/i.test(url) || url.startsWith('//') || url.startsWith('#') || url.startsWith('?');
}

function toMobileDocumentUrlWithRouterBasename(url: string, basename?: string) {
  if (!url || isStandaloneDocumentUrl(url)) {
    return url;
  }

  const normalizedBasename = normalizeMobileRouterBasename(basename);
  if (!normalizedBasename) {
    return url;
  }

  const rootRelativeUrl = url.startsWith('/') ? url : `/${url}`;
  if (
    rootRelativeUrl === normalizedBasename ||
    rootRelativeUrl.startsWith(`${normalizedBasename}/`) ||
    rootRelativeUrl.startsWith(`${normalizedBasename}?`) ||
    rootRelativeUrl.startsWith(`${normalizedBasename}#`)
  ) {
    return rootRelativeUrl;
  }

  return `${normalizedBasename}${rootRelativeUrl}`;
}

function toMobileRouterLinkNavigationPath(url: string, basename?: string) {
  if (!url || isStandaloneDocumentUrl(url)) {
    return url;
  }

  return toMobileRouterNavigationPath(url, basename);
}

function normalizeMobileLocationPath(pathname: string) {
  const normalized = `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;

  return normalized === '/' ? '/' : normalized;
}

const MobileHomePlaceholder = observer(
  (props: { designModeEnabled: boolean; flowSettingsSyncVersion: number; model: MobileLayoutModel }) => {
    const { designModeEnabled, flowSettingsSyncVersion, model } = props;
    const { token } = theme.useToken();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const routeParams = useParams();
    const [addTabForm] = Form.useForm<MobileTabConfigurationValues>();
    const customToken = token as typeof token & MobileLayoutThemeToken;
    const colorSettings = customToken.colorSettings || 'var(--colorSettings, #F18B62)';
    const addTabModalZIndex = token.zIndexPopupBase;
    const [accessibleDesktopRoutes, setAccessibleDesktopRoutes] = useState<NocoBaseDesktopRoute[]>(
      () => model.flowEngine.context.routeRepository?.listAccessible?.() || [],
    );
    const [routesLoadState, setRoutesLoadState] = useState<MobileRoutesLoadState>('ready');
    const [addTabDropdownOpen, setAddTabDropdownOpen] = useState(false);
    const [configuringTabType, setConfiguringTabType] = useState<MobileHomeAddMenuKey | null>(null);
    const [menuRouteVersion, setMenuRouteVersion] = useState(0);
    const menuRouteRefreshVersion = model.menuRouteRefreshVersion;
    const activeRouteKeyFromLayout = model.getActiveMobileTabKey();
    const showMobileTabBar = model.shouldShowMobileTabBar();
    const t = useCallback(
      (key: string) => model.flowEngine.context.t(key, { ns: [NAMESPACE, 'client'] }),
      [model.flowEngine.context],
    );
    const routeTitleT = useCallback(
      (key: string) => model.flowEngine.context.t(key, { ns: ['lm-desktop-routes', NAMESPACE, 'client'] }),
      [model.flowEngine.context],
    );
    const addMenuItems = useMemo(() => createMobileHomeAddMenuItems(t), [t]);
    const addBlockMenuGroups = useMemo(() => createMobileAddBlockMenuItems(t), [t]);
    const [activeRouteKey, setActiveRouteKey] = useState<string | undefined>();
    const resolvedActiveRouteKey = activeRouteKeyFromLayout || activeRouteKey;
    const tabItems = useMemo(() => {
      if (!Number.isFinite(menuRouteRefreshVersion) || !Number.isFinite(menuRouteVersion)) {
        return [];
      }

      return model.toMobileTabNodes({
        activeKey: resolvedActiveRouteKey,
        basePathname: model.getMobileBasePathname(),
        t: routeTitleT,
      });
    }, [menuRouteRefreshVersion, menuRouteVersion, model, resolvedActiveRouteKey, routeTitleT]);
    const renderableTabItems = normalizeRenderableMobileTabItems(tabItems, designModeEnabled);
    const activeRoute =
      renderableTabItems.find((route) => route.key === resolvedActiveRouteKey) ||
      renderableTabItems.find((route) => route.active) ||
      renderableTabItems.find((route) => route.type === NocoBaseDesktopRouteType.flowPage) ||
      renderableTabItems[0];
    const menuItems = useMemo(() => {
      const routes = normalizeAccessibleDesktopRoutesToMobileRoutes(
        activeRoute?.route.children || [],
        routeTitleT,
        [],
        model.getMobileBasePathname(),
      );

      return normalizeRenderableMobileMenuItems(routes, designModeEnabled);
    }, [activeRoute?.route.children, designModeEnabled, model, routeTitleT]);
    const tabBarColumnCount = Math.max(1, renderableTabItems.length + (designModeEnabled ? 1 : 0));
    const dropdownMenuItems = useMemo<MenuProps['items']>(
      () =>
        addMenuItems.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
        })),
      [addMenuItems],
    );
    const addBlockMenuItems = useMemo<MenuProps['items']>(
      () =>
        addBlockMenuGroups.map((group) => ({
          key: group.key,
          type: 'group',
          label: group.label,
          children: group.children.map((item) => ({
            key: item.key,
            label: item.label,
          })),
        })),
      [addBlockMenuGroups],
    );
    const handleAddTabMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
      ({ key }) => {
        const type: MobileHomeAddMenuKey = key === 'link' ? 'link' : 'page';
        setAddTabDropdownOpen(false);
        addTabForm.resetFields();
        setConfiguringTabType(type);
      },
      [addTabForm],
    );
    const handleAddTabModalCancel = useCallback(() => {
      setConfiguringTabType(null);
      addTabForm.resetFields();
    }, [addTabForm]);
    const handleAddTabModalSubmit = useCallback(async () => {
      if (!configuringTabType) {
        return;
      }

      try {
        const values = await addTabForm.validateFields();
        const routeRepository = model.flowEngine.context.routeRepository;
        const creationValues = createMobileDesktopRouteCreationValues(configuringTabType, values);

        if (!routeRepository?.createRoute) {
          throw new Error('Route repository is unavailable.');
        }

        await routeRepository.createRoute(creationValues.route, {
          refreshAfterMutation: false,
        });
        await refreshMobileLayoutAccessibleRoutes(model, routeRepository);
        if (configuringTabType === 'page') {
          setActiveRouteKey(creationValues.activeRouteKey);
        }
        setConfiguringTabType(null);
        addTabForm.resetFields();
      } catch (error) {
        const validationMessage = getFirstFormValidationMessage(error);
        if (validationMessage) {
          message.error(validationMessage);
          return;
        }

        console.error('[NocoBase] plugin-ui-layout failed to create mobile tab route.', error);
      }
    }, [addTabForm, configuringTabType, message, model]);
    const addTabModalTitle = useMemo(
      () => (configuringTabType ? getMobileTabConfigurationTitle(configuringTabType, t) : undefined),
      [configuringTabType, t],
    );
    const handlePageSlotChange = useCallback(
      (element: HTMLDivElement | null) => {
        model.setLayoutContentElement(element);
      },
      [model],
    );

    useEffect(() => {
      if (!designModeEnabled) {
        setAddTabDropdownOpen(false);
      }
    }, [designModeEnabled]);

    useEffect(() => {
      const routeRepository = model.flowEngine.context.routeRepository;
      let disposed = false;
      const syncAccessibleRoutes = () => {
        if (disposed) {
          return;
        }

        setAccessibleDesktopRoutes(routeRepository?.listAccessible?.() || []);
      };

      syncAccessibleRoutes();

      routeRepository?.subscribe?.(syncAccessibleRoutes);
      if (!routeRepository) {
        setRoutesLoadState('ready');
        return () => {
          routeRepository?.unsubscribe?.(syncAccessibleRoutes);
        };
      }

      const handleRouteLoadError = (error: unknown) => {
        if (disposed) {
          return;
        }

        console.error('[NocoBase] plugin-ui-layout failed to initialize accessible routes.', error);
        syncAccessibleRoutes();
        setRoutesLoadState('error');
      };
      const loadAccessibleRoutes = async () => {
        try {
          await ensureMobileLayoutAccessibleRoutes(model, routeRepository);
          if (disposed) {
            return;
          }

          syncAccessibleRoutes();
          setRoutesLoadState('ready');
        } catch (error) {
          handleRouteLoadError(error);
        }
      };

      loadAccessibleRoutes();

      return () => {
        disposed = true;
        routeRepository?.unsubscribe?.(syncAccessibleRoutes);
      };
    }, [model]);

    useLayoutEffect(() => {
      model.syncMenuRoutes(accessibleDesktopRoutes, { includeHidden: designModeEnabled });
      setMenuRouteVersion((version) => version + 1);
      const rerenderMenuItems = async () => {
        try {
          await rerenderMobileMenuItems(model);
        } catch (error) {
          console.error('[NocoBase] plugin-ui-layout failed to rerender mobile menu linkage rules.', error);
        }
      };

      rerenderMenuItems();
    }, [accessibleDesktopRoutes, designModeEnabled, flowSettingsSyncVersion, model]);

    useEffect(() => {
      if (!tabItems.length) {
        if (activeRouteKey) {
          setActiveRouteKey(undefined);
        }
        return;
      }

      if (activeRouteKeyFromLayout) {
        return;
      }

      if (!tabItems.some((item) => item.key === activeRouteKey)) {
        setActiveRouteKey(tabItems[0].key);
      }
    }, [activeRouteKey, activeRouteKeyFromLayout, tabItems]);

    useEffect(() => {
      if (activeRouteKeyFromLayout || !tabItems.length) {
        return;
      }

      const basename = getMobileRouterBasename(model);
      const mobileLayoutRootPath = toMobileRouterNavigationPath(model.getMobileBasePathname(), basename);
      const currentPath = normalizeMobileLocationPath(location.pathname);

      if (currentPath !== normalizeMobileLocationPath(mobileLayoutRootPath)) {
        return;
      }

      const fallbackRoute = tabItems.find((item) => item.type === NocoBaseDesktopRouteType.flowPage && item.path);
      if (!fallbackRoute?.path) {
        return;
      }

      navigate(toMobileRouterNavigationPath(fallbackRoute.path, basename), { replace: true });
    }, [
      activeRouteKeyFromLayout,
      location.pathname,
      model,
      model.flowEngine.context.app?.router,
      model.flowEngine.context.router?.basename,
      navigate,
      tabItems,
    ]);

    useEffect(() => {
      if (
        !activeRouteKeyFromLayout ||
        !tabItems.length ||
        isActiveRouteRepresentedByMobileTabs(tabItems, activeRouteKeyFromLayout)
      ) {
        return;
      }

      const fallbackRoute = tabItems.find((item) => item.type === NocoBaseDesktopRouteType.flowPage && item.path);
      if (!fallbackRoute?.path) {
        return;
      }

      const basename = getMobileRouterBasename(model);
      navigate(toMobileRouterNavigationPath(fallbackRoute.path, basename), { replace: true });
    }, [
      activeRouteKeyFromLayout,
      model,
      model.flowEngine.context.app?.router,
      model.flowEngine.context.router?.basename,
      navigate,
      tabItems,
    ]);

    const handleMobileMenuDragEnd = useCallback(
      (event: DragEndEvent) => {
        const moveOptions = resolveMobileMenuDragMoveOptionsFromEvent(model.flowEngine, event);

        if (!moveOptions) {
          return;
        }

        const routeRepository = model.flowEngine.context.routeRepository;
        const movePromise = routeRepository?.moveRoute?.({
          ...moveOptions,
          refreshAfterMove: false,
        });

        movePromise
          ?.then(() => refreshMobileLayoutAccessibleRoutes(model, routeRepository))
          .catch((error) => {
            console.error('[NocoBase] plugin-ui-layout failed to move mobile tab route.', error);
          });
      },
      [model],
    );
    const handleTabClick = useCallback(
      (item: MobileTabNode) => {
        if (item.path) {
          setActiveRouteKey(item.key);
          const basename = getMobileRouterBasename(model);
          navigate(toMobileRouterNavigationPath(item.path, basename));
          return;
        }

        if (!item.href) {
          return;
        }

        if (item.route.options?.openInNewWindow === false) {
          if (isAbsoluteUrl(item.href)) {
            window.location.assign(item.href);
            return;
          }

          navigate(toMobileRouterLinkNavigationPath(item.href, getMobileRouterBasename(model)));
          return;
        }

        const basename = getMobileRouterBasename(model);
        window.open(toMobileDocumentUrlWithRouterBasename(item.href, basename), '_blank', 'noopener,noreferrer');
      },
      [model, navigate],
    );
    const handleMenuItemClick = useCallback(
      (item: FakeMobileDesktopRoute) => {
        if (item.path) {
          setActiveRouteKey(item.key);
          const basename = getMobileRouterBasename(model);
          navigate(toMobileRouterNavigationPath(item.path, basename));
          return;
        }

        if (!item.href) {
          return;
        }

        if (item.route?.options?.openInNewWindow === false) {
          if (isAbsoluteUrl(item.href)) {
            window.location.assign(item.href);
            return;
          }

          navigate(toMobileRouterLinkNavigationPath(item.href, getMobileRouterBasename(model)));
          return;
        }

        const basename = getMobileRouterBasename(model);
        window.open(toMobileDocumentUrlWithRouterBasename(item.href, basename), '_blank', 'noopener,noreferrer');
      },
      [model, navigate],
    );

    const rootPageContent = (
      <MobilePageSurface title={t('Mobile')} displayTitle>
        <div className="nb-ui-layout-mobile-body">
          <MobileHomeRouteGrid
            addBlockMenuItems={addBlockMenuItems}
            designModeEnabled={designModeEnabled}
            hasTabItems={tabItems.length > 0}
            loadState={routesLoadState}
            onRouteClick={handleMenuItemClick}
            routes={menuItems}
            t={t}
          />
        </div>
      </MobilePageSurface>
    );
    const activePageUid = routeParams.name;
    const pageSlotContent = activePageUid ? (
      <KeepAlive uid={activePageUid}>{() => <Outlet />}</KeepAlive>
    ) : (
      rootPageContent
    );
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

        .nb-ui-layout-mobile-home-content {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          gap: ${token.marginSM}px;
        }

        .nb-ui-layout-mobile-page-slot {
          position: relative;
          flex: 1 1 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .nb-ui-layout-mobile-page-slot > * {
          flex: 1 1 0;
          min-height: 0;
        }

        .nb-ui-layout-mobile-page-slot > div > div > [data-has-float-menu],
        .nb-ui-layout-mobile-page-slot > div > div > [data-has-float-menu] > div {
          flex: 1 1 0;
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .nb-ui-layout-mobile-page-slot .nb-ui-layout-mobile-surface {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .nb-ui-layout-mobile-home-menu {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: ${token.marginSM}px;
        }

        .nb-ui-layout-mobile-home-status {
          padding: ${token.paddingSM}px 0;
        }

        .nb-ui-layout-mobile-home-add-block {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        }

        .nb-ui-layout-mobile-home-add-block-button {
          height: 36px;
          border: 1px dashed ${colorSettings};
          border-radius: ${token.borderRadiusSM}px;
          padding: 0 ${token.paddingSM}px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: ${token.marginXXS}px;
          color: ${colorSettings};
          background: ${token.colorBgContainer};
          cursor: pointer;
          font-size: ${token.fontSize}px;
          line-height: 1;
        }

        .nb-ui-layout-mobile-home-add-block-button:hover,
        .nb-ui-layout-mobile-home-add-block-button:focus-visible {
          color: ${colorSettings};
          border-color: ${colorSettings};
          background: color-mix(in srgb, ${colorSettings} 8%, transparent);
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
          position: relative;
          z-index: 8;
          display: grid;
          grid-template-columns: repeat(${tabBarColumnCount}, minmax(${MOBILE_TABBAR_ITEM_MIN_WIDTH}px, 1fr));
          padding: ${token.paddingXXS}px ${token.paddingXS}px calc(${token.paddingXXS}px + env(safe-area-inset-bottom));
          background: ${token.colorBgContainer};
          border-top: 1px solid ${token.colorBorderSecondary};
          overflow-x: auto;
          overflow-y: hidden;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .nb-ui-layout-mobile-home-tabbar::-webkit-scrollbar {
          display: none;
        }

        .nb-ui-layout-mobile-home-tabbar-item-shell {
          position: relative;
          min-width: ${MOBILE_TABBAR_ITEM_MIN_WIDTH}px;
          height: 56px;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
        }

        .nb-ui-layout-mobile-home-tabbar-item-shell > div,
        .nb-ui-layout-mobile-home-tabbar-item-shell [data-has-float-menu='true'],
        .nb-ui-layout-mobile-home-tabbar-item-shell [data-has-float-menu='true'] > div:first-child {
          width: 100%;
          height: 100%;
        }

        .nb-ui-layout-mobile-home-tabbar-item {
          position: relative;
          min-width: 0;
          width: 100%;
          height: 56px;
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
          width: 36px;
          height: 36px;
          min-width: 36px;
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

        .nb-ui-layout-mobile-home-tabbar[hidden] {
          display: none;
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
        <div ref={handlePageSlotChange} className="nb-ui-layout-mobile-page-slot">
          {pageSlotContent}
        </div>
        <DndProvider onDragEnd={handleMobileMenuDragEnd}>
          <nav className="nb-ui-layout-mobile-home-tabbar" aria-label={t('Mobile tab bar')} hidden={!showMobileTabBar}>
            {renderableTabItems.map((item) => {
              const dom = (
                <button
                  type="button"
                  className="nb-ui-layout-mobile-home-tabbar-item"
                  aria-current={item.active ? 'page' : undefined}
                  onClick={() => handleTabClick(item)}
                >
                  <span className="nb-ui-layout-mobile-home-tabbar-icon">{item.icon}</span>
                  <span className="nb-ui-layout-mobile-home-tabbar-label">{item.label}</span>
                </button>
              );

              return (
                <MobileTabBarItemRenderer key={item.key} designModeEnabled={designModeEnabled} dom={dom} item={item} />
              );
            })}
            {designModeEnabled ? (
              <Dropdown
                menu={{ items: dropdownMenuItems, onClick: handleAddTabMenuClick }}
                open={addTabDropdownOpen}
                onOpenChange={setAddTabDropdownOpen}
                placement="topRight"
                trigger={['hover', 'click']}
              >
                <button
                  type="button"
                  className="nb-ui-layout-mobile-home-tabbar-add"
                  aria-label={t('Add mobile tab')}
                  aria-haspopup="menu"
                  onClick={() => setAddTabDropdownOpen(true)}
                >
                  <PlusOutlined />
                </button>
              </Dropdown>
            ) : null}
          </nav>
        </DndProvider>
        <Modal
          title={addTabModalTitle}
          open={!!configuringTabType}
          okText={t('Submit')}
          cancelText={t('Cancel')}
          zIndex={addTabModalZIndex}
          onOk={handleAddTabModalSubmit}
          onCancel={handleAddTabModalCancel}
        >
          <zIndexContext.Provider value={addTabModalZIndex}>
            <Form<MobileTabConfigurationValues> form={addTabForm} layout="vertical">
              <Form.Item
                name="title"
                label={t('Title')}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t('Title field is required'),
                  },
                ]}
              >
                <Input autoFocus />
              </Form.Item>
              {configuringTabType === 'link' ? (
                <Form.Item
                  name="href"
                  label={t('URL')}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: t('URL field is required'),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              ) : null}
              <Form.Item
                name="icon"
                label={t('Icon')}
                rules={[
                  {
                    required: true,
                    message: t('Icon field is required'),
                  },
                ]}
              >
                <MobileAddTabIconPicker />
              </Form.Item>
            </Form>
          </zIndexContext.Provider>
        </Modal>
      </div>
    );
  },
);

export class MobileLayoutModel extends BaseLayoutModel<MobileLayoutMenuStructure> {
  menuRouteRefreshVersion = 0;

  constructor(options: ConstructorParameters<typeof BaseLayoutModel>[0]) {
    super(options);
    this.setIsMobileLayout(true);
    this.context.defineProperty('isMobileLayout', {
      get: () => this.isMobileLayout,
      observable: true,
      cache: false,
    });
    define(this, {
      menuRouteRefreshVersion: observable.ref,
    });
  }

  protected onMount(): void {
    this.setIsMobileLayout(true);
    super.onMount();
  }

  refreshMenuRouteTree() {
    this.menuRouteRefreshVersion += 1;
  }

  syncMenuRoutes(routes: NocoBaseDesktopRoute[], options: { includeHidden?: boolean } = {}) {
    reconcileMobileLayoutMenuItems(this, collectMobileTabRoutes(Array.isArray(routes) ? routes : [], options));
    this.refreshMenuRouteTree();
  }

  protected createRouteCoordinator() {
    return new MobileLayoutRouteCoordinator(this.flowEngine, this.getRouteCoordinatorOptions());
  }

  registerRoutePage(pageUid: string, meta: Parameters<BaseLayoutModel['registerRoutePage']>[1]) {
    const routeModel = super.registerRoutePage(pageUid, meta);

    defineMobileRouteRuntimeContext(routeModel, () => this.layout);
    setMobileRootPageModel(routeModel, this.layout.rootPageModelClass);

    return routeModel;
  }

  getMobileBasePathname() {
    return this.currentLayoutRoute?.basePathname || this.layout.routePath || '/mobile';
  }

  getActiveMobileTabKey(fallbackActiveKey?: string) {
    return this.currentLayoutRoute?.type === 'page' ? this.currentLayoutRoute.pageUid : fallbackActiveKey;
  }

  getMobileViewStackDepth() {
    const routeStateDepth = this.currentLayoutRoute?.type === 'page' ? this.currentLayoutRoute.viewStack.length : 0;
    const route = this.flowEngine.context.route as { pathname?: string } | undefined;
    const pathname = route?.pathname;
    const basePathname =
      this.currentLayoutRoute?.type === 'page' ? this.currentLayoutRoute.basePathname : this.getMobileBasePathname();

    if (!pathname || !basePathname) {
      return routeStateDepth;
    }

    try {
      return Math.max(routeStateDepth, parsePathnameToViewParams(pathname, { basePath: basePathname }).length);
    } catch {
      return routeStateDepth;
    }
  }

  shouldShowMobileTabBar() {
    return this.getMobileViewStackDepth() <= 1;
  }

  toMobileTabNodes(options: MobileTabNodeOptions) {
    const basePathname = options.basePathname || this.getMobileBasePathname();

    const nodes = (this.subModels.menuItems || [])
      .map((item) =>
        typeof item.toMobileTabNode === 'function'
          ? item.toMobileTabNode({
              ...options,
              basePathname,
            })
          : null,
      )
      .filter((item): item is MobileTabNode => !!item);

    if (!nodes.length || nodes.some((item) => item.active)) {
      return nodes;
    }

    const fallbackFlowPage = nodes.find((item) => item.type === NocoBaseDesktopRouteType.flowPage);
    if (!fallbackFlowPage) {
      return nodes;
    }

    return nodes.map((item) => ({
      ...item,
      active: item.key === fallbackFlowPage.key,
    }));
  }

  render() {
    return <MobileLayoutComponent model={this} />;
  }
}

export default MobileLayoutModel;
