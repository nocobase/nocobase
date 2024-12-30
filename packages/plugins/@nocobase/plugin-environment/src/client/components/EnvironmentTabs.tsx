/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Checkbox,
  FormButtonGroup,
  FormDrawer,
  FormItem,
  FormLayout,
  Input,
  Radio,
  Reset,
  Submit,
} from '@formily/antd-v5';
import { registerValidateRules } from '@formily/core';
import { createSchemaField } from '@formily/react';
import { SchemaComponentOptions, useAPIClient } from '@nocobase/client';
import { App, Button, Card, Dropdown, Flex, Space, Table, Tag } from 'antd';
import React, { useContext, useState } from 'react';
import { EnvAndSecretsContext } from '../EnvironmentVariablesAndSecretsProvider';
import { useT } from '../locale';

registerValidateRules({
  env_name_rule(value) {
    if (!value) return '';
    return /^[A-Z][A-Z0-9_]*$/.test(value)
      ? ''
      : 'Only uppercase letters, numbers, and underscores are allowed, and it must start with a letter.';
  },
});

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Checkbox,
    Radio,
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
    secret: {
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
      'x-validator': {
        env_name_rule: true,
      },
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-disabled': '{{ !createOnly }}',
    },
    type: {
      type: 'string',
      title: `{{ t("Type") }}`,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      default: 'default',
      enum: [
        {
          value: 'default',
          label: 'Default',
        },
        {
          value: 'secret',
          label: 'Secret',
        },
      ],
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
  const { data, loading, refresh } = request || {};

  const resource = api.resource('environmentVariables');

  const handleDelete = (data) => {
    modal.confirm({
      title: t('Delete Variable'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({
          filter: { name: data.name, id: data.id },
        });
        refresh();
      },
    });
  };

  const handleEdit = async (initialValues) => {
    const drawer = FormDrawer({ title: t('Edit') }, () => {
      return (
        <FormLayout layout={'vertical'}>
          <SchemaComponentOptions scope={{ createOnly: false, t }}>
            <SchemaField schema={schema} />
          </SchemaComponentOptions>
          <FormDrawer.Footer>
            <FormButtonGroup align="right">
              <Reset
                onClick={() => {
                  drawer.close();
                }}
              >
                {t('Cancel')}
              </Reset>
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
    });
    drawer.open({
      initialValues: { ...initialValues },
    });
  };
  return (
    <div>
      <Table
        loading={loading}
        size="middle"
        rowKey={'name'}
        dataSource={data?.data}
        pagination={false}
        columns={[
          {
            title: t('Name'),
            dataIndex: 'name',
            ellipsis: true,
          },
          {
            title: t('Type'),
            dataIndex: 'type',
            render: (value) => <Tag>{value}</Tag>,
          },
          {
            title: t('Value'),
            ellipsis: true,
            render: (record) => <div>{record.type === 'default' ? record.value : '******'}</div>,
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
function parseKeyValuePairs(input, type) {
  return input
    .trim()
    .split('\n')
    .map((line) => {
      const [name, ...valueParts] = line.split('='); // 按 `=` 分割
      return (
        name && {
          name: name.trim(),
          value: valueParts.join('=').trim(),
          type: type === 'secret' ? 'secret' : 'default',
        }
      ); // 去除多余空格
    });
}

export function EnvironmentTabs() {
  const api = useAPIClient();
  const t = useT();
  const { variablesRequest } = useContext(EnvAndSecretsContext);

  const handleBulkImport = async (importData) => {
    const arr = Object.entries(importData).map(([type, dataString]) => {
      return parseKeyValuePairs(dataString, type).filter(Boolean);
    });
    await api.request({
      url: 'environmentVariables:create',
      method: 'post',
      data: arr.flat(),
    });
  };
  return (
    <div>
      <Card>
        <Flex justify="end" style={{ marginBottom: 16 }}>
          <Dropdown
            menu={{
              onClick(info) {
                FormDrawer(
                  {
                    variable: t('Add variable'),
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
                                } else {
                                  await api.request({
                                    url: 'environmentVariables:create',
                                    method: 'post',
                                    data: {
                                      ...data,
                                    },
                                  });
                                  variablesRequest.refresh();
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
        </Flex>
        <EnvironmentVariables request={variablesRequest} />
      </Card>
    </div>
  );
}
