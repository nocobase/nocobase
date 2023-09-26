import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { Layout, Menu, Result } from 'antd';
import _ from 'lodash';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStyles } from './style';
import { SettingPageType, useApp } from '../application';
import { useCompile } from '../schema-component';

export const ADMIN_SETTINGS_PATH = '/admin/settings';
export const SettingsCenterContext = createContext<any>({});

export const SettingsCenterComponent = () => {
  const { styles, theme } = useStyles();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const settings = app.settingsCenter.getList();
  const compile = useCompile();
  const menus = useMemo(() => {
    return settings.map((item) => ({
      label: compile(item.label),
      title: compile(item.title),
      icon: item.icon,
      key: item.name,
    }));
  }, [compile, settings]);
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

  const currentMenu = useMemo(() => {
    return settingsMapByPath[location.pathname];
  }, [location.pathname, settingsMapByPath]);

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
            selectedKeys={[currentMenu?.pluginName]}
            style={{ height: 'calc(100vh - 46px)', overflowY: 'auto', overflowX: 'hidden' }}
            onClick={({ key }) => {
              const plugin = settings.find((item) => item.name === key);
              if (plugin.children?.length) {
                return navigate(getFirstDeepChildPath(plugin.children));
              } else {
                return navigate(plugin.path);
              }
            }}
            items={menus}
          />
        </Layout.Sider>
        <Layout.Content>
          {currentMenu && (
            <PageHeader
              className={styles.pageHeader}
              style={{ paddingBottom: theme.paddingSM }}
              ghost={false}
              title={compile(currentMenu.title)}
            />
          )}
          <div className={styles.pageContent}>
            {currentMenu ? (
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

export const SettingsCenterProvider = (props) => {
  const { settings = {} } = props;
  const items = useContext(SettingsCenterContext);
  return (
    <SettingsCenterContext.Provider value={{ ...items, ...settings }}>{props.children}</SettingsCenterContext.Provider>
  );
};
