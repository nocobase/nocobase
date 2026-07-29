/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { Layout, Menu, Result, theme } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { PluginSettingsPageType } from '../PluginSettingsManager';
import { useApp } from '../hooks/useApp';
import { AdminSettingsLayoutModel } from './AdminSettingsLayoutModel';
import { useSettingsGroups } from './useSettingsGroups';
import {
  ADMIN_SETTINGS_LAYOUT_MODEL_UID,
  createSettingsPathMap,
  findSettingsByName,
  getDefaultSettingsPath,
  getSidebarMenuItems,
  getSidebarOpenKeys,
  getSidebarSelectedKey,
  matchSettingsRoute,
} from './utils';

function SettingsEmpty(props: { type: 'home' | 'route' }) {
  const { type } = props;
  const { t } = useTranslation();

  if (type === 'route') {
    return (
      <Result
        status="warning"
        title={t('Current settings page is unavailable')}
        subTitle={t('The requested settings page does not exist or you do not have permission to access it.')}
      />
    );
  }

  return (
    <Result
      status="info"
      title={t('No settings pages available')}
      subTitle={t(
        'No settings pages are currently available in Client V2. Settings registered by migrated plugins will appear here automatically.',
      )}
    />
  );
}

/**
 * `client-v2` 的 settings 页面壳实现。
 *
 * 一级分组铺在顶栏（见 `SettingsGroupNav`），这里负责当前分组下的二三级嵌套菜单、
 * 默认落点和两类空态，页面内容本身继续由各个 settings route 的 `<Outlet />` 渲染。
 */
