import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { Layout, Menu, Result } from 'antd';
import _, { get } from 'lodash';
import React, { createContext, useCallback, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStyles } from './style';
import { ADMIN_SETTINGS_PATH, PluginSettingsPageType, useApp } from '../application';
import { useCompile } from '../schema-component';

export const SettingsCenterContext = createContext<any>({});

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

export const AdminSettingsLayout = () => {
  const { styles, theme } = useStyles();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
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
    const first = settings[0];
    if (first.children?.length) {
      return getFirstDeepChildPath(first.children);
    }
    return first.path;
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

  const currentSetting = useMemo(() => settingsMapByPath[location.pathname], [location.pathname, settingsMapByPath]);
  const currentTopLevelSetting = useMemo(() => {
    if (!currentSetting) {
      return null;
    }
    return settings.find((item) => item.name === currentSetting.topLevelName);
  }, [currentSetting, settings]);
  const sidebarMenus = useMemo(() => {
    return getMenuItems(settings.map((item) => ({ ...item, children: null })));
  }, [settings]);
  if (!currentSetting || location.pathname === ADMIN_SETTINGS_PATH || location.pathname === ADMIN_SETTINGS_PATH + '/') {
    return <Navigate replace to={getFirstDeepChildPath(settings)} />;
  }
  if (location.pathname === currentTopLevelSetting.path && currentTopLevelSetting.children?.length > 0) {
    return <Navigate replace to={getFirstDeepChildPath(currentTopLevelSetting.children)} />;
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
            selectedKeys={[currentSetting?.topLevelName]}
            style={{ height: 'calc(100vh - 46px)', overflowY: 'auto', overflowX: 'hidden' }}
            onClick={({ key }) => {
              const plugin = settings.find((item) => item.name === key);
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
                paddingBottom: currentTopLevelSetting.children?.length > 0 ? 0 : theme.paddingSM,
              }}
              ghost={false}
              title={currentTopLevelSetting.title}
              footer={
                currentTopLevelSetting.children?.length > 0 && (
                  <Menu
                    style={{ marginLeft: -theme.margin }}
                    onClick={({ key }) => {
                      navigate(app.pluginSettingsManager.getRoutePath(key));
                    }}
                    selectedKeys={[currentSetting?.name]}
                    mode="horizontal"
                    items={getMenuItems(currentTopLevelSetting.children)}
                  ></Menu>
                )
              }
            />
          )}
          <div className={styles.pageContent}>
            {currentSetting ? (
              <Outlet />
            ) : (
              <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />
            )}
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};
