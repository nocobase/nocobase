export * from './PluginManagerLink';
import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { Layout, Menu, Result, Tabs } from 'antd';
import _, { sortBy } from 'lodash';
import React, { createContext, useContext, useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useACLRoleContext } from '../acl/ACLProvider';
import { ACLPane } from '../acl/ACLShortcut';
import { CollectionManagerPane } from '../collection-manager';
import { Icon } from '../icon';
import { useCompile } from '../schema-component';
import { BlockTemplatesPane } from '../schema-templates';
import { SystemSettingsPane } from '../system-settings';
import { useStyles } from './style';

export const SettingsCenterContext = createContext<any>({});

export const settings = {
  acl: {
    title: '{{t("ACL")}}',
    icon: 'LockOutlined',
    tabs: {
      roles: {
        isBookmark: true,
        title: '{{t("Roles & Permissions")}}',
        component: () => <ACLPane />,
      },
    },
  },
  'ui-schema-storage': {
    title: '{{t("Block templates")}}',
    icon: 'LayoutOutlined',
    tabs: {
      'block-templates': {
        title: '{{t("Block templates")}}',
        component: BlockTemplatesPane,
      },
    },
  },
  'collection-manager': {
    icon: 'DatabaseOutlined',
    title: '{{t("Collection manager")}}',
    tabs: {
      collections: {
        isBookmark: true,
        title: '{{t("Collections & Fields")}}',
        component: CollectionManagerPane,
      },
    },
  },
  'system-settings': {
    icon: 'SettingOutlined',
    title: '{{t("System settings")}}',
    tabs: {
      'system-settings': {
        isBookmark: true,
        title: '{{t("System settings")}}',
        component: SystemSettingsPane,
      },
    },
  },
};

export const getPluginsTabs = _.memoize((items, snippets) => {
  const pluginsTabs = Object.keys(items).map((plugin) => {
    const tabsObj = items[plugin].tabs;
    const tabs = sortBy(
      Object.keys(tabsObj).map((tab) => {
        return {
          key: tab,
          ...tabsObj[tab],
          isAllow: snippets.includes('pm.*') && !snippets?.includes(`!pm.${plugin}.${tab}`),
        };
      }),
      (o) => !o.isAllow,
    );
    return {
      ...items[plugin],
      key: plugin,
      tabs,
      isAllow: !tabs.every((v) => !v.isAllow),
    };
  });
  return sortBy(pluginsTabs, (o) => !o.isAllow);
});

export const SettingsCenter = () => {
  const { styles } = useStyles();
  const { snippets = [] } = useACLRoleContext();
  const params = useParams<any>();
  const navigate = useNavigate();
  const items = useContext(SettingsCenterContext);
  const pluginsTabs = getPluginsTabs(items, snippets);
  const compile = useCompile();
  const firstUri = useMemo(() => {
    const pluginName = pluginsTabs[0].key;
    const tabName = pluginsTabs[0].tabs[0].key;
    return `/admin/settings/${pluginName}/${tabName}`;
  }, [pluginsTabs]);
  const { pluginName, tabName } = params;
  const activePlugin = pluginsTabs.find((v) => v.key === pluginName);
  const aclPluginTabCheck = activePlugin?.isAllow && activePlugin.tabs.find((v) => v.key === tabName)?.isAllow;
  if (!pluginName) {
    return <Navigate replace to={firstUri} />;
  }
  if (!items[pluginName]) {
    return <Navigate replace to={firstUri} />;
  }
  if (!tabName) {
    const firstTabName = Object.keys(items[pluginName]?.tabs).shift();
    return <Navigate replace to={`/admin/settings/${pluginName}/${firstTabName}`} />;
  }
  const component = items[pluginName]?.tabs?.[tabName]?.component;
  const plugin: any = pluginsTabs.find((v) => v.key === pluginName);
  const menuItems: any = pluginsTabs
    .filter((plugin) => plugin.isAllow)
    .map((plugin) => {
      return {
        label: compile(plugin.title),
        key: plugin.key,
        icon: plugin.icon ? <Icon type={plugin.icon} /> : null,
      };
    });
  return (
    <div>
      <Layout>
        <Layout.Sider
          className={css`
            height: 100%;
            /* position: fixed;
            padding-top: 46px; */
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
            selectedKeys={[pluginName]}
            style={{ height: 'calc(100vh - 46px)', overflowY: 'auto', overflowX: 'hidden' }}
            onClick={(e) => {
              const item = items[e.key];
              const tabKey = Object.keys(item.tabs).shift();
              navigate(`/admin/settings/${e.key}/${tabKey}`);
            }}
            items={menuItems as any}
          />
        </Layout.Sider>
        <Layout.Content>
          {aclPluginTabCheck && (
            <PageHeader
              className={styles.pageHeader}
              ghost={false}
              title={compile(items[pluginName]?.title)}
              footer={
                <Tabs
                  activeKey={tabName}
                  onChange={(activeKey) => {
                    navigate(`/admin/settings/${pluginName}/${activeKey}`);
                  }}
                  items={plugin.tabs?.map((tab) => {
                    if (!tab.isAllow) {
                      return null;
                    }
                    return {
                      label: compile(tab?.title),
                      key: tab.key,
                    };
                  })}
                />
              }
            />
          )}
          <div className={styles.pageContent}>
            {aclPluginTabCheck ? (
              component && React.createElement(component)
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

export const PMProvider = (props) => {
  return <SettingsCenterProvider settings={settings}>{props.children}</SettingsCenterProvider>;
};
