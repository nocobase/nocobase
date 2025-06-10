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
import { Layout, Menu } from 'antd';
import _ from 'lodash';
import React, { createContext, useCallback, useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ADMIN_SETTINGS_PATH, PluginSettingsPageType, useApp } from '../application';
import { AppNotFound } from '../common/AppNotFound';
import { useDocumentTitle } from '../document-title';
import { useCompile } from '../schema-component';
import { useStyles } from './style';

export const SettingsCenterContext = createContext<any>({});
SettingsCenterContext.displayName = 'SettingsCenterContext';

function getMenuItems(list: PluginSettingsPageType[]) {
  return list.map((item) => {
    return {
      key: item.name,
      label: item.label,
      title: item.title,
      icon: item.icon,
      children: item.children?.length ? getMenuItems(item.children) : undefined,
    };
  });
}

function matchRoute(data, url) {
  const keys = Object.keys(data);
  if (data[url]) {
    return data[url];
  }
  for (const pattern of keys) {
    const regexPattern = pattern.replace(/:[^/]+/g, '([^/]+)');
    const match = url.match(new RegExp(`^${regexPattern}$`));

    if (match) {
      return data[pattern];
    }
  }

  return null;
}
function replaceRouteParams(urlTemplate, params) {
  // 使用正则表达式替换占位符
  return urlTemplate.replace(/:\w+/g, (match) => {
    const paramName = match.substring(1);
    return params?.[paramName] || match;
  });
}

export const AdminSettingsLayout = () => {
  const { styles, theme } = useStyles();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const compile = useCompile();
  const settings = useMemo(() => {
    const list = app.pluginSettingsManager.getList();
    // compile title
    function traverse(settings: PluginSettingsPageType[]) {
      settings.forEach((item) => {
        item.title = compile(item.title);
        item.label = compile(item.title);
        if (item.children?.length) {
          traverse(item.children);
        }
      });
    }
    traverse(list);
    return list;
  }, [app.pluginSettingsManager, compile]);
  const getFirstDeepChildPath = useCallback((settings: PluginSettingsPageType[]) => {
    if (!settings || !settings.length) {
      return '/admin';
    }

    if (settings.filter((item) => item.isTopLevel).length === 1) {
      // 如果是外链类型的，需要跳转外链，如果是内页则返回内页 path
      const pluginSetting = settings.find((item) => item.isTopLevel);
      // 如果仅有 1 个，且是外链类型的，跳转到 /admin
      // @see https://nocobase.height.app/inbox/T-5038
      return pluginSetting.link ? '/admin' : pluginSetting.path;
    }

    function find(settings: PluginSettingsPageType[]) {
      const first = settings.find((item) => !item.link); // 找到第一个非外链类型的
      if (first.children?.length) {
        return getFirstDeepChildPath(first.children);
      }
      return first;
    }

    return find(settings).path;
  }, []);

  const settingsMapByPath = useMemo<Record<string, PluginSettingsPageType>>(() => {
    const map = {};
    const traverse = (settings: PluginSettingsPageType[]) => {
      settings.forEach((item) => {
        map[item.path] = item;
        if (item.children?.length) {
          traverse(item.children);
        }
      });
    };
    traverse(settings);
    return map;
  }, [settings]);

  const { setTitle: setDocumentTitle } = useDocumentTitle();

  const currentSetting = useMemo(
    () => matchRoute(settingsMapByPath, location.pathname),
    [location.pathname, settingsMapByPath],
  );
  const currentTopLevelSetting = useMemo(() => {
    if (!currentSetting) {
      return null;
    }
    return settings.find((item) => item.name === currentSetting.topLevelName);
  }, [currentSetting, settings]);

  useEffect(() => {
    if (_.isString(currentTopLevelSetting?.title)) {
      setDocumentTitle(currentTopLevelSetting?.title);
    } else {
      setDocumentTitle(currentTopLevelSetting?.topLevelName);
    }
  }, [currentTopLevelSetting?.title, currentTopLevelSetting?.topLevelName, setDocumentTitle]);

  const sidebarMenus = useMemo(() => {
    return getMenuItems(settings.filter((v) => v.isTopLevel !== false).map((item) => ({ ...item, children: null })));
  }, [settings]);
  if (!currentSetting || location.pathname === ADMIN_SETTINGS_PATH || location.pathname === ADMIN_SETTINGS_PATH + '/') {
    return <Navigate replace to={getFirstDeepChildPath(settings)} />;
  }
  if (location.pathname === currentTopLevelSetting.path && currentTopLevelSetting.children?.length > 0) {
    return <Navigate replace to={getFirstDeepChildPath(currentTopLevelSetting.children)} />;
  }

  // 如果是外链类型的，需要跳转并返回到上一个页面
  if (currentSetting.link) {
    return <Navigate replace to={currentSetting.link} />;
  }

  return (
    <div>
      <Layout>
        <Layout.Sider
          className={css`
            height: 100%;
            left: 0;
            top: 0;
            background: rgba(0, 0, 0, 0);
            z-index: 100;
            .ant-layout-sider-children {
              top: 46px;
              position: fixed;
              width: 200px;
              height: calc(100vh - 46px);
            }
          `}
          theme={'light'}
        >
          <Menu
            selectedKeys={[currentSetting?.pluginKey || currentSetting.topLevelName]}
            style={{ height: 'calc(100vh - 46px)', overflowY: 'auto', overflowX: 'hidden' }}
            onClick={({ key }) => {
              const plugin = settings.find((item) => item.name === key);

              if (plugin.link) {
                window.open(plugin.link, '_blank');
                return;
              }

              if (plugin.children?.length) {
                return navigate(getFirstDeepChildPath(plugin.children));
              } else {
                return navigate(plugin.path);
              }
            }}
            items={sidebarMenus}
          />
        </Layout.Sider>
        <Layout.Content>
          {currentSetting && (
            <PageHeader
              className={styles.pageHeader}
              style={{
                paddingBottom:
                  currentTopLevelSetting.children?.length > 0 && currentTopLevelSetting.showTabs !== false
                    ? 0
                    : theme.paddingSM,
              }}
              ghost={false}
              title={currentTopLevelSetting.title}
              footer={
                currentTopLevelSetting.children?.length > 0 &&
                currentTopLevelSetting.showTabs !== false && (
                  <Menu
                    style={{ marginLeft: -theme.margin }}
                    onClick={({ key }) => {
                      const targetPath = replaceRouteParams(app.pluginSettingsManager.getRoutePath(key), params);
                      if (location.pathname !== targetPath) {
                        navigate(targetPath);
                      }
                    }}
                    selectedKeys={[currentSetting?.name]}
                    mode="horizontal"
                    items={getMenuItems(currentTopLevelSetting.children)}
                  ></Menu>
                )
              }
            />
          )}
          <div className={styles.pageContent}>{currentSetting ? <Outlet /> : <AppNotFound />}</div>
        </Layout.Content>
      </Layout>
    </div>
  );
};
