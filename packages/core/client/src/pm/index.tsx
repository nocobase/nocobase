import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Avatar, Card, Layout, Menu, message, PageHeader, Popconfirm, Result, Spin, Switch, Tabs } from 'antd';
import { sortBy } from 'lodash';
import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect, useHistory, useRouteMatch } from 'react-router-dom';
import { ACLPane } from '../acl';
import { useACLRoleContext } from '../acl/ACLProvider';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerPane } from '../collection-manager';
import { useDocumentTitle } from '../document-title';
import { Icon } from '../icon';
import { RouteSwitchContext } from '../route-switch';
import { useCompile } from '../schema-component';
import { BlockTemplatesPane } from '../schema-templates';
import { SystemSettingsPane } from '../system-settings';

export const SettingsCenterContext = createContext<any>({});

const PluginCard = (props) => {
  const history = useHistory<any>();
  const { data = {} } = props;
  const api = useAPIClient();
  const { t } = useTranslation();
  return (
    <Card
      bordered={false}
      style={{ width: 'calc(20% - 24px)', marginRight: 24, marginBottom: 24 }}
      actions={[
        data.enabled ? (
          <SettingOutlined
            onClick={() => {
              history.push(`/admin/settings/${data.name}`);
            }}
          />
        ) : null,
        <Popconfirm
          title={t('Are you sure to delete this plugin?')}
          onConfirm={async () => {
            await api.request({
              url: `pm:remove/${data.name}`,
            });
            message.success(t('插件删除成功'));
            window.location.reload();
          }}
          onCancel={() => {}}
          okText={t('Yes')}
          cancelText={t('No')}
        >
          <DeleteOutlined />
        </Popconfirm>,
        <Switch
          size={'small'}
          onChange={async (checked) => {
            await api.request({
              url: `pm:${checked ? 'enable' : 'disable'}/${data.name}`,
            });
            message.success(checked ? t('插件激活成功') : t('插件禁用成功'));
            window.location.reload();
          }}
          defaultChecked={data.enabled}
        ></Switch>,
      ].filter(Boolean)}
    >
      <Card.Meta
        className={css`
          .ant-card-meta-avatar {
            margin-top: 8px;
            .ant-avatar {
              border-radius: 2px;
            }
          }
        `}
        avatar={<Avatar />}
        description={data.description}
        title={
          <span>
            {data.name}
            <span
              className={css`
                display: block;
                color: rgba(0, 0, 0, 0.45);
                font-weight: normal;
                font-size: 13px;
                // margin-left: 8px;
              `}
            >
              {data.version}
            </span>
          </span>
        }
      />
    </Card>
  );
};

const BuiltInPluginCard = (props) => {
  const { data } = props;
  return (
    <Card
      bordered={false}
      style={{ width: 'calc(20% - 24px)', marginRight: 24, marginBottom: 24 }}
      // actions={[<a>Settings</a>, <a>Remove</a>, <Switch size={'small'} defaultChecked={true}></Switch>]}
    >
      <Card.Meta
        className={css`
          .ant-card-meta-avatar {
            margin-top: 8px;
            .ant-avatar {
              border-radius: 2px;
            }
          }
        `}
        avatar={<Avatar />}
        description={data.description}
        title={
          <span>
            {data.name}
            <span
              className={css`
                display: block;
                color: rgba(0, 0, 0, 0.45);
                font-weight: normal;
                font-size: 13px;
                // margin-left: 8px;
              `}
            >
              {data.version}
            </span>
          </span>
        }
      />
    </Card>
  );
};

