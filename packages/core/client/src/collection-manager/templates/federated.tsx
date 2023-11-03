import { PlusOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import { Button, Divider, Input, Select, Table } from 'antd';
import React, { useContext } from 'react';
import { SchemaComponent } from '../../schema-component';
import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

const DatabaseServerSelect = () => {
  const options = useContext(SchemaOptionsContext);

  return (
    <Select
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <Button
            onClick={async () => {
              await FormDialog(
                {
                  okText: 'Submit',
                },
                () => {
                  return (
                    <div>
                      <FormLayout layout={'vertical'}>
                        <SchemaComponent
                          components={options.components}
                          schema={{
                            properties: {
                              displayName: {
                                title: 'Display name',
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                required: true,
                              },
                              name: {
                                title: 'Server name',
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                required: true,
                              },
                              host: {
                                title: 'Host',
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                required: true,
                              },
                              port: {
                                title: 'Port',
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                required: true,
                              },
                              database: {
                                title: 'Database',
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                required: true,
                              },
                              username: {
                                title: 'Username',
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                required: true,
                              },
                              password: {
                                title: 'Password',
                                'x-component': 'Input',
                                'x-decorator': 'FormItem',
                                required: true,
                              },
                            },
                          }}
                        />
                      </FormLayout>
                    </div>
                  );
                },
              ).open();
            }}
            style={{ paddingLeft: 4, textAlign: 'left' }}
            block
            type="text"
            icon={<PlusOutlined />}
          >
            Create database server
          </Button>
        </>
      )}
      optionLabelProp="label"
    >
      <Select.Option value={'s1'} label="Database server 1">
        Database server 1{' '}
        <span style={{ float: 'right' }}>
          <a>Edit</a> | <a>Delete</a>
        </span>
      </Select.Option>
      <Select.Option value={'s2'} label="Database server 2">
        Database server 2{' '}
        <span style={{ float: 'right' }}>
          <a>Edit</a> | <a>Delete</a>
        </span>
      </Select.Option>
    </Select>
  );
};

const Fields = () => {
  return (
    <Table
      size="small"
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
        },
        {
          title: 'Type',
          dataIndex: 'type',
          render: () => <Select size="small" />,
        },
        {
          title: 'Interface',
          dataIndex: 'interface',
          render: () => <Select size="small" />,
        },
        {
          title: 'Display name',
          dataIndex: 'title',
          render: () => <Input size="small" />,
        },
      ]}
      dataSource={[
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'select' },
      ]}
      pagination={false}
    />
  );
};

const PreView = () => {
  return (
    <Table
      size="small"
      columns={[
        { title: 'title', dataIndex: 'title' },
        { title: 'status', dataIndex: 'status' },
      ]}
    />
  );
};

export const federated: ICollectionTemplate = {
  name: 'federated',
  title: '{{t("Connect to remote database table")}}',
  order: 10,
  color: 'yellow',
  default: {
    fields: [],
  },
  // divider: true,
  configurableProperties: {
    title: {
      type: 'string',
      title: '{{ t("Collection display name") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Collection name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'uid',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
    server: {
      title: '{{t("Database server")}}',
      name: 'server',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': DatabaseServerSelect,
    },
    remoteTable: {
      title: '{{t("Remote table")}}',
      type: 'hasMany',
      name: 'category',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { value: 't1', label: 'Table 1' },
        { value: 't2', label: 'Table 2' },
      ],
    },
    fields: {
      title: '{{t("Fields")}}',
      name: 'fields',
      'x-decorator': 'FormItem',
      'x-component': Fields,
    },
    preView: {
      title: '{{t("Preview")}}',
      name: 'fields',
      'x-decorator': 'FormItem',
      'x-component': PreView,
    },
    ...getConfigurableProperties('category', 'description'),
  },
};
