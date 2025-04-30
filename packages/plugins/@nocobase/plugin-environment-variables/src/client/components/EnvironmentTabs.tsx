/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DeleteOutlined, DownOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Checkbox, FormButtonGroup, FormItem, FormLayout, Input, Radio, Reset, Submit } from '@formily/antd-v5';
import { registerValidateRules } from '@formily/core';
import { createSchemaField, useField } from '@formily/react';
import {
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
  FormDrawer,
  useGlobalTheme,
  removeNullCondition,
} from '@nocobase/client';
import { useLocation } from 'react-router-dom';
import { Alert, App, Button, Card, Dropdown, Flex, Space, Table, Tag } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VAR_NAME_RE } from '../../re';
import { EnvAndSecretsContext } from '../EnvironmentVariablesAndSecretsProvider';
import { useT } from '../locale';

registerValidateRules({
  env_name_rule(value) {
    if (!value) return '';
    return VAR_NAME_RE.test(value)
      ? ''
      : 'Only letters, numbers and underscores are allowed, and it must start with a letter.';
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
      title: `{{ t("Plain text") }}`,
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
      title: `{{ t("Encrypted") }}`,
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
          label: '{{t("Plain text")}}',
        },
        {
          value: 'secret',
          label: '{{t("Encrypted")}}',
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

export function EnvironmentVariables({ request, setSelectRowKeys }) {
  const { modal } = App.useApp();
  const t = useT();
  const api = useAPIClient();
  const { data, loading, refresh } = request || {};
  const { theme } = useGlobalTheme();

  const typEnum = {
    default: {
      label: t('Plain text'),
      color: 'green',
    },
    secret: {
      label: t('Encrypted'),
      color: 'red',
    },
  };

  const resource = api.resource('environmentVariables');

  const handleDelete = (data) => {
    modal.confirm({
      title: t('Delete variable'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({
          filterByTk: data.name,
        });
        refresh();
      },
    });
  };

  const handleEdit = async (initialValues) => {
    const drawer = FormDrawer(
      { title: t('Edit') },
      'edit',
      () => {
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
                      url: `environmentVariables:update?filterByTk=${initialValues.name}`,
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
      },
      theme,
    );
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
            render: (value) => <Tag color={typEnum[value].color}>{typEnum[value].label}</Tag>,
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
        rowSelection={{
          type: 'checkbox',
          onChange: (rowKeys, selectedRows) => {
            setSelectRowKeys(rowKeys);
          },
        }}
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
  const { modal } = App.useApp();
  const { variablesRequest } = useContext(EnvAndSecretsContext);
  const [selectRowKeys, setSelectRowKeys] = useState([]);
  const resource = api.resource('environmentVariables');
  const { theme } = useGlobalTheme();
  const location = useLocation();
  useEffect(() => {
    const { run, params } = variablesRequest;
    if (params?.length) {
      run();
    }
  }, [location.key]);
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
  const handelBulkDelete = () => {
    if (selectRowKeys.length > 0) {
      modal.confirm({
        title: t('Delete variable'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await resource.destroy({
            filterByTk: selectRowKeys,
          });
          variablesRequest?.refresh?.();
        },
      });
    }
  };
  const handelRefresh = () => {
    variablesRequest?.refresh?.();
  };

  const filterOptions = [
    {
      name: 'name',
      title: t('Name'),
      operators: [
        { label: '{{t("contains")}}', value: '$includes', selected: true },
        { label: '{{t("does not contain")}}', value: '$notIncludes' },
        { label: '{{t("is")}}', value: '$eq' },
        { label: '{{t("is not")}}', value: '$ne' },
      ],
      schema: {
        type: 'string',
        title: t('Name'),
        'x-component': 'Input',
      },
    },
    {
      name: 'type',
      title: t('Type'),
      operators: [
        {
          label: '{{t("is")}}',
          value: '$match',
          selected: true,
          schema: {
            'x-component': 'Select',
            'x-component-props': { mode: 'tags' },
          },
        },
        {
          label: '{{t("is not")}}',
          value: '$notMatch',
          schema: {
            'x-component': 'Select',
            'x-component-props': { mode: 'tags' },
          },
        },
      ],
      schema: {
        type: 'string',
        title: t('Type'),
        'x-component': 'Select',
        enum: [
          {
            value: 'default',
            label: '{{t("Plain text")}}',
          },
          {
            value: 'secret',
            label: '{{t("Encrypted")}}',
          },
        ],
      },
    },
    {
      name: 'value',
      title: t('Value'),
      operators: [
        { label: '{{t("contains")}}', value: '$includes', selected: true },
        { label: '{{t("does not contain")}}', value: '$notIncludes' },
        { label: '{{t("is")}}', value: '$eq' },
        { label: '{{t("is not")}}', value: '$ne' },
      ],
      schema: {
        type: 'string',
        title: t('Value'),
        'x-component': 'Input',
      },
    },
  ];
  const useFilterActionProps = () => {
    const field = useField<any>();
    const { run } = variablesRequest;
    const { t } = useTranslation();

    return {
      options: filterOptions,
      onSubmit: async (values) => {
        run(values);
        field.setValue(values);
        const filter = removeNullCondition(values?.filter);
        const items = filter?.$and || filter?.$or;
        if (items?.length) {
          field.title = t('{{count}} filter items', { count: items?.length || 0 });
        } else {
          field.title = t('Filter');
        }
      },
      onReset: (values) => {
        field.setValue(values);
      },
    };
  };
  return (
    <div>
      {variablesRequest?.data?.meta?.updated && (
        <Alert
          type="warning"
          style={{ marginBottom: '1.2em', alignItems: 'center' }}
          description={
            <div>
              {t('Variables and secrets have been updated. A restart is required for the changes to take effect.')}{' '}
            </div>
          }
          action={
            <Button
              size="middle"
              type="primary"
              onClick={async () => {
                await api.resource('app').refresh();
              }}
            >
              {t('Restart now')}
            </Button>
          }
        />
      )}
      <Card>
        <div style={{ float: 'left' }}>
          <SchemaComponent
            schema={{
              name: 'filter',
              type: 'object',
              title: '{{ t("Filter") }}',
              default: {
                $and: [{ name: { $includes: '' } }],
              },
              'x-component': 'Filter.Action',
              'x-component-props': { icon: 'FilterOutlined' },
              enum: filterOptions,
              'x-use-component-props': useFilterActionProps,
            }}
            scope={{ t }}
          />
        </div>
        <Flex justify="end" style={{ marginBottom: 16 }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handelRefresh}>
              {t('Refresh')}
            </Button>

            <Button icon={<DeleteOutlined />} onClick={handelBulkDelete}>
              {t('Delete')}
            </Button>
            <Dropdown
              menu={{
                onClick(info) {
                  const drawer = FormDrawer(
                    {
                      variable: t('Add variable'),
                      bulk: t('Bulk import'),
                    }[info.key] as any,
                    'add-new',
                    () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaComponentOptions scope={{ createOnly: true, t }}>
                            <SchemaField schema={info.key === 'bulk' ? bulkSchema : schema} />
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
                    theme,
                  );
                  drawer
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
          </Space>
        </Flex>
        <EnvironmentVariables request={variablesRequest} setSelectRowKeys={setSelectRowKeys} />
      </Card>
    </div>
  );
}
