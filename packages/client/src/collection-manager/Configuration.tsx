import { Button, Divider, Drawer, Space, Table, Typography } from 'antd';
import React, { useState } from 'react';

export const ConfigurationTable = () => {
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
            title: '操作',
            dataIndex: 'actions',
            key: 'actions',
            render: () => (
              <Space split={<Divider type="vertical" />}>
                <ConfigureFields />
                <Typography.Link>Edit</Typography.Link>
                <Typography.Link>Delete</Typography.Link>
              </Space>
            ),
          },
        ]}
        dataSource={[
          {
            name: 'users',
            title: '用户',
          },
        ]}
      />
    </div>
  );
};

export const ConfigureFields = () => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Typography.Link onClick={() => setVisible(true)}>Configure</Typography.Link>
      <Drawer width={800} title={'字段配置'} visible={visible} destroyOnClose onClose={() => setVisible(false)}>
        <CollectionFieldList />
      </Drawer>
    </>
  );
};

export const CollectionFieldList = () => {
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
            title: '字段名称',
            dataIndex: 'title',
            key: 'title',
          },
          {
            title: '字段标识',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: '操作',
            dataIndex: 'actions',
            key: 'actions',
            render: () => (
              <Space split={<Divider type="vertical" />}>
                <CollectionFieldEdit />
                <Typography.Link>Delete</Typography.Link>
              </Space>
            ),
          },
        ]}
        dataSource={[
          {
            name: 'title',
            title: '标题',
          },
        ]}
      />
    </div>
  );
};

export const CollectionFieldEdit = () => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Typography.Link onClick={() => setVisible(true)}>Edit</Typography.Link>
      <Drawer
        width={800}
        title={'字段配置'}
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
        CollectionFieldEdit
      </Drawer>
    </>
  );
};
