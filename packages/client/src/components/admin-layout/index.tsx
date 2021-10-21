import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Button,
  Spin,
  Layout,
  PageHeader,
  Modal,
  Menu,
  Collapse,
  Dropdown,
  Tooltip,
} from 'antd';
import isEmpty from 'lodash/isEmpty';
import {
  Link,
  useLocation,
  useRouteMatch,
  useHistory,
  Redirect,
} from 'react-router-dom';
import { SchemaRenderer } from '../../schemas';
import { useRequest } from 'ahooks';
import './style.less';

import { ISchema, Schema } from '@formily/react';
import Database, { useAsyncDataSource } from './datatable';
import { HighlightOutlined } from '@ant-design/icons';
import cls from 'classnames';
import {
  DesignableSwitchProvider,
  useDesignableSwitchContext,
  PageTitleProvider,
  usePageTitleContext,
  CollectionsProvider,
  useCollectionsContext,
} from '../../constate';
import { uid } from '@formily/shared';
import { Permissions } from './Permissions';
import { Collections } from './Collections';
import { More } from './More';
import { UserInfo } from './UserInfo';
import {
  SiteTitle,
  SystemSettingsProvider,
  useSystemSettings,
} from './SiteTitle';
import { AuthProvider } from './Auth';
import { Helmet } from 'react-helmet';
import { MenuSelectedKeysContext } from '../../schemas/menu';
import { useTranslation } from 'react-i18next';

function DesignableToggle() {
  const { t } = useTranslation();
  const { designable, setDesignable } = useDesignableSwitchContext();
  return (
    <Tooltip title={t('Layout Editor')}>
      <Button
        className={cls('nb-designable-toggle', { active: designable })}
        type={'primary'}
        style={{ height: 46, border: 0 }}
        onClick={() => {
          setDesignable(!designable);
        }}
      >
        <HighlightOutlined />
      </Button>
    </Tooltip>
  );
}

interface LayoutWithMenuProps {
  schema: Schema;
  [key: string]: any;
}

