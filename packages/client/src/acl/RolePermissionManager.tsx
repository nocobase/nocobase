import { Button, Checkbox, Divider, Drawer, Space, Table, Tabs, Tag, Typography } from 'antd';
import React, { useState } from 'react';
import { ScopeRecordPicker } from './ScopeRecordPicker';

export function RoleManager() {}

export const RoleTable = () => {
  return (
    <div>
      <Space style={{ justifyContent: 'flex-end', width: '100%', marginBottom: 16 }}>
        <Button key="destroy">删除</Button>
        <Button type={'primary'} key="create">
          添加
        </Button>
      </Space>
      <Table
        rowSelection={{
          type: 'checkbox',
        }}
        columns={[
          {
            title: '角色名称',
            dataIndex: 'title',
            key: 'title',
          },
          {
            title: '角色描述',
            dataIndex: 'description',
            key: 'description',
          },
          {
            title: '默认角色',
            dataIndex: 'default',
            key: 'default',
            render: (value) => value && '是',
          },
          {
            title: '操作',
            dataIndex: 'actions',
            key: 'actions',
            render: () => (
              <Space split={<Divider type="vertical" />}>
                <ConfigurePermissions />
                <Typography.Link>Edit role</Typography.Link>
                <Typography.Link>Delete</Typography.Link>
              </Space>
            ),
          },
        ]}
        dataSource={[
          {
            name: 'root',
            title: '管理员',
            description: '描述',
          },
          {
            name: 'member',
            title: '普通成员',
            description: '描述',
            default: true,
          },
        ]}
      />
    </div>
  );
};

const ConfigurePermissions = () => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Typography.Link onClick={() => setVisible(true)}>Configure</Typography.Link>
      <Drawer width={800} title={'权限配置'} visible={visible} destroyOnClose onClose={() => setVisible(false)}>
        <RolePermissions />
      </Drawer>
    </>
  );
};

export const RolePermissions = () => {
  return (
    <Tabs defaultActiveKey={'actions'}>
      <Tabs.TabPane key={'global'} tab={'系统全局权限'}></Tabs.TabPane>
      <Tabs.TabPane key={'actions'} tab={'数据操作权限'}>
        <Table
          columns={[
            {
              title: '数据表名称',
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: '数据表标识',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '权限策略',
              dataIndex: 'usingConfigure',
              key: 'usingConfigure',
              render: (value) => (value ? <Tag>单独配置</Tag> : <Tag>通用配置</Tag>),
            },
            {
              title: '操作',
              dataIndex: 'actions',
              key: 'actions',
              render: () => <ResourceActionsConfigure />,
            },
          ]}
          dataSource={[
            {
              title: '用户',
              name: 'users',
            },
          ]}
        />
      </Tabs.TabPane>
      <Tabs.TabPane key={'accessible'} tab={'菜单访问权限'}>
        <Table
          columns={[
            {
              title: '菜单页面',
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: (
                <>
                  <Checkbox /> 允许访问
                </>
              ),
              dataIndex: 'accessible',
              key: 'accessible',
              render: () => <Checkbox />,
            },
          ]}
          dataSource={[
            {
              title: '页面1',
            },
            {
              title: '页面2',
              accessible: true,
            },
          ]}
        />
      </Tabs.TabPane>
    </Tabs>
  );
};

const ResourceActionsConfigure = () => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Typography.Link onClick={() => setVisible(true)}>Configure</Typography.Link>
      <Drawer
        width={800}
        title={'权限配置'}
        visible={visible}
        destroyOnClose
        onClose={() => setVisible(false)}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button
              onClick={() => {
                setVisible(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type={'primary'}
              onClick={() => {
                setVisible(false);
              }}
            >
              Submit
            </Button>
          </Space>
        }
      >
        <ResourceActionsForm />
      </Drawer>
    </>
  );
};

export const ResourceActionsForm = () => {
  return (
    <div>
      <Table
        columns={[
          {
            title: '操作',
            dataIndex: 'title',
            key: 'title',
          },
          {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
          },
          {
            title: (
              <>
                <Checkbox /> 允许操作
              </>
            ),
            dataIndex: 'enable',
            key: 'enable',
            render: () => <Checkbox />,
          },
          {
            title: '可操作的数据范围',
            dataIndex: 'scope',
            key: 'scope',
            render: () => <ScopeRecordPicker />,
          },
        ]}
        dataSource={[
          {
            title: '添加',
          },
          {
            title: '导入',
            enable: true,
          },
        ]}
      />
    </div>
  );
};
