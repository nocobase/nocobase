/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Checkbox, FormButtonGroup, FormDrawer, FormItem, FormLayout, Input, Reset, Submit } from '@formily/antd-v5';
import { createSchemaField } from '@formily/react';
import { useAPIClient, useRequest } from '@nocobase/client';
import { Button, Dropdown, Space, Table, Tabs } from 'antd';
import React, { useState } from 'react';

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Checkbox,
  },
});

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    value: {
      type: 'string',
      title: 'Value',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
};

export function EnvironmentVariables({ environmentKey, request }) {
  const { data, loading } = request;
  console.log('EnvironmentVariables', data);
  return (
    <div>
      <Table
        loading={loading}
        size="middle"
        dataSource={data?.data}
        pagination={false}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
          },
          {
            title: 'Value',
            dataIndex: 'value',
          },
          {
            title: 'Actions',
            width: 200,
            render: () => (
              <Space>
                <a>Edit</a>
                <a>Delete</a>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}

export function EnvironmentSecrets({ environmentKey, request }) {
  const { data, loading } = request;
  console.log('EnvironmentSecrets', data);
  return (
    <div>
      <Table
        size="middle"
        loading={loading}
        dataSource={data?.data}
        pagination={false}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
          },
          {
            title: 'Actions',
            width: 200,
            render: () => (
              <Space>
                <a>Edit</a>
                <a>Delete</a>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}

export function EnvironmentTabs({ environmentKey }) {
  const api = useAPIClient();
  const [activeKey, setActiveKey] = useState('variable');
  const variablesRequest = useRequest<any>({
    url: 'environmentVariables',
    params: {
      filter: {
        environmentKey,
      },
    },
  });
  const secretsRequest = useRequest<any>({
    url: 'environmentSecrets',
    params: {
      filter: {
        environmentKey,
      },
    },
  });
  return (
    <Tabs
      destroyInactiveTabPane
      tabBarExtraContent={
        <Dropdown
          menu={{
            onClick(info) {
              FormDrawer(
                {
                  variable: 'Add Variable',
                  secret: 'Add secret',
                }[info.key],
                () => {
                  return (
                    <FormLayout layout={'vertical'}>
                      <SchemaField schema={schema} />
                      <FormDrawer.Footer>
                        <FormButtonGroup align="right">
                          <Reset>Cancel</Reset>
                          <Submit
                            onSubmit={async (data) => {
                              await api.request({
                                url: {
                                  variable: 'environmentVariables:create',
                                  secret: 'environmentSecrets:create',
                                }[info.key],
                                method: 'post',
                                data: {
                                  ...data,
                                  environmentKey,
                                },
                              });
                              if (info.key === 'variable') {
                                variablesRequest.refresh();
                              } else {
                                secretsRequest.refresh();
                              }
                              setActiveKey(info.key);
                            }}
                          >
                            Submit
                          </Submit>
                        </FormButtonGroup>
                      </FormDrawer.Footer>
                    </FormLayout>
                  );
                },
              )
                .open({})
                .then(console.log)
                .catch(console.log);
            },
            items: [
              {
                key: 'variable',
                label: 'Add variable',
              },
              {
                key: 'secret',
                label: 'Add secret',
              },
            ],
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            Add new <DownOutlined />
          </Button>
        </Dropdown>
      }
      defaultActiveKey="variable"
      activeKey={activeKey}
      items={[
        {
          key: 'variable',
          label: 'Variables',
          children: <EnvironmentVariables environmentKey={environmentKey} request={variablesRequest} />,
        },
        {
          key: 'secret',
          label: 'Secrets',
          children: <EnvironmentSecrets environmentKey={environmentKey} request={secretsRequest} />,
        },
      ]}
    />
  );
}
