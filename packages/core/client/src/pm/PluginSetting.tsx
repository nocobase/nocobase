import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { Layout, Menu, Result } from 'antd';
import _ from 'lodash';
import React, { createContext, useCallback, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStyles } from './style';
import { ADMIN_SETTINGS_PATH, SettingPageType, useApp } from '../application';
import { useCompile } from '../schema-component';

export const SettingsCenterContext = createContext<any>({});

export const SettingsCenterComponent = () => {
  const { styles, theme } = useStyles();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const compile = useCompile();
  const settings = useMemo(() => {
    const list = app.settingsCenter.getList();
    // compile title
    function traverse(settings: SettingPageType[]) {
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
  }, [app.settingsCenter, compile]);
  const getFirstDeepChildPath = useCallback((settings: SettingPageType[]) => {
    if (!settings || !settings.length) {
      return '';
    }
    const first = settings[0];
    if (first.children?.length) {
      return getFirstDeepChildPath(first.children);
    }
    return first.path;
  }, []);

  const settingsMapByPath = useMemo<Record<string, SettingPageType>>(() => {
    const map = {};
    const traverse = (settings: SettingPageType[]) => {
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
  const currentPlugin = useMemo(() => {
    if (!currentSetting) {
      return null;
    }
    return settings.find((item) => item.name === currentSetting.pluginName);
  }, [currentSetting, settings]);

  if (location.pathname === ADMIN_SETTINGS_PATH || location.pathname === ADMIN_SETTINGS_PATH + '/') {
    return <Navigate replace to={getFirstDeepChildPath(settings)} />;
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
            selectedKeys={[currentSetting?.pluginName]}
            style={{ height: 'calc(100vh - 46px)', overflowY: 'auto', overflowX: 'hidden' }}
            onClick={({ key }) => {
              const plugin = settings.find((item) => item.name === key);
              if (plugin.children?.length) {
                return navigate(getFirstDeepChildPath(plugin.children));
              } else {
                return navigate(plugin.path);
              }
            }}
            items={settings.map((item) => ({ ...item, children: undefined }))}
          />
        </Layout.Sider>
        <Layout.Content>
          {currentSetting && (
            <PageHeader
              className={styles.pageHeader}
              style={{
                paddingBottom: currentPlugin.children?.length > 0 ? 0 : theme.paddingSM,
              }}
              ghost={false}
              title={currentPlugin.title}
              footer={
                currentPlugin.children?.length > 0 && (
                  <Menu
                    style={{ marginLeft: -theme.margin }}
                    onClick={({ key }) => {
                      navigate(app.settingsCenter.getRoutePath(key));
                    }}
                    selectedKeys={[currentSetting?.name]}
                    mode="horizontal"
                    items={currentPlugin.children}
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
