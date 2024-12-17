/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InboxOutlined, Loading3QuartersOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Plugin, SchemaComponent, useCollectionManager, useCompile } from '@nocobase/client';
import { Button, Card, Divider, Drawer, Flex, Modal, Select, Space, Table, Tag, Upload } from 'antd';
import React, { useState } from 'react';

const schema2 = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormV2',
      properties: {
        username: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Title',
          required: true,
        },
        env: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            {
              value: 'Development',
              label: 'Development',
            },
            {
              value: 'Production',
              label: 'Production',
            },
          ],
          title: 'Environment',
          required: true,
        },
        rule: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            {
              value: 'Development',
              label: 'Development',
            },
            {
              value: 'Production',
              label: 'Production',
            },
          ],
          title: 'Migration rule',
          required: true,
        },
      },
    },
  },
};

function MigrationTable() {
  const cm = useCollectionManager();
  const compile = useCompile();
  return (
    <Table
      size="small"
      bordered={true}
      dataSource={cm.getCollections()}
      columns={[
        {
          title: 'Collection',
          dataIndex: 'title',
          render: (v) => compile(v),
        },
        {
          title: 'Rule',
          render: () => <Select bordered={false} size="small" defaultValue={'Override'} />,
        },
      ]}
    />
  );
}

function MigrationList() {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  return (
    <Card>
      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<Loading3QuartersOutlined />}>Refresh</Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => {
              setOpen2(true);
            }}
          >
            Upload and run migration
          </Button>
          <Button
            onClick={() => {
              setOpen(true);
            }}
            type="primary"
            icon={<PlusOutlined />}
          >
            New migration
          </Button>
        </Space>
      </Flex>
      <Modal
        title="Upload and run migration"
        open={open2}
        onCancel={() => setOpen2(false)}
        footer={
          <Flex justify="flex-end">
            <Space>
              <Button
                onClick={() => {
                  setOpen2(false);
                }}
              >
                Cancel
              </Button>
              <Button type="primary">Import</Button>
            </Space>
          </Flex>
        }
      >
        <Upload.Dragger>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
          </p>
        </Upload.Dragger>
      </Modal>
      <Modal
        title="New migration"
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <Flex justify="flex-end">
            <Space>
              <Button
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="primary">Submit</Button>
            </Space>
          </Flex>
        }
      >
        <SchemaComponent schema={schema2} />
      </Modal>
      <Table
        dataSource={[
          {
            name: 'migration_20241212_091600_4143.nbdata',
            fileSize: '26.2 MiB',
            createdAt: '2024-12-12 09:16:03',
            rule: '导出数据表配置',
          },
          {
            name: 'migration_20241212_091600_4143.nbdata',
            fileSize: '26.2 MiB',
            createdAt: '2024-12-12 09:16:03',
            rule: '导出工作流配置',
          },
        ]}
        columns={[
          {
            title: 'File name',
            dataIndex: 'name',
            width: '25%',
          },
          {
            title: 'Migration rule',
            dataIndex: 'rule',
            width: '20%',
            render: (rule) => <Tag>{rule}</Tag>,
          },
          {
            title: 'File size',
            dataIndex: 'fileSize',
            width: '15%',
          },
          {
            title: 'Created at',
            dataIndex: 'createdAt',
            width: '15%',
          },
          {
            title: 'Actions',
            width: '20%',
            render: () => (
              <Space split={<Divider style={{ margin: 0 }} type="vertical" />}>
                <a>Download</a>
                <a>Delete</a>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
const schema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormV2',
      properties: {
        username: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Name',
          required: true,
        },
        env: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            {
              value: 'Development',
              label: 'Development',
            },
            {
              value: 'Production',
              label: 'Production',
            },
          ],
          title: 'Environment',
          required: true,
        },
        nickname: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          title: 'Description',
        },
        password: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': MigrationTable,
          title: 'Rules',
        },
      },
    },
  },
};
function MigrationRules() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add rule
          </Button>
        </Space>
      </Flex>
      <Drawer
        title="Add rule"
        open={open}
        width={'50%'}
        onClose={() => setOpen(false)}
        footer={
          <Flex justify="flex-end">
            <Space>
              <Button
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="primary">Submit</Button>
            </Space>
          </Flex>
        }
      >
        <SchemaComponent schema={schema} />
      </Drawer>
      <Table
        dataSource={[
          {
            name: '导出数据表配置',
          },
          {
            name: '导出工作流配置',
          },
        ]}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            width: '30%',
          },
          {
            title: 'Description',
            dataIndex: 'description',
            width: '30%',
          },
          {
            title: 'Actions',
            render: () => (
              <Space split={<Divider style={{ margin: 0 }} type="vertical" />}>
                <a>Edit</a>
                <a>Delete</a>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}

export class PluginReleaseManagerClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.pluginSettingsManager.add(`migration-manager`, {
      title: this.t('Migration manager'),
      icon: 'CloudServerOutlined',
    });
    this.app.pluginSettingsManager.add(`migration-manager.list`, {
      title: this.t('Migration list'),
      icon: 'CloudServerOutlined',
      Component: MigrationList,
      aclSnippet: `pm.migration-manager`,
    });
    this.app.pluginSettingsManager.add(`migration-manager.rules`, {
      title: this.t('Migration rules'),
      icon: 'SettingOutlined',
      Component: MigrationRules,
      aclSnippet: `pm.migration-manager.settings`,
    });
  }
}

export default PluginReleaseManagerClient;