const LocalPlugins = () => {
  const { data, loading } = useRequest({
    url: 'applicationPlugins:list',
    params: {
      filter: {
        'builtIn.$isFalsy': true,
      },
      sort: 'name',
    },
  });
  if (loading) {
    return <Spin />;
  }
  return (
    <>
      {data?.data?.map((item) => {
        return <PluginCard data={item} />;
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
    },
  });
  if (loading) {
    return <Spin />;
  }
  return (
    <>
      {data?.data?.map((item) => {
        return <BuiltInPluginCard data={item} />;
      })}
    </>
  );
};

const MarketplacePlugins = () => {
  const { t } = useTranslation();
  return <div style={{ fontSize: 18 }}>{t('Coming soon...')}</div>;
};

const PluginList = (props) => {
  const match = useRouteMatch<any>();
  const history = useHistory<any>();
  const { tabName = 'local' } = match.params || {};
  const { setTitle } = useDocumentTitle();
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        ghost={false}
        title={t('Plugin manager')}
        footer={
          <Tabs
            activeKey={tabName}
            onChange={(activeKey) => {
              history.push(`/admin/pm/list/${activeKey}`);
            }}
          >
            <Tabs.TabPane tab={t('Local')} key={'local'} />
            <Tabs.TabPane tab={t('Built-in')} key={'built-in'} />
            <Tabs.TabPane tab={t('Marketplace')} key={'marketplace'} />
          </Tabs>
        }
      />
      <div style={{ margin: 24, display: 'flex', flexFlow: 'row wrap' }}>
        {React.createElement(
          {
            local: LocalPlugins,
            'built-in': BuiltinPlugins,
            marketplace: MarketplacePlugins,
          }[tabName],
        )}
      </div>
    </div>
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
        component: ACLPane,
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

export const getPluginsTabs = (items, snippets) => {
  const pluginsTabs = Object.keys(items).map((plugin) => {
    const tabsObj = items[plugin].tabs;
    const tabs = sortBy(
      Object.keys(tabsObj).map((tab) => {
        return {
          key: tab,
          ...tabsObj[tab],
          isAllow: !snippets?.includes('!pm.' + plugin + '.' + tab),
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
};

const SettingsCenter = (props) => {
  const { snippets = [] } = useACLRoleContext();
  const match = useRouteMatch<any>();
  const history = useHistory<any>();
  const items = useContext(SettingsCenterContext);
  const pluginsTabs = getPluginsTabs(items, snippets);
  const compile = useCompile();
  const firstUri = useMemo(() => {
    const pluginName = pluginsTabs[0].key;
    const tabName = pluginsTabs[0].tabs[0].key;
    return `/admin/settings/${pluginName}/${tabName}`;
  }, [pluginsTabs]);
  const { pluginName, tabName } = match.params || {};
  const activePlugin = pluginsTabs.find((v) => v.key === pluginName);
  const aclPluginTabCheck = activePlugin?.isAllow && activePlugin.tabs.find((v) => v.key === tabName)?.isAllow;
  if (!pluginName) {
    return <Redirect to={firstUri} />;
  }
  if (!items[pluginName]) {
    return <Redirect to={firstUri} />;
  }
  if (!tabName) {
    const firstTabName = Object.keys(items[pluginName]?.tabs).shift();
    return <Redirect to={`/admin/settings/${pluginName}/${firstTabName}`} />;
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
        <div
          style={
            {
              '--side-menu-width': '200px',
            } as Record<string, string>
          }
          className={css`
            width: var(--side-menu-width);
            overflow: hidden;
            flex: 0 0 var(--side-menu-width);
            max-width: var(--side-menu-width);
            min-width: var(--side-menu-width);
            pointer-events: none;
          `}
        ></div>
        <Layout.Sider
          className={css`
            height: 100%;
            position: fixed;
            padding-top: 46px;
            left: 0;
            top: 0;
            background: rgba(0, 0, 0, 0);
            z-index: 100;
          `}
          theme={'light'}
        >
          <Menu
            selectedKeys={[pluginName]}
            style={{ height: 'calc(100vh - 46px)', overflowY: 'auto', overflowX: 'hidden' }}
            onClick={(e) => {
              const item = items[e.key];
              const tabKey = Object.keys(item.tabs).shift();
              history.push(`/admin/settings/${e.key}/${tabKey}`);
            }}
            items={menuItems as any}
          />
        </Layout.Sider>
        <Layout.Content>
          <PageHeader
            ghost={false}
            title={compile(items[pluginName]?.title)}
            footer={
              <Tabs
                activeKey={tabName}
                onChange={(activeKey) => {
                  history.push(`/admin/settings/${pluginName}/${activeKey}`);
                }}
              >
                {plugin.tabs?.map((tab) => {
                  return tab.isAllow && <Tabs.TabPane tab={compile(tab?.title)} key={tab.key} />;
                })}
              </Tabs>
            }
          />
          <div style={{ margin: 24 }}>
            {aclPluginTabCheck ? (
              component && React.createElement(component)
            ) : (
              <Result status="403" title="403" subTitle="Sorry, you are not authorized to access this page." />
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
      path: '/admin/pm/list/:tabName?',
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
