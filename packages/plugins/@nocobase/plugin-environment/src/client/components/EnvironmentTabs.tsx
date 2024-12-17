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
import { Button, Card, Dropdown, Space, Table } from 'antd';
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

export function EnvironmentVariables({ request }) {
  const { data, loading } = request;
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

export function EnvironmentSecrets({ request }) {
  const { data, loading } = request;
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

export function EnvironmentTabs() {
  const api = useAPIClient();
  const [activeKey, setActiveKey] = useState('variable');
  const variablesRequest = useRequest<any>({
    url: 'environmentVariables',
  });
  const secretsRequest = useRequest<any>({
    url: 'environmentSecrets',
  });
  return (
    <Card
      tabProps={{
        size: 'middle',
        destroyInactiveTabPane: true,
        defaultActiveKey: 'variable',
        activeKey: activeKey,
        onTabClick: (activeKey) => setActiveKey(activeKey),
      }}
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
                .open({
                  initialValues: {},
                })
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
      tabList={[
        {
          key: 'variable',
          label: 'Variables',
          children: <EnvironmentVariables request={variablesRequest} />,
        },
        {
          key: 'secret',
          label: 'Secrets',
          children: <EnvironmentSecrets request={secretsRequest} />,
        },
      ]}
    ></Card>
  );
}
