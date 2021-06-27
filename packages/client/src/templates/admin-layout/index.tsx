import React, { useContext, useEffect, useState } from 'react';
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
import { SchemaBlock } from '../../blocks';
import { useRequest } from 'ahooks';
import cloneDeep from 'lodash/cloneDeep';
import { Schema } from '@formily/react';
import { DesignableProvider } from '../../blocks/SchemaField';
import { uid } from '@formily/shared';
import {
  DatabaseOutlined,
  PlusOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Tabs } from 'antd';
import '@formily/antd/esm/array-collapse/style';
import './style.less';

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

function useMenuSchema({ schema, selectedKey }) {
  const [activeTopKey, setActiveTopKey] = useState(selectedKey);
  let topMenuSchema = new Schema(cloneDeep(schema.toJSON()));
  topMenuSchema =
    topMenuSchema.properties[Object.keys(topMenuSchema.properties)[0]];
  const [activeKey, setActiveKey] = useState(selectedKey);
  console.log({ activeKey, topMenuSchema });
  topMenuSchema['x-component-props']['hideSubMenu'] = true;
  topMenuSchema['x-component-props']['mode'] = 'horizontal';
  topMenuSchema['x-component-props']['theme'] = 'dark';

  function findLastSelected(activeKey) {
    function find(schema: Schema) {
      return schema.reduceProperties((selected, current) => {
        if (current.name === activeKey) {
          return [...selected, current];
        }
        if (current.properties) {
          return [...selected, ...find(current)];
        }
        return [...selected];
      }, []);
    }

    // const topMenuSchema = new Schema(cloneDeep(schema.toJSON()));

    let selected = find(schema).shift() as Schema;

    console.log({ topMenuSchema, selected, schema });

    if (selected.properties) {
      const findChild = (properties) => {
        const keys = Object.keys(properties || {});
        const firstKey = keys.shift();
        if (firstKey) {
          selected = properties[firstKey];
          findChild(properties[firstKey].properties);
        }
      };
      findChild(selected.properties);
    }

    return selected;
  }

  function find(schema: Schema) {
    return schema.reduceProperties((selected, current) => {
      if (current.name === activeKey) {
        return [...selected, current];
      }
      if (current.properties) {
        return [...selected, ...find(current)];
      }
      return [...selected];
    }, []);
  }

  let selected = (find(topMenuSchema).shift() as Schema) || new Schema({});

  const [pageTitle, setPageTitle] = useState(selected.title);
  console.log({ selected, pageTitle }, selected.title);

  useEffect(() => {
    setPageTitle(selected.title);
  }, [selected]);

  useEffect(() => {
    setActiveKey(selectedKey);
  }, [selectedKey]);

  let s = selected;

  let properties = null;

  const selectedKeys = [s.name];

  let sideMenuKey = null;

  function getAddress(schema: Schema) {
    const segments = [];

    segments.unshift(schema.name);

    while (schema.parent) {
      segments.unshift(schema.parent.name);
      schema = schema.parent;
    }

    return segments.join('.');
  }

  while (s.parent) {
    if (s.parent['x-component'] === 'Menu') {
      sideMenuKey = getAddress(s);
      if (s['x-component'] === 'Menu.SubMenu') {
        properties = s.properties;
      }
      break;
    }
    selectedKeys.push(s.parent.name);
    s = s.parent;
  }

  console.log({ selectedKeys });

  if (properties && selectedKeys.length === 1) {
    const findChild = (properties) => {
      const keys = Object.keys(properties || {});
      const firstKey = keys.shift();
      if (firstKey) {
        selectedKeys.push(firstKey);
        findChild(properties[firstKey].properties);
      }
    };
    findChild(properties);
    selectedKey = selectedKeys[selectedKeys.length - 1];
  }

  topMenuSchema['x-component-props']['onSelect'] = (info) => {
    console.log('onSelect', info.item.props.schema);
    // setActiveSchema(info.item.props.schema || {});
    // setPageTitle(info.item.props.schema.title);
    setActiveTopKey(info.key);
    // setActiveKey(info.key);
    const selected = findLastSelected(info.key);
    console.log('selected', selected.name);
    setActiveKey(selected.name);
    setPageTitle(selected.title);
  };

  let sideMenuSchema = null;
  if (properties) {
    properties['add_new'] = new Schema({
      type: 'void',
      name: `m_${uid()}`,
      'x-component': 'Menu.AddNew',
    });
    sideMenuSchema = new Schema({
      type: 'void',
      name: sideMenuKey,
      'x-component': 'Menu',
      'x-component-props': {
        mode: 'inline',
        // selectedKeys,
        defaultSelectedKeys: selectedKeys,
        defaultOpenKeys: selectedKeys,
        onSelect(info) {
          console.log('onSelect', info.item.props.schema);
          setPageTitle(info.item.props.schema.title);
          setActiveKey(info.key);
        },
      },
      properties,
    }).toJSON();
  }

  // const sideMenuSchema = properties
  //   ? new Schema({
  //       type: 'void',
  //       name: sideMenuKey,
  //       'x-component': 'Menu',
  //       'x-component-props': {
  //         mode: 'inline',
  //         // selectedKeys,
  //         defaultSelectedKeys: selectedKeys,
  //         defaultOpenKeys: selectedKeys,
  //         onSelect(info) {
  //           console.log('onSelect', info.item.props.schema);
  //           setPageTitle(info.item.props.schema.title);
  //           setActiveKey(info.key);
  //         },
  //       },
  //       properties,
  //     }).toJSON()
  //   : null;

  topMenuSchema['x-component-props']['defaultSelectedKeys'] = selectedKeys;
  topMenuSchema['x-component-props']['defaultOpenKeys'] = selectedKeys;

  return {
    pageTitle,
    topMenuSchema,
    sideMenuSchema,
    selectedKeys,
    activeKey,
  };
}