export const InternalAdminSettingsLayout = () => {
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const {
    activeGroupLeadCount,
    activeGroupSettings,
    allSettings,
    currentSetting,
    currentTopLevelSetting,
    visibleSettings: allVisibleSettings,
  } = useSettingsGroups();

  const visibleSettingsMapByPath = useMemo(() => createSettingsPathMap(allVisibleSettings), [allVisibleSettings]);
  const currentVisibleSetting = useMemo(
    () => matchSettingsRoute(visibleSettingsMapByPath, location.pathname),
    [location.pathname, visibleSettingsMapByPath],
  );
  const currentVisibleTopLevelSetting = useMemo(() => {
    if (!currentSetting) {
      return null;
    }
    return allVisibleSettings.find((item) => item.name === currentSetting.topLevelName) || null;
  }, [allVisibleSettings, currentSetting]);
  const defaultSettingsPath = useMemo(() => getDefaultSettingsPath(allVisibleSettings), [allVisibleSettings]);
  const settingsRootPath = app.pluginSettingsManager.getRoutePath('');
  const settingsRootPathWithoutTrailingSlash = settingsRootPath.replace(/\/$/, '');

  const sidebarMenus = useMemo(
    () => getSidebarMenuItems(activeGroupSettings, { dividerAfter: activeGroupLeadCount }),
    [activeGroupLeadCount, activeGroupSettings],
  );
  // 分组里只有一个没有下级的配置项时，左栏会退化成「一个和顶栏分组同义的孤零零条目」，
  // 这种情况直接不渲染侧栏，让页面标题承担命名（例如「应用」分组下的 Portal 管理）。
  const shouldShowSidebar =
    sidebarMenus.length > 1 || sidebarMenus.some((item) => (item as { children?: unknown[] })?.children?.length);
  // 命中的可能是被折叠掉的子项，要换算成左栏里真实存在的那一级，否则整个左栏都不高亮。
  const selectedMenuKey = useMemo(
    () =>
      getSidebarSelectedKey(activeGroupSettings, currentVisibleSetting?.name) ||
      getSidebarSelectedKey(activeGroupSettings, currentVisibleTopLevelSetting?.name),
    [activeGroupSettings, currentVisibleSetting?.name, currentVisibleTopLevelSetting?.name],
  );
  const derivedOpenKeys = useMemo(
    () => getSidebarOpenKeys(activeGroupSettings, selectedMenuKey),
    [activeGroupSettings, selectedMenuKey],
  );
  const [manualOpenKeys, setManualOpenKeys] = useState<string[] | null>(null);
  const openKeys = manualOpenKeys ?? derivedOpenKeys;
  // 二三级菜单已经铺在左栏，页头只需要补一句「当前在哪个子页」。
  const pageSubTitle =
    currentVisibleSetting && currentVisibleSetting.title !== currentTopLevelSetting?.title
      ? currentVisibleSetting.title
      : undefined;

  // 路由变化后回到「跟随当前页面自动展开」，避免手动折叠的状态跨页面残留。
  useEffect(() => {
    setManualOpenKeys(null);
  }, [location.pathname]);

  useEffect(() => {
    const nextTitle =
      currentTopLevelSetting && typeof currentTopLevelSetting.title === 'string'
        ? currentTopLevelSetting.title
        : currentTopLevelSetting?.topLevelName;

    if (nextTitle) {
      document.title = nextTitle;
    }
  }, [currentTopLevelSetting]);

  const shouldRedirectToDefault =
    location.pathname === settingsRootPath ||
    location.pathname === settingsRootPathWithoutTrailingSlash ||
    location.pathname === `${settingsRootPath}index`;

  if (shouldRedirectToDefault && defaultSettingsPath) {
    return <Navigate replace to={defaultSettingsPath} />;
  }

  if (shouldRedirectToDefault && !defaultSettingsPath) {
    return <SettingsEmpty type="home" />;
  }

  if (!currentSetting) {
    return <SettingsEmpty type="route" />;
  }

  if (!currentVisibleSetting && currentSetting.isAllow === false) {
    return <SettingsEmpty type="route" />;
  }

  if (currentSetting.link) {
    return <Navigate replace to={currentSetting.link} />;
  }

  if (location.pathname === currentTopLevelSetting?.path && currentTopLevelSetting?.children?.length) {
    const visibleIndexPath = currentVisibleTopLevelSetting?.children?.find((item) => item.pageKey === 'index')?.path;
    const firstVisibleChildPath = getDefaultSettingsPath(
      currentVisibleTopLevelSetting?.children as PluginSettingsPageType[],
    );
    const nextPath = visibleIndexPath || firstVisibleChildPath;

    if (nextPath && nextPath !== location.pathname) {
      return <Navigate replace to={nextPath} />;
    }
  }

  return (
    <Layout
      style={{
        height: '100%',
        minHeight: '100%',
        background: token.colorBgLayout,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
      {shouldShowSidebar ? (
        <Layout.Sider
          width={200}
          style={{
            background: token.colorBgContainer,
            borderInlineEnd: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Menu
            mode="inline"
            inlineIndent={16}
            selectedKeys={selectedMenuKey ? [selectedMenuKey] : []}
            openKeys={openKeys}
            onOpenChange={(keys) => setManualOpenKeys(keys as string[])}
            style={{ height: '100%', borderInlineEnd: 'none' }}
            onClick={({ key }) => {
              const setting = findSettingsByName(activeGroupSettings, String(key));
              if (!setting) {
                return;
              }

              if (setting.link) {
                window.open(setting.link, '_blank', 'noopener,noreferrer');
                return;
              }

              const targetPath = setting.children?.length ? getDefaultSettingsPath(setting.children) : setting.path;

              if (targetPath && targetPath !== location.pathname) {
                navigate(targetPath);
              }
            }}
            items={sidebarMenus}
          />
        </Layout.Sider>
      ) : null}
      <Layout.Content
        style={{
          background: token.colorBgLayout,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <PageHeader
          ghost={false}
          title={currentTopLevelSetting?.title}
          subTitle={pageSubTitle}
          style={{
            background: token.colorBgContainer,
            borderBlockEnd: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
            paddingBottom: token.padding,
          }}
        />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            boxSizing: 'border-box',
            overflow: 'auto',
            padding: token.paddingLG,
          }}
        >
          <Outlet />
        </div>
      </Layout.Content>
    </Layout>
  );
};

/**
 * `AdminSettingsLayout` 的 FlowModel 包装组件。
 *
 * @param {Record<string, any>} props 页面壳组件入参
 * @returns {React.ReactElement} FlowModel 渲染结果
 */
export const AdminSettingsLayout = (props) => {
  const flowEngine = useFlowEngine();
  const modelRef = useRef<AdminSettingsLayoutModel | null>(null);
  const modelChildren = useMemo(() => <InternalAdminSettingsLayout {...props} />, [props]);
  const hostClassName = css`
    height: 100%;
    > div {
      height: 100%;
    }
    > div > div {
      height: 100%;
    }
    > div > div > .ant-layout.ant-layout-has-sider {
      height: 100% !important;
      min-height: 100% !important;
    }
  `;

  if (!modelRef.current) {
    modelRef.current =
      flowEngine.getModel<AdminSettingsLayoutModel>(ADMIN_SETTINGS_LAYOUT_MODEL_UID) ||
      flowEngine.createModel<AdminSettingsLayoutModel>({
        uid: ADMIN_SETTINGS_LAYOUT_MODEL_UID,
        use: AdminSettingsLayoutModel,
        props: { ...props, children: modelChildren },
      });
  }

  const model = modelRef.current;

  useEffect(() => {
    model.setProps({ ...props, children: modelChildren });
  }, [model, modelChildren, props]);

  return (
    <div className={hostClassName}>
      <FlowModelRenderer model={model} />
    </div>
  );
};

export default AdminSettingsLayout;
