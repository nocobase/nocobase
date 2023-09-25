import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { Layout, Menu, Result } from 'antd';
import _ from 'lodash';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useACLRoleContext } from '../acl/ACLProvider';
import { Icon } from '../icon';
import { useCompile } from '../schema-component';
import { useStyles } from './style';
import { useApp } from '../application';
import { SettingPageType } from '../application';
import { getPmKey } from '../acl/Configuration/ConfigureCenter';

export const ADMIN_SETTINGS_PATH = '/admin/settings';
export const SettingsCenterContext = createContext<any>({});

interface SettingPageTypeWithAuth extends SettingPageType {
  isAllow?: boolean;
  children?: SettingPageTypeWithAuth[];
}
export const getsettingsWithAuth = (settings: SettingPageType[], snippets: string[]): SettingPageTypeWithAuth[] => {
  return settings.map((menu) => {
    return {
      ...menu,
      isAllow: snippets.includes('pm.*') && !snippets?.includes(`!pm.${menu.key}`), // TODO: 优化
      children: menu.children ? getsettingsWithAuth(menu.children, snippets) : undefined,
    };
  });
};

export function useSettingsCenterList(callback?: (settingPage: SettingPageTypeWithAuth) => SettingPageTypeWithAuth) {
  const app = useApp();
  const compile = useCompile();
  return useMemo(() => {
    return app.settingsCenter.getList<SettingPageType>((settingPage) => {
      const title = compile(settingPage.title);
      const res = {
        ...settingPage,
        title,
        label: title,
        pluginTitle: compile(settingPage.pluginTitle),
        key: getPmKey(settingPage.key),
        icon: typeof settingPage.icon === 'string' ? <Icon type={settingPage.icon} /> : settingPage.icon,
      };
      return callback ? callback(res) : res;
    });
  }, [app.settingsCenter, callback, compile]);
}

export function useSettingsCenterListWithAuth() {
  const snippets = useACLRoleContext()?.snippets;
  return useSettingsCenterList((settingPage) => {
    return {
      ...settingPage,
      isAllow: snippets.includes('pm.*') && !snippets?.includes(`!${settingPage.key}`),
    };
  });
}

export const SettingsCenterComponent = () => {
  const { styles } = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettingsCenterListWithAuth();
  const menus = useMemo(() => {
    return settings
      .filter((item) => item.isAllow)
      .map((item) => ({
        label: item.label,
        title: item.title,
        icon: item.icon,
        key: item.key,
      }));
  }, [settings]);
  const getFirstDeepChildPath = useCallback((settings: SettingPageTypeWithAuth[]) => {
    const firstChild = settings.find((v) => v.isAllow);
    if (!firstChild) {
      return '';
    }
    if (firstChild.children?.length) {
      return getFirstDeepChildPath(firstChild.children);
    }
    return firstChild.path;
  }, []);

  const settingsMapByPath = useMemo<Record<string, SettingPageTypeWithAuth>>(() => {
    const map = {};
    const traverse = (settings: SettingPageTypeWithAuth[]) => {
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

  const currentMenu = useMemo<SettingPageTypeWithAuth>(() => {
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
            selectedKeys={[currentMenu.key]}
            style={{ height: 'calc(100vh - 46px)', overflowY: 'auto', overflowX: 'hidden' }}
            onClick={({ key }) => {
              const plugin = settings.find((item) => item.key === key);
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
          {currentMenu?.isAllow && (
            <PageHeader className={styles.pageHeader} ghost={false} title={currentMenu?.title} />
          )}
          <div className={styles.pageContent}>
            {currentMenu?.isAllow ? (
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
