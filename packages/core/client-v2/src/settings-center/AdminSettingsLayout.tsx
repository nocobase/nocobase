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
import { Layout, Menu, Result, Tabs, theme } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
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
  getSidebarSelectedKey,
  matchSettingsRoute,
} from './utils';

function SettingsEmpty(props: { type: 'forbidden' | 'home' | 'not-found' }) {
  const { type } = props;
  const { t } = useTranslation();

  let status: '403' | '404' | 'info';
  let title: string;
  let subTitle: string;

  if (type === 'forbidden') {
    status = '403';
    title = t('Your current role cannot access Settings');
    subTitle = t('Switch to a role with access, or contact an administrator to request access.');
  } else if (type === 'not-found') {
    status = '404';
    title = t('Settings page not found');
    subTitle = t('The settings page you requested does not exist or has been removed.');
  } else {
    status = 'info';
    title = t('No settings pages available');
    subTitle = t(
      'No settings pages are currently available in Client V2. Settings registered by migrated plugins will appear here automatically.',
    );
  }

  return (
    <div role="status" aria-atomic="true">
      <Result
        status={status}
        title={
          <span role="heading" aria-level={1}>
            {title}
          </span>
        }
        subTitle={subTitle}
      />
    </div>
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

  const sidebarMenus = useMemo(() => getSidebarMenuItems(activeGroupSettings), [activeGroupSettings]);
  // 分组里只有一个顶级配置项时不铺左栏：那样整条侧栏只是把顶栏那一项重复一遍。
  // 它自己的下级（用户和权限的 用户 / 角色和权限 / 同步，AI 员工的几个页面）改用页头下的 Tab。
  const shouldShowSidebar = activeGroupSettings.length > 1;
  // 子页面一律走页头下的 Tab：左栏只表达「哪个模块」，模块内部的分页交给 Tab，
  // 和 v1 设置中心保持一致。
  const pageTabs = useMemo(() => {
    const children = (currentVisibleTopLevelSetting?.children || []).filter(
      (item) => !item.hidden && !item.link && item.path,
    );
    return children.length > 1 ? children.map((item) => ({ key: item.path, label: item.label ?? item.title })) : [];
  }, [currentVisibleTopLevelSetting]);
  const activeTabKey = useMemo(() => {
    if (!pageTabs.length) {
      return undefined;
    }
    const matched = pageTabs.find(
      (tab) => location.pathname === tab.key || location.pathname.startsWith(`${tab.key}/`),
    );
    return matched?.key ?? pageTabs[0]?.key;
  }, [location.pathname, pageTabs]);
  // 命中的可能是被折叠掉的子项，要换算成左栏里真实存在的那一级，否则整个左栏都不高亮。
  const selectedMenuKey = useMemo(
    () =>
      getSidebarSelectedKey(activeGroupSettings, currentVisibleSetting?.name) ||
      getSidebarSelectedKey(activeGroupSettings, currentVisibleTopLevelSetting?.name),
    [activeGroupSettings, currentVisibleSetting?.name, currentVisibleTopLevelSetting?.name],
  );
  // 页头只需要补一句「当前在哪个子页」。
  const pageSubTitle =
    currentVisibleSetting && currentVisibleSetting.title !== currentTopLevelSetting?.title
      ? currentVisibleSetting.title
      : undefined;

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
  const currentPathWithoutTrailingSlash = location.pathname.replace(/\/+$/, '');
  const currentTopLevelPathWithoutTrailingSlash = currentTopLevelSetting?.path.replace(/\/+$/, '');
  const isTopLevelSettingsPath =
    currentPathWithoutTrailingSlash === currentTopLevelPathWithoutTrailingSlash &&
    !!currentTopLevelSetting?.children?.length;
  const visibleIndexPath = isTopLevelSettingsPath
    ? currentVisibleTopLevelSetting?.children?.find((item) => item.pageKey === 'index')?.path
    : undefined;
  const firstVisibleChildPath = isTopLevelSettingsPath
    ? getDefaultSettingsPath(currentVisibleTopLevelSetting?.children as PluginSettingsPageType[])
    : undefined;
  const nextVisibleChildPath = visibleIndexPath || firstVisibleChildPath;

  if (shouldRedirectToDefault && defaultSettingsPath) {
    return <Navigate replace to={defaultSettingsPath} />;
  }

  if (shouldRedirectToDefault && !defaultSettingsPath) {
    return <SettingsEmpty type="home" />;
  }

  if (!currentSetting) {
    return <SettingsEmpty type="not-found" />;
  }

  if (currentSetting.isAllow === false) {
    if (nextVisibleChildPath && nextVisibleChildPath !== location.pathname) {
      return <Navigate replace to={nextVisibleChildPath} />;
    }

    return <SettingsEmpty type="forbidden" />;
  }

  if (currentSetting.link) {
    return <Navigate replace to={currentSetting.link} />;
  }

  if (nextVisibleChildPath && nextVisibleChildPath !== location.pathname) {
    return <Navigate replace to={nextVisibleChildPath} />;
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
        {/*
          页头放在滚动容器**内部**：钉在外面会让页面出现嵌套滚动（窗口一条、内容区一条），
          插件页面自己再带滚动区时会套成两三层，而且长页面白白少掉一条页头的高度。
        */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            boxSizing: 'border-box',
            overflow: 'auto',
          }}
        >
          <PageHeader
            ghost={false}
            title={currentTopLevelSetting?.title}
            subTitle={pageTabs.length ? undefined : pageSubTitle}
            footer={
              pageTabs.length ? (
                <Tabs
                  activeKey={activeTabKey}
                  items={pageTabs}
                  tabBarStyle={{ marginBottom: 0 }}
                  onChange={(key) => {
                    if (key !== location.pathname) {
                      navigate(key);
                    }
                  }}
                />
              ) : undefined
            }
            style={{
              background: token.colorBgContainer,
              borderBlockEnd: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
              paddingBottom: pageTabs.length ? 0 : token.padding,
            }}
          />
          <div style={{ padding: token.paddingLG }}>
            <Outlet />
          </div>
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
