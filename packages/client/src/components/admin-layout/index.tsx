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
import { More } from './More';
import { UserInfo } from './UserInfo';
import { SiteTitle } from './SiteTitle';

function DesignableToggle() {
  const { designable, setDesignable } = useDesignableSwitchContext();
  return (
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
  const [activeKey, setActiveKey] = useState(match.params.name);
  const [, setPageTitle] = usePageTitleContext();
  const onSelect = (info) => {
    if (!info.schema) {
      setActiveKey(null);
    } else if (info.schema['x-component'] === 'Menu.SubMenu') {
      // 实际应该取第一个子元素
      setActiveKey(null);
    } else {
      setActiveKey(info.schema.key);
      history.push(`/admin/${info.schema.key}`);
      if (info.schema.title) {
        setPageTitle(info.schema.title);
      }
    }
  };
  useEffect(() => {
    setActiveKey(match.params.name);
  }, [match.params.name]);
  const onMenuItemRemove = () => {
    history.push(`/admin`);
  };
  return (
    <Layout>
      <Layout.Header style={{ display: 'flex' }}>
        <SiteTitle />
        <SchemaRenderer
          schema={schema}
          scope={{
            sideMenuRef,
            onSelect,
            onMenuItemRemove,
            selectedKeys: defaultSelectedKeys.filter(Boolean),
          }}
        />
        <DesignableToggle />
        <Database />
        <Permissions />
        <More/>
        <UserInfo />
      </Layout.Header>
      <Layout>
        <Layout.Sider
          ref={sideMenuRef}
          theme={'light'}
          width={200}
        ></Layout.Sider>
        <Layout.Content style={{ minHeight: 'calc(100vh - 46px)' }}>
          {activeKey && <Content activeKey={activeKey} />}
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
    return <Spin />;
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

  if (loading) {
    return <Spin />;
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

  console.log('current?.title', current, current?.title, defaultSelectedKeys);

  return (
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
  );
}

export default AdminLayout;
