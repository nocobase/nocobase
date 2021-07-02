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
import {
  useGlobalAction,
  refreshGlobalAction,
  RouteComponentContext,
} from '../../';
import { SchemaBlock, SchemaRenderer } from '../../blocks';
import { useRequest } from 'ahooks';
import cloneDeep from 'lodash/cloneDeep';
import { Schema } from '@formily/react';
import { DesignableContext } from '../../blocks/SchemaField';
import { uid } from '@formily/shared';
import {
  DatabaseOutlined,
  PlusOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Tabs } from 'antd';
import '@formily/antd/esm/array-collapse/style';
import './style.less';
import { MenuContainerContext } from '../../blocks/menu';

function LogoutButton() {
  const history = useHistory();
  return (
    <Button
      onClick={async () => {
        history.push('/login');
        await refreshGlobalAction('routes:getAccessible');
      }}
    >
      注销
    </Button>
  );
}

function Database() {
  const [visible, setVisible] = useState(false);

  const schema = {
    type: 'object',
    properties: {
      layout: {
        type: 'void',
        'x-component': 'FormLayout',
        'x-component-props': {
          layout: 'vertical',
        },
        properties: {
          input: {
            type: 'string',
            title: '数据表名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          array: {
            type: 'array',
            title: '数据表字段',
            'x-component': 'ArrayCollapse',
            'x-component-props': {
              accordion: true,
            },
            // maxItems: 3,
            'x-decorator': 'FormItem',
            items: {
              type: 'object',
              'x-component': 'ArrayCollapse.CollapsePanel',
              'x-component-props': {
                header: '字段',
              },
              properties: {
                index: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Index',
                },
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  title: 'Input',
                  required: true,
                  'x-component': 'Input',
                },
                remove: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Remove',
                },
                moveUp: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveUp',
                },
                moveDown: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveDown',
                },
              },
            },
            properties: {
              addition: {
                type: 'void',
                title: '添加字段',
                'x-component': 'ArrayCollapse.Addition',
              },
            },
          },
        },
      },
    },
  };

  return (
    <>
      <Modal
        title={
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key={'1'}>数据表1</Menu.Item>
                <Menu.Item key={'2'}>数据表2</Menu.Item>
                <Menu.Item key={'3'}>数据表3</Menu.Item>
                <Menu.Item key={'4'}>数据表4</Menu.Item>
                <Menu.Divider></Menu.Divider>
                <Menu.Item key={'5'}>新增数据表</Menu.Item>
              </Menu>
            }
          >
            <span>
              数据表1 <DownOutlined />
            </span>
          </Dropdown>
        }
        // width={'800px'}
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={() => setVisible(false)}
        // bodyStyle={{ padding: 0 }}
        // footer={null}
      >
        <SchemaBlock schema={schema} />
      </Modal>
      <DatabaseOutlined
        onClick={() => setVisible(true)}
        style={{ color: '#fff', lineHeight: '48px', width: 48 }}
      />
    </>
  );
}

function LayoutWithMenu({ schema }) {
  const location = useLocation();
  const ref = useRef();
  const [activeKey, setActiveKey] = useState('item3');
  schema['x-component-props']['defaultSelectedKeys'] = [activeKey];
  schema['x-component-props']['onSelect'] = (info) => {
    console.log('LayoutWithMenu', schema)
    setActiveKey(info.key);
  }
  return (
    <Layout>
        <Layout.Header>
          <MenuContainerContext.Provider value={{
            sideMenuRef: ref,
          }}>
            <SchemaRenderer schema={schema} />
          </MenuContainerContext.Provider>
        </Layout.Header>
        <Layout>
          <Layout.Sider ref={ref} theme={'light'} width={200}>
          </Layout.Sider>
          <Layout.Content>
            {location.pathname}
            <Content activeKey={activeKey}/>
          </Layout.Content>
        </Layout>
      </Layout>
  )
}

function Content({ activeKey }) {
  const { data = {}, loading } = useRequest(
    `/api/blocks:getSchema/${activeKey}`,
    {
      refreshDeps: [activeKey],
      formatResult: (result) => result?.data,
    },
  );

  if (loading) {
    return <Spin />;
  }

  return <SchemaRenderer schema={data} />;
}

export function AdminLayout({ route, children }: any) {
  const match = useRouteMatch<any>();

  const { data = {}, loading } = useRequest(
    `/api/blocks:getSchema/${route.blockId}`,
    {
      refreshDeps: [route],
      formatResult: (result) => result?.data,
    },
  );
  if (loading) {
    return <Spin />;
  }

  return (
    <LayoutWithMenu schema={data}/>
  );
}

export default AdminLayout;
