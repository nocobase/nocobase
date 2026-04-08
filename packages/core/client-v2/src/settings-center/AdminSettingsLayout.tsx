/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ApiOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { Layout, Menu, Result, theme } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useACLRoleContext } from '../acl';
import { ADMIN_SETTINGS_PATH, type PluginSettingsPageType } from '../PluginSettingsManager';
import { useApp } from '../hooks/useApp';
import { AdminSettingsLayoutModel } from './AdminSettingsLayoutModel';
import {
  ADMIN_SETTINGS_LAYOUT_MODEL_UID,
  createSettingsPathMap,
  filterRenderableSettings,
  getDefaultSettingsPath,
  getMenuItems,
  matchSettingsRoute,
  PLUGIN_MANAGER_SETTING_NAME,
  replaceRouteParams,
  sortTopLevelSettings,
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
 * 该组件负责左侧菜单、顶部 tabs、默认落点和两类空态，
 * 页面内容本身继续由各个 settings route 的 `<Outlet />` 渲染。
 */
export const InternalAdminSettingsLayout = () => {
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const { snippets = [] } = useACLRoleContext();

  const allSettings = useMemo(
    () => filterRenderableSettings(app.pluginSettingsManager.getList()),
    [app.pluginSettingsManager, snippets],
  );
  const pluginManagerSetting = useMemo(
    () => allSettings.find((item) => item.name === PLUGIN_MANAGER_SETTING_NAME) || null,
    [allSettings],
  );
  const normalSettings = useMemo(
    () => sortTopLevelSettings(allSettings.filter((item) => item.name !== PLUGIN_MANAGER_SETTING_NAME)),
    [allSettings],
  );
  const allVisibleSettings = useMemo(
    () => (pluginManagerSetting ? [pluginManagerSetting, ...normalSettings] : normalSettings),
    [normalSettings, pluginManagerSetting],
  );
  const settingsMapByPath = useMemo(() => createSettingsPathMap(allVisibleSettings), [allVisibleSettings]);
  const currentSetting = useMemo(
    () => matchSettingsRoute(settingsMapByPath, location.pathname),
    [location.pathname, settingsMapByPath],
  );
  const currentTopLevelSetting = useMemo(() => {
    if (!currentSetting) {
      return null;
    }
    return allVisibleSettings.find((item) => item.name === currentSetting.topLevelName) || currentSetting;
  }, [allVisibleSettings, currentSetting]);
  const defaultSettingsPath = useMemo(() => getDefaultSettingsPath(allVisibleSettings), [allVisibleSettings]);

  useEffect(() => {
    const nextTitle =
      currentTopLevelSetting && typeof currentTopLevelSetting.title === 'string'
        ? currentTopLevelSetting.title
        : currentTopLevelSetting?.topLevelName;

    if (nextTitle) {
      document.title = nextTitle;
    }
  }, [currentTopLevelSetting?.title, currentTopLevelSetting?.topLevelName]);

  const sidebarMenus = useMemo(() => {
    const items: any[] = [];

    if (pluginManagerSetting && snippets.includes('pm')) {
      items.push({
        key: pluginManagerSetting.name,
        icon: pluginManagerSetting.icon || <ApiOutlined />,
        label: pluginManagerSetting.label || t('Plugin manager'),
      });
    }

    if (items.length && normalSettings.length) {
      items.push({ type: 'divider' });
    }

    const normalMenuItems =
      getMenuItems(normalSettings.map((item) => ({ ...item, children: undefined }) as PluginSettingsPageType)) || [];

    items.push(...normalMenuItems);

    return items;
  }, [normalSettings, pluginManagerSetting, snippets, t]);

  const shouldRedirectToDefault =
    location.pathname === ADMIN_SETTINGS_PATH ||
    location.pathname === ADMIN_SETTINGS_PATH.replace(/\/$/, '') ||
    location.pathname === `${ADMIN_SETTINGS_PATH}index`;

  if (shouldRedirectToDefault && defaultSettingsPath) {
    return <Navigate replace to={defaultSettingsPath} />;
  }

  if (shouldRedirectToDefault && !defaultSettingsPath) {
    return <SettingsEmpty type="home" />;
  }

  if (!currentSetting) {
    return <SettingsEmpty type="route" />;
  }

  if (location.pathname === currentTopLevelSetting?.path && currentTopLevelSetting?.children?.length) {
    const firstChildPath = getDefaultSettingsPath(currentTopLevelSetting.children);
    if (firstChildPath && firstChildPath !== location.pathname) {
      return <Navigate replace to={firstChildPath} />;
    }
  }

  if (currentSetting.link) {
    return <Navigate replace to={currentSetting.link} />;
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
      <Layout.Sider
        width={200}
        style={{
          background: token.colorBgContainer,
          borderInlineEnd: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Menu
          selectedKeys={[currentSetting?.pluginKey || currentSetting?.topLevelName || currentSetting?.name]}
          style={{ height: '100%', borderInlineEnd: 'none' }}
          onClick={({ key }) => {
            const topLevelSetting = allVisibleSettings.find((item) => item.name === key);
            if (!topLevelSetting) {
              return;
            }

            if (topLevelSetting.link) {
              window.open(topLevelSetting.link, '_blank', 'noopener,noreferrer');
              return;
            }

            const firstPath = topLevelSetting.children?.length
              ? getDefaultSettingsPath(topLevelSetting.children)
              : topLevelSetting.path;

            if (firstPath) {
              navigate(firstPath);
            }
          }}
          items={sidebarMenus}
        />
      </Layout.Sider>
      <Layout.Content
        style={{
          background: token.colorBgLayout,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <PageHeader
          ghost={false}
          title={currentTopLevelSetting?.title}
          style={{
            background: token.colorBgContainer,
            borderBlockEnd: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
            paddingBottom:
              currentTopLevelSetting?.children?.length && currentTopLevelSetting.showTabs !== false ? 0 : token.padding,
          }}
          footer={
            currentTopLevelSetting?.children?.length && currentTopLevelSetting.showTabs !== false ? (
              <Menu
                mode="horizontal"
                selectedKeys={[currentSetting?.name]}
                items={getMenuItems(currentTopLevelSetting.children)}
                onClick={({ key }) => {
                  const targetPath = replaceRouteParams(app.pluginSettingsManager.getRoutePath(String(key)), params);
                  if (location.pathname !== targetPath) {
                    navigate(targetPath);
                  }
                }}
                style={{ marginLeft: -token.marginSM, borderBottom: 'none' }}
              />
            ) : null
          }
        />
        <div
          style={{
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
  const modelChildren = <InternalAdminSettingsLayout {...props} />;
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
