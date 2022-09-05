import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Avatar, Card, Layout, Menu, message, PageHeader, Popconfirm, Spin, Switch, Tabs } from 'antd';
import React, { createContext, useContext } from 'react';
import { Redirect, useHistory, useRouteMatch } from 'react-router-dom';
import { ACLPane } from '../acl';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerPane } from '../collection-manager';
import { useDocumentTitle } from '../document-title';
import { FileStoragePane } from '../file-manager';
import { RouteSwitchContext } from '../route-switch';
import { BlockTemplatesPane } from '../schema-templates';
import { SystemSettingsPane } from '../system-settings';

const SettingsCenterContext = createContext<any>({});

const PluginCard = (props) => {
  const history = useHistory<any>();
  const { data = {} } = props;
  const api = useAPIClient();
  return (
    <Card
      bordered={false}
      style={{ width: 'calc(20% - 24px)', marginRight: 24, marginBottom: 24 }}
      actions={[
        <SettingOutlined
          onClick={() => {
            history.push(`/admin/settings/hello/tab1`);
          }}
        />,
        <Popconfirm
          title="Are you sure to delete this plugin?"
          onConfirm={async () => {
            await api.request({
              url: `pm:remove/${data.name}`,
            });
            message.success('插件删除成功');
            window.location.reload();
          }}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <DeleteOutlined />
        </Popconfirm>,
        <Switch
          size={'small'}
          onChange={async (checked) => {
            await api.request({
              url: `pm:${checked ? 'enable' : 'disable'}/${data.name}`,
            });
            message.success(checked ? '插件激活成功' : '插件禁用成功');
            window.location.reload();
          }}
          defaultChecked={data.enabled}
        ></Switch>,
      ]}
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
  return <div style={{ fontSize: 18 }}>Coming soon...</div>;
};

const PluginList = (props) => {
  const match = useRouteMatch<any>();
  const history = useHistory<any>();
  const { tabName = 'local' } = match.params || {};
  const { setTitle } = useDocumentTitle();
  return (
    <div>
      <PageHeader
        ghost={false}
        title={'Plugin manager'}
        footer={
          <Tabs
            activeKey={tabName}
            onChange={(activeKey) => {
              history.push(`/admin/plugins/${activeKey}`);
            }}
          >
            <Tabs.TabPane tab={'Local'} key={'local'} />
            <Tabs.TabPane tab={'Built-in'} key={'built-in'} />
            <Tabs.TabPane tab={'Marketplace'} key={'marketplace'} />
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
    title: 'ACL',
    tabs: {
      roles: {
        title: 'Roles & Permissions',
        component: ACLPane,
      },
    },
  },
  'block-templates': {
    title: 'Block templates',
    tabs: {
      collections: {
        title: 'Block templates',
        component: BlockTemplatesPane,
      },
    },
  },
  'collection-manager': {
    title: 'Collection manager',
    tabs: {
      collections: {
        title: 'Collections & Fields',
        component: CollectionManagerPane,
      },
    },
  },
  'file-manager': {
    title: 'File manager',
    tabs: {
      storages: {
        title: 'File storages',
        component: FileStoragePane,
      },
      // test: {
      //   title: 'Test',
      //   component: FileStoragePane,
      // },
    },
  },
  'system-settings': {
    title: 'System settings',
    tabs: {
      'system-settings': {
        title: 'System settings',
        component: SystemSettingsPane,
      },
    },
  },
};

const SettingsCenter = (props) => {
  const match = useRouteMatch<any>();
  const history = useHistory<any>();
  const items = useContext(SettingsCenterContext);
  const { pluginName, tabName } = match.params || {};
  if (!pluginName) {
    return <Redirect to={`/admin/settings/acl/roles`} />;
  }
  const component = items[pluginName]?.tabs?.[tabName]?.component;
  return (
    <div>
      <Layout>
        <Layout.Sider theme={'light'}>
          <Menu selectedKeys={[pluginName]} style={{ height: 'calc(100vh - 46px)' }}>
            {Object.keys(items).sort().map((key) => {
              const item = items[key];
              const tabKey = Object.keys(item.tabs).shift();
              return (
                <Menu.Item
                  key={key}
                  onClick={() => {
                    history.push(`/admin/settings/${key}/${tabKey}`);
                  }}
                >
                  {item.title}
                </Menu.Item>
              );
            })}
          </Menu>
        </Layout.Sider>
        <Layout.Content>
          <PageHeader
            ghost={false}
            title={items[pluginName]?.title}
            footer={
              <Tabs
                activeKey={tabName}
                onChange={(activeKey) => {
                  history.push(`/admin/settings/${pluginName}/${activeKey}`);
                }}
              >
                {Object.keys(items[pluginName].tabs).map((tabKey) => {
                  const tab = items[pluginName].tabs?.[tabKey];
                  return <Tabs.TabPane tab={tab?.title} key={tabKey} />;
                })}
              </Tabs>
            }
          />
          <div style={{ margin: 24 }}>{component && React.createElement(component)}</div>
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
      path: '/admin/plugins/:tabName?',
      component: PluginList,
    },
    {
      type: 'route',
      path: '/admin/settings/:pluginName?/:tabName?',
      component: SettingsCenter,
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