function LayoutWithMenu({ schema, activeMenuItemKey }) {
  const { activeKey, pageTitle, topMenuSchema, sideMenuSchema } = useMenuSchema(
    { schema, selectedKey: activeMenuItemKey },
  );
  const history = useHistory();

  return (
    <Layout>
      <Layout.Header
        style={{
          height: '45px',
          lineHeight: '45px',
          padding: 0,
          display: 'flex',
        }}
      >
        <div
          style={{
            width: 200,
            fontSize: 24,
            fontWeight: 200,
            letterSpacing: 3,
            textAlign: 'center',
            color: '#fff',
          }}
        >
          NocoBase
        </div>
        <SchemaBlock designable={false} schema={topMenuSchema} />

        <Database />
      </Layout.Header>
      <Layout>
        {sideMenuSchema && (
          <Layout.Sider theme={'light'} width={200}>
            <SchemaBlock designable={false} schema={sideMenuSchema} />
          </Layout.Sider>
        )}
        <Layout.Content>
          {pageTitle && <PageHeader title={pageTitle} ghost={false} />}
          <div style={{ margin: 24 }}>
            {/* {history.location.pathname} */}
            <Content activeKey={activeKey} />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
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

  return <SchemaBlock schema={data} />;
}

export function AdminLayout({ route, children }: any) {
  const match = useRouteMatch<any>();

  console.log('match.params', match.params);

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
    <DesignableProvider
      schema={
        new Schema(
          data.name
            ? {
                type: 'object',
                properties: {
                  [data.name]: data,
                },
              }
            : data,
        )
      }
    >
      {(s) => {
        // console.log('DesignableProvider', s.properties.item2.title);
        return (
          <LayoutWithMenu activeMenuItemKey={match.params.name} schema={s} />
        );
      }}
    </DesignableProvider>
  );
  // return <LayoutWithMenu activeMenuItemKey={match.params.name} schema={data} />;
}

export default AdminLayout;
