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
import { useTranslation } from 'react-i18next';
import { useAPIClient, useDataBlockResource, useRequest } from '@nocobase/client';
import { Button, Card, Dropdown, Space, Table, App } from 'antd';
import React, { useState } from 'react';

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Checkbox,
  },
});

const bulkSchema = {
  type: 'object',
  properties: {
    variables: {
      type: 'string',
      title: 'Variables',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        autoSize: { minRows: 10, maxRows: 20 },
        placeholder: `FOO=aaa
BAR=bbb
        `,
      },
    },
    secrets: {
      type: 'string',
      title: 'Secrets',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        autoSize: { minRows: 10, maxRows: 20 },
        placeholder: `FOO=aaa
BAR=bbb
        `,
      },
    },
  },
};

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
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const api = useAPIClient();
  const { data, loading, run } = request;

  const resource = api.resource('environmentVariables');

  const handleDelete = (data) => {
    modal.confirm({
      title: t('Delete Variables'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({
          filter: { name: data.name, id: data.id },
        });
        run();
      },
    });
  };

  const handleEdit = (initialValues) => {
    FormDrawer(t('Edit'), () => {
      return (
        <FormLayout layout={'vertical'}>
          <SchemaField schema={schema} />
          <FormDrawer.Footer>
            <FormButtonGroup align="right">
              <Reset>{t('Cancel')}</Reset>
              <Submit
                onSubmit={async (data) => {
                  await api.request({
                    url: `environmentVariables:update?filter=${JSON.stringify({
                      id: initialValues.id,
                      name: initialValues.name,
                    })}`,
                    method: 'post',
                    data: {
                      ...data,
                    },
                  });
                  request.refresh();
                }}
              >
                {t('Submit')}
              </Submit>
            </FormButtonGroup>
          </FormDrawer.Footer>
        </FormLayout>
      );
    })
      .open({
        initialValues: { ...initialValues },
      })
      .then(console.log)
      .catch(console.log);
  };
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
            render: (record) => (
              <Space>
                <a onClick={() => handleEdit(record)}>{t('Edit')}</a>
                <a onClick={() => handleDelete(record)}>{t('Delete')}</a>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}

export function EnvironmentSecrets({ request }) {
  const { data, loading, run } = request;
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const api = useAPIClient();
  const resource = api.resource('environmentSecrets');

  const handleDelete = (data) => {
    modal.confirm({
      title: t('Delete Secret'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({
          filter: { name: data.name, id: data.id },
        });
        run();
      },
    });
  };

  const handleEdit = (initialValues) => {
    FormDrawer(t('Edit'), () => {
      return (
        <FormLayout layout={'vertical'}>
          <SchemaField schema={schema} />
          <FormDrawer.Footer>
            <FormButtonGroup align="right">
              <Reset>{t('Cancel')}</Reset>
              <Submit
                onSubmit={async (data) => {
                  await api.request({
                    url: `environmentSecrets:update?filter=${JSON.stringify({
                      id: initialValues.id,
                      name: initialValues.name,
                    })}`,
                    method: 'post',
                    data: {
                      ...data,
                    },
                  });
                  request.refresh();
                }}
              >
                {t('Submit')}
              </Submit>
            </FormButtonGroup>
          </FormDrawer.Footer>
        </FormLayout>
      );
    })
      .open({
        initialValues: { ...initialValues },
      })
      .then(console.log)
      .catch(console.log);
  };
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
            render: (record) => (
              <Space>
                <a onClick={() => handleEdit(record)}>{t('Edit')}</a>
                <a onClick={() => handleDelete(record)}>{t('Delete')}</a>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
/**
 * @param {string} input - The input string containing key-value pairs, separated by `=` and line breaks.
 * @returns {Array<{name: string, value: string}>} - The converted array of objects.
 */
function parseKeyValuePairs(input) {
  return input
    .trim()
    .split('\n')
    .map((line) => {
      const [name, ...valueParts] = line.split('='); // 按 `=` 分割
      return { name: name.trim(), value: valueParts.join('=').trim() }; // 去除多余空格
    });
}

export function EnvironmentTabs() {
  const api = useAPIClient();
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState('variable');
  const variablesRequest = useRequest<any>({
    url: 'environmentVariables',
  });
  const secretsRequest = useRequest<any>({
    url: 'environmentSecrets',
  });
  const handleBulkImport = async (importData) => {
    const arr = Object.entries(importData).map(([type, dataString]) => ({
      type,
      data: parseKeyValuePairs(dataString),
    }));

    await Promise.all(
      arr.map((v) =>
        api.request({
          url: {
            variables: 'environmentVariables:create',
            secrets: 'environmentSecrets:create',
          }[v.type],
          method: 'post',
          data: v.data,
        }),
      ),
    );
  };
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
                  bulk: 'Bulk import',
                }[info.key],
                () => {
                  return (
                    <FormLayout layout={'vertical'}>
                      <SchemaField schema={info.key === 'bulk' ? bulkSchema : schema} />
                      <FormDrawer.Footer>
                        <FormButtonGroup align="right">
                          <Reset>Cancel</Reset>
                          <Submit
                            onSubmit={async (data) => {
                              if (info.key === 'bulk') {
                                await handleBulkImport(data);
                                variablesRequest.refresh();
                                secretsRequest.refresh();
                                setActiveKey(activeKey || 'variable');
                              } else {
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
                                } else if (info.key === 'secret') {
                                  secretsRequest.refresh();
                                } else {
                                  variablesRequest.refresh();
                                  secretsRequest.refresh();
                                }
                                setActiveKey(info.key);
                              }
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
              {
                type: 'divider',
              },
              {
                key: 'bulk',
                label: 'Bulk import ',
              },
            ],
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('Add new')} <DownOutlined />
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