function LayoutWithMenu(props: LayoutWithMenuProps) {
  const { schema, defaultSelectedKeys } = props;
  const match = useRouteMatch<any>();
  const sideMenuRef = useRef();
  const history = useHistory();
  const { title } = useSystemSettings();
  const [activeKey, setActiveKey] = useState(match.params.name);
  const { setPageTitle } = usePageTitleContext();

  const [selectedKeys, setSelectedKeys] = useState(defaultSelectedKeys);
  const onSelect = (info) => {
    if (!info.schema) {
      setActiveKey(null);
    } else if (info.schema['x-component'] === 'Menu.SubMenu') {
      const findMenuItem = (schema: Schema) => {
        const first = Object.values(schema.properties || {}).shift();
        if (!first) {
          return null;
        }
        if (['Menu.Link', 'Menu.URL'].includes(first['x-component'])) {
          return first;
        }
        return findMenuItem(first);
      };
      console.log('info.schema', findMenuItem(info.schema));
      // 实际应该取第一个子元素
      const node = findMenuItem(info.schema);
      setActiveKey(node?.key);
      if (node?.key) {
        history.push(`/admin/${node?.key}`);
        const keys = [node?.name];
        let parent = node?.parent;
        while (parent) {
          if (parent['x-component'] === 'Menu') {
            break;
          }
          keys.unshift(parent.name);
          parent = parent.parent;
        }
        setSelectedKeys(keys);
        if (node.title) {
          setPageTitle(node.title);
        }
      }
    } else {
      setActiveKey(info.schema.key);
      history.push(`/admin/${info.schema.key}`);
      if (info.schema.title) {
        setPageTitle(info.schema.title);
        const keys = [info.schema?.name];
        let parent = info.schema?.parent;
        while (parent) {
          if (parent['x-component'] === 'Menu') {
            break;
          }
          keys.unshift(parent.name);
          parent = parent.parent;
        }
        setSelectedKeys(keys);
        // setSelectedKeys([info.schema.name]);
      }
    }
  };
  useEffect(() => {
    setActiveKey(match.params.name);
  }, [match.params.name]);
  const onMenuItemRemove = () => {
    history.push(`/admin/${uid()}`);
  };
  console.log({ activeKey, selectedKeys });
  return (
    <Layout>
      <Layout.Header className={'site-header'} style={{ display: 'flex' }}>
        <SiteTitle />
        <MenuSelectedKeysContext.Provider value={selectedKeys}>
          <SchemaRenderer
            schema={schema}
            scope={{
              sideMenuRef,
              onSelect,
              onMenuItemRemove,
              getSelectedKeys: () => {
                console.log('getSelectedKeys', schema);
                return selectedKeys.filter(Boolean);
              },
              selectedKeys: selectedKeys.filter(Boolean),
            }}
          />
        </MenuSelectedKeysContext.Provider>
        <DesignableToggle />
        <Collections />
        <Permissions />
        <More />
        <UserInfo />
      </Layout.Header>
      <Layout>
        <Layout.Sider
          ref={sideMenuRef}
          theme={'light'}
          width={200}
        ></Layout.Sider>
        <Layout.Content style={{ minHeight: 'calc(100vh - 46px)' }}>
          {activeKey ? (
            <Content activeKey={activeKey} />
          ) : (
            <Helmet>
              <title>{title}</title>
            </Helmet>
          )}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

function Content({ activeKey }) {
  const { designable } = useDesignableSwitchContext();
  const { collections } = useCollectionsContext();
  const { data = {}, loading } = useRequest(
    `ui_schemas:getTree?filter[parentKey]=${activeKey}`,
    {
      refreshDeps: [activeKey, collections, designable],
      formatResult: (result) => result?.data,
    },
  );

  if (loading) {
    return <Spin size={'large'} className={'nb-spin-center'} />;
  }

  return <SchemaRenderer schema={data} />;
}

export function AdminLayout({ route, ...others }: any) {
  const match = useRouteMatch<any>();

  const { data = {}, loading } = useRequest(
    `ui_schemas:getTree/${route.uiSchemaKey}`,
    {
      refreshDeps: [route],
      formatResult: (result) => result?.data,
    },
  );

  const first: any = Object.values(data?.properties || {}).shift();

  const findMenuLinkProperties = (schema: Schema): Schema[] => {
    if (!schema) {
      return [];
    }
    if (schema['x-component'] == 'Menu.Link') {
      return [schema];
    }
    return schema.reduceProperties((items, current) => {
      if (current['x-component'] == 'Menu.Link') {
        return [...items, current];
      }
      return [...items, ...findMenuLinkProperties(current)];
    }, []);
  };

  if (loading) {
    return <Spin size={'large'} className={'nb-spin-center'} />;
  }

  const f = findMenuLinkProperties(new Schema(first || {})).shift();

  if (f?.['key'] && !match.params.name) {
    return <Redirect to={`/admin/${f?.['key']}`} />;
  }

  const findProperties = (schema: Schema): Schema[] => {
    if (!schema) {
      return [];
    }
    return schema.reduceProperties((items, current) => {
      if (current['key'] == match.params.name) {
        return [...items, current];
      }
      return [...items, ...findProperties(current)];
    }, []);
  };
  const current = findProperties(new Schema(data)).shift();
  const defaultSelectedKeys = [current?.name];
  let parent = current?.parent;
  while (parent) {
    if (parent['x-component'] === 'Menu') {
      break;
    }
    defaultSelectedKeys.unshift(parent.name);
    parent = parent.parent;
  }

  return (
    <AuthProvider>
      <SystemSettingsProvider>
        <DesignableSwitchProvider>
          <CollectionsProvider>
            <PageTitleProvider defaultPageTitle={current?.title}>
              <LayoutWithMenu
                defaultSelectedKeys={defaultSelectedKeys}
                current={current}
                schema={data}
              />
            </PageTitleProvider>
          </CollectionsProvider>
        </DesignableSwitchProvider>
      </SystemSettingsProvider>
    </AuthProvider>
  );
}

export default AdminLayout;
