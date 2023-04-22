import { css, cx } from '@emotion/css';
import {
  Layout,
  Menu,
  message,
  Modal,
  PageHeader,
  Popconfirm,
  Result,
  Space,
  Spin,
  Table,
  TableProps,
  Tabs,
  TabsProps,
  Tag,
  Typography,
} from 'antd';
import { sortBy } from 'lodash';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect, useHistory, useRouteMatch } from 'react-router-dom';
import { ACLPane } from '../acl';
import { useACLRoleContext } from '../acl/ACLProvider';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerPane } from '../collection-manager';
import { useDocumentTitle } from '../document-title';
import { Icon } from '../icon';
import { RouteSwitchContext } from '../route-switch';
import { useCompile, useTableSize } from '../schema-component';
import { useParseMarkdown } from '../schema-component/antd/markdown/util';
import { BlockTemplatesPane } from '../schema-templates';
import { SystemSettingsPane } from '../system-settings';
const { Link } = Typography;
export const SettingsCenterContext = createContext<any>({});

interface PluginTableProps {
  filter: any;
  builtIn?: boolean;
}

interface PluginDocumentProps {
  path: string;
  name: string;
}
const PluginDocument: React.FC<PluginDocumentProps> = (props) => {
  const { data, loading, error } = useRequest(
    {
      url: '/plugins:getTabInfo',
      params: {
        filterByTk: props.name,
        path: props.path,
      },
    },
    {
      refreshDeps: [props.name, props.path],
    },
  );
  const { html, loading: parseLoading } = useParseMarkdown(data?.data?.content);

  return (
    <div
      className={css`
        background: #ffffff;
        padding: var(--nb-spacing);
        height: 60vh;
        overflow-y: auto;
      `}
    >
      {loading || parseLoading ? (
        <Spin />
      ) : (
        <div className="nb-markdown" dangerouslySetInnerHTML={{ __html: error ? '' : html }}></div>
      )}
    </div>
  );
};

const PluginTable: React.FC<PluginTableProps> = (props) => {
  const { builtIn } = props;
  const history = useHistory<any>();
  const api = useAPIClient();
  const [plugin, setPlugin] = useState<any>(null);
  const { t, i18n } = useTranslation();
  const settingItems = useContext(SettingsCenterContext);
  const { data, loading } = useRequest({
    url: 'applicationPlugins:list',
    params: {
      filter: props.filter,
      sort: 'name',
      paginate: false,
    },
  });

  const { data: tabsData, run } = useRequest(
    {
      url: '/plugins:getTabs',
    },
    {
      manual: true,
    },
  );

  const columns = useMemo<TableProps<any>['columns']>(() => {
    return [
      {
        title: t('Plugin name'),
        dataIndex: 'displayName',
        width: 300,
        render: (displayName, record) => displayName || record.name,
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        ellipsis: true,
      },
      {
        title: t('Version'),
        dataIndex: 'version',
        width: 300,
      },
      // {
      //   title: t('Author'),
      //   dataIndex: 'author',
      //   width: 200,
      // },
      {
        title: t('Actions'),
        width: 300,
        render(data) {
          return (
            <Space>
              <Link
                onClick={() => {
                  setPlugin(data);
                  run({
                    params: {
                      filterByTk: data.name,
                    },
                  });
                }}
              >
                {t('View')}
              </Link>
              {data.enabled && settingItems[data.name] ? (
                <Link
                  onClick={() => {
                    history.push(`/admin/settings/${data.name}`);
                  }}
                >
                  {t('Setting')}
                </Link>
              ) : null}
              {!builtIn ? (
                <>
                  <Link
                    onClick={async () => {
                      const checked = !data.enabled;
                      Modal.warn({
                        title: checked ? t('Plugin starting') : t('Plugin stopping'),
                        content: t('The application is reloading, please do not close the page.'),
                        okButtonProps: {
                          style: {
                            display: 'none',
                          },
                        },
                      });
                      await api.request({
                        url: `pm:${checked ? 'enable' : 'disable'}/${data.name}`,
                      });
                      window.location.reload();
                      // message.success(checked ? t('插件激活成功') : t('插件禁用成功'));
                    }}
                  >
                    {t(data.enabled ? 'Disable' : 'Enable')}
                  </Link>
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
                    <Link>{t('Delete')}</Link>
                  </Popconfirm>
                </>
              ) : null}
            </Space>
          );
        },
      },
    ];
  }, [t, builtIn]);

  const items = useMemo<TabsProps['items']>(() => {
    return tabsData?.data?.tabs.map((item) => {
      return {
        label: item.title,
        key: item.path,
        children: React.createElement(PluginDocument, {
          name: tabsData?.data.filterByTk,
          path: item.path,
        }),
      };
    });
  }, [tabsData?.data]);

  const { height, tableSizeRefCallback } = useTableSize();

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        background: #fff;
        padding: var(--nb-spacing);
      `}
    >
      <Modal
        footer={false}
        className={css`
          .ant-modal-header {
            background: #f0f2f5;
            padding-bottom: 8px;
          }

          .ant-modal-body {
            padding-top: 0;
          }

          .ant-modal-body {
            background: #f0f2f5;
            .plugin-desc {
              padding-bottom: 8px;
            }
          }
        `}
        width="70%"
        title={
          <Typography.Title level={2} style={{ margin: 0 }}>
            {plugin?.displayName || plugin?.name}
            <Tag
              className={css`
                vertical-align: middle;
                margin-top: -3px;
                margin-left: 8px;
              `}
            >
              v{plugin?.version}
            </Tag>
          </Typography.Title>
        }
        open={!!plugin}
        onCancel={() => setPlugin(null)}
      >
        {plugin?.description && <div className={'plugin-desc'}>{plugin?.description}</div>}
        <Tabs items={items}></Tabs>
      </Modal>
      <Table
        ref={tableSizeRefCallback}
        pagination={false}
        className={css`
          .ant-spin-nested-loading {
            height: 100%;
            .ant-spin-container {
              height: 100%;
              display: flex;
              flex-direction: column;
              .ant-table {
                flex: 1;
              }
            }
          }
          height: 100%;
        `}
        scroll={{
          y: height,
        }}
        dataSource={data?.data || []}
        loading={loading}
        columns={columns}
      />
    </div>
  );
};

const LocalPlugins = () => {
  return (
    <PluginTable
      filter={{
        'builtIn.$isFalsy': true,
      }}
    ></PluginTable>
  );
};

const BuiltinPlugins = () => {
  return (
    <PluginTable
      builtIn
      filter={{
        'builtIn.$isTruly': true,
      }}
    ></PluginTable>
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
  const { snippets = [] } = useACLRoleContext();

  return snippets.includes('pm') ? (
    <div
      className={css`
        flex: 1;
        flex-direction: column;
        overflow: hidden;
        display: flex;
      `}
    >
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
      <div style={{ margin: 'var(--nb-spacing)', flex: 1, display: 'flex', flexFlow: 'row wrap' }}>
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
    <div
      className={cx(
        'nb-setting-center',
        css`
          &.nb-setting-center {
            flex: 1;
          }
        `,
      )}
    >
      <Layout
        className={css`
          height: 100%;
        `}
      >
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
        <Layout.Content
          className={css`
            display: flex;
            flex-direction: column;
          `}
        >
          {aclPluginTabCheck && (
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
          )}
          <div style={{ margin: 'var(--nb-spacing)', flex: 1 }}>
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
