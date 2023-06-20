import { PageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { Layout, Menu, Result, Spin, Tabs } from 'antd';
import _, { sortBy } from 'lodash';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useACLRoleContext } from '../acl/ACLProvider';
import { ACLPane } from '../acl/ACLShortcut';
import { useRequest } from '../api-client';
import { CollectionManagerPane } from '../collection-manager';
import { Icon } from '../icon';
import { RouteSwitchContext } from '../route-switch';
import { useCompile } from '../schema-component';
import { BlockTemplatesPane } from '../schema-templates';
import { SystemSettingsPane } from '../system-settings';
import { BuiltInPluginCard, PluginCard } from './Card';
import { useStyles } from './style';

export interface TData {
  data: IPluginData[];
  meta: IMetaData;
}

export interface IPluginData {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  displayName: string;
  version: string;
  enabled: boolean;
  installed: boolean;
  builtIn: boolean;
  options: Record<string, unknown>;
  description?: string;
}

export interface IMetaData {
  count: number;
  page: number;
  pageSize: number;
  totalPage: number;
  allowedActions: AllowedActions;
}

export interface AllowedActions {
  view: number[];
  update: number[];
  destroy: number[];
}

// TODO: refactor card/built-int card

export const SettingsCenterContext = createContext<any>({});

const LocalPlugins = () => {
  // TODO: useRequest types for data ts type
  const { data, loading }: { data: TData; loading: boolean } = useRequest<TData>({
    url: 'applicationPlugins:list',
    params: {
      filter: {
        'builtIn.$isFalsy': true,
      },
      sort: 'name',
      paginate: false,
    },
  });
  if (loading) {
    return <Spin />;
  }

  return (
    <>
      {data?.data?.map((item) => {
        const { id } = item;
        return <PluginCard data={item} key={id} />;
      })}
    </>
  );
};

const BuiltinPlugins = () => {
  const { data, loading } = useRequest({
    url: 'applicationPlugins:list',
    params: {
      filter: {
        'builtIn.$isTruly': true,
      },
      sort: 'name',
      paginate: false,
    },
  });
  if (loading) {
    return <Spin />;
  }
  return (
    <>
      {data?.data?.map((item) => {
        const { id } = item;
        return <BuiltInPluginCard data={item} key={id} />;
      })}
    </>
  );
};

const MarketplacePlugins = () => {
  const { t } = useTranslation();
  return <div style={{ fontSize: 18 }}>{t('Coming soon...')}</div>;
};

const PluginList = () => {
  const params = useParams<any>();
  const navigate = useNavigate();
  const { tabName = 'local' } = params;
  const { t } = useTranslation();
  const { snippets = [] } = useACLRoleContext();
  const { styles } = useStyles();

  useEffect(() => {
    const { tabName } = params;
    if (!tabName) {
      navigate(`/admin/pm/list/local/`, { replace: true });
    }
  }, []);

  return snippets.includes('pm') ? (
    <div>
      <PageHeader
        className={styles.pageHeader}
        ghost={false}
        title={t('Plugin manager')}
        footer={
          <Tabs
            activeKey={tabName}
            onChange={(activeKey) => {
              navigate(`/admin/pm/list/${activeKey}`);
            }}
            items={[
              {
                key: 'local',
                label: t('Local'),
              },
              {
                key: 'built-in',
                label: t('Built-in'),
              },
              {
                key: 'marketplace',
                label: t('Marketplace'),
              },
            ]}
          />
        }
      />
      <div className={'m24'} style={{ margin: 24, display: 'flex', flexFlow: 'row wrap' }}>
        {React.createElement(
          {
            local: LocalPlugins,
            'built-in': BuiltinPlugins,
            marketplace: MarketplacePlugins,
          }[tabName],
        )}
      </div>
    </div>
  ) : (
    <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />
  );
};

const settings = {
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

const SettingsCenter = () => {
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
          <div className={'m24'} style={{ margin: 24 }}>
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
  const { routes, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift(
    {
      type: 'route',
      path: '/admin/pm/list/:tabName?/:mdfile?',
      component: PluginList,
    },
    {
      type: 'route',
      path: '/admin/settings/:pluginName?/:tabName?',
      component: SettingsCenter,
      uiSchemaUid: routes[1].uiSchemaUid,
    },
  );
  return (
    <SettingsCenterProvider settings={settings}>
      <RouteSwitchContext.Provider value={{ ...others, routes }}>{props.children}</RouteSwitchContext.Provider>
    </SettingsCenterProvider>
  );
};

export default PMProvider;

export * from './PluginManagerLink';
