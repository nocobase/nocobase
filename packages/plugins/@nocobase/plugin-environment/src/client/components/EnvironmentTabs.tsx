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
import { SchemaComponentOptions, useAPIClient } from '@nocobase/client';
import { Button, Card, Dropdown, Space, Table, App } from 'antd';
import React, { useContext, useState } from 'react';
import { EnvAndSecretsContext } from '../EnvironmentVariablesAndSecretsProvider';
import { useT } from '../locale';

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
      title: `{{ t("Variables") }}`,
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
      title: `{{ t("Secrets") }}`,
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
      title: `{{ t("Name") }}`,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-disabled': '{{ !createOnly }}',
    },
    value: {
      type: 'string',
      title: `{{ t("Value") }}`,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
};

export function EnvironmentVariables({ request }) {
  const { modal } = App.useApp();
  const t = useT();
  const api = useAPIClient();
  const { data, loading, refresh } = request;

  const resource = api.resource('environmentVariables');

  const handleDelete = (data) => {
    modal.confirm({
      title: t('Delete Variables'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({
          filter: { name: data.name, id: data.id },
        });
        refresh();
      },
    });
  };

  const handleEdit = (initialValues) => {
    FormDrawer(t('Edit'), () => {
      return (
        <FormLayout layout={'vertical'}>
          <SchemaComponentOptions scope={{ createOnly: false, t }}>
            <SchemaField schema={schema} />
          </SchemaComponentOptions>
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
            title: t('Name'),
            dataIndex: 'name',
          },
          {
            title: t('Value'),
            dataIndex: 'value',
          },
          {
            title: t('Actions'),
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
  const { data, loading, refresh } = request;
  const { modal } = App.useApp();
  const t = useT();
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
        refresh();
      },
    });
  };

  const handleEdit = (initialValues) => {
    FormDrawer(t('Edit'), () => {
      return (
        <FormLayout layout={'vertical'}>
          <SchemaComponentOptions scope={{ createOnly: false }}>
            <SchemaField schema={schema} />
          </SchemaComponentOptions>
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
                  refresh();
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
            title: t('Name'),
            dataIndex: 'name',
          },
          {
            title: t('Actions'),
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
  const t = useT();
  const [activeKey, setActiveKey] = useState('variable');
  const { variablesRequest, secretsRequest } = useContext(EnvAndSecretsContext);

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
                  variable: t('Add variable'),
                  secret: t('Add secret'),
                  bulk: t('Bulk import'),
                }[info.key],
                () => {
                  return (
                    <FormLayout layout={'vertical'}>
                      <SchemaComponentOptions scope={{ createOnly: true, t }}>
                        <SchemaField schema={info.key === 'bulk' ? bulkSchema : schema} />
                      </SchemaComponentOptions>
                      <FormDrawer.Footer>
                        <FormButtonGroup align="right">
                          <Reset>{t('Cancel')}</Reset>
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
                            {t('Submit')}
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
                label: t('Add variable'),
              },
              {
                key: 'secret',
                label: t('Add secret'),
              },
              {
                type: 'divider',
              },
              {
                key: 'bulk',
                label: t('Bulk import'),
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
          label: t('Variables'),
          children: <EnvironmentVariables request={variablesRequest} />,
        },
        {
          key: 'secret',
          label: t('Secrets'),
          children: <EnvironmentSecrets request={secretsRequest} />,
        },
      ]}
    ></Card>
  );
}
