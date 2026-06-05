/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  SchemaComponentOptions,
  useActionContext,
  useAPIClient,
  useFilterFieldOptions,
  useFilterFieldProps,
  useRecord,
  useRequest,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { tval } from '@nocobase/utils/client';
import { Form, InputNumber, message, Modal } from 'antd';
import React from 'react';
import { NAMESPACE } from '../../../locale';
import { i18nText, usePluginUtils } from '../../utils';
import { Migrate } from '../../Migrate';

const collection = {
  name: 'applications',
  targetKey: 'name',
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 'a',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: i18nText('App ID'),
        required: true,
        'x-component': 'Input',
        'x-validator': 'uid',
      },
    },
    {
      type: 'string',
      name: 'displayName',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: i18nText('App display name'),
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'pinned',
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        'x-content': i18nText('Pin to menu'),
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'string',
      name: 'status',
      interface: 'radioGroup',
      defaultValue: 'pending',
      uiSchema: {
        type: 'string',
        title: i18nText('App status'),
        enum: [
          { label: 'Preparing', value: 'preparing' },
          { label: 'Initializing', value: 'initializing' },
          { label: 'Initialized', value: 'initialized' },
          { label: 'Running', value: 'running' },
          { label: 'Commanding', value: 'commanding' },
          { label: 'Stopped', value: 'stopped' },
          { label: 'Error', value: 'error' },
          { label: 'Not found', value: 'not_found' },
        ],
        'x-component': 'Radio.Group',
      },
    },
  ],
};

export const useStop = () => {
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await resource.stop({ filterByTk });
      refresh();
    },
  };
};

export const useStart = () => {
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await resource.start({ filterByTk });
      refresh();
    },
  };
};

export const useDestroy = () => {
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await resource.destroy({ filterByTk });
      refresh();
    },
  };
};

export const useDestroyAll = () => {
  const { state, setState, refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await resource.destroy({
        filterByTk: state?.selectedRowKeys || [],
      });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
};

export const useMigrateData = () => {
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const port = React.useRef<any>();
  const api = useAPIClient();
  const { t } = usePluginUtils();
  const [form] = Form.useForm();
  return {
    async run() {
      form.resetFields();
      await Modal.confirm({
        title: t('Migrate data'),
        content: (
          <Form form={form}>
            <Form.Item
              label={t('Port')}
              tooltip={t(
                'When migrate data, the system automatically assigns an incrementing port number to each application based on this port number. You can also manually modify port number after the migrate.',
              )}
              rules={[{ required: true, message: t('Port is required') }]}
              name="port"
            >
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Form>
        ),
        onOk: async () => {
          const { data } = await api.resource('pm').get({
            filterByTk: 'multi-app',
          });
          if (!data?.data?.enabled) {
            message.error(t('Multi-app is not enabled, please enable it first'));
            return;
          }
          const values = await form.validateFields();
          await api.request({
            url: 'multiApplications:importFromMultiappManager',
            method: 'post',
            data: {
              port: values.port,
            },
          });
          message.success(t('Migrate successfully'));
        },
      });
      // const { data } = await resource.migrateData();
      // await resource.migrateData();
      // refresh();
    },
  };
};
export const formSchema: ISchema = {
  type: 'void',
  'x-component': 'div',
  properties: {
    displayName: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
    },
    name: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-disabled': '{{ !createOnly }}',
    },
    // 'options.standaloneDeployment': {
    //   'x-component': 'Checkbox',
    //   'x-decorator': 'FormItem',
    //   'x-content': i18nText('Standalone deployment'),
    // },
    'options.autoStart': {
      title: tval('Start mode', { ns: '@nocobase/plugin-multi-app-manager' }),
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: false,
      enum: [
        { label: tval('Start on first visit', { ns: '@nocobase/plugin-multi-app-manager' }), value: false },
        { label: tval('Start with main application', { ns: '@nocobase/plugin-multi-app-manager' }), value: true },
      ],
    },
    cname: {
      title: i18nText('Custom domain'),
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    },
    pinned: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
    },
    'options.authManager': {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': 'Fieldset',
      title: `{{t("Authentication options", { ns: "${NAMESPACE}" })}}`,
      properties: {
        'jwt.secret': {
          type: 'string',
          title: `{{t("JWT secret", { ns: "${NAMESPACE}" })}}`,
          description: `{{t("An independent JWT secret ensures data and session isolation from other applications.", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'JwtSecretInput',
        },
      },
    },
  },
};

export const tableActionColumnSchema: ISchema = {
  properties: {
    start: {
      type: 'void',
      title: '{{ t("Start") }}',
      'x-component': 'Action.Link',
      'x-component-props': {
        useAction: useStart,
      },
    },
    stop: {
      type: 'void',
      title: '{{ t("Stop") }}',
      'x-component': 'Action.Link',
      'x-component-props': {
        confirm: {
          title: "{{t('Stop')}}",
          content: "{{t('Are you sure you want to stop it?')}}",
        },
        useAction: useStop,
      },
    },
    view: {
      type: 'void',
      'x-component': 'AppVisitor',
      'x-component-props': {},
    },
    update: {
      type: 'void',
      title: '{{t("Edit")}}',
      'x-component': 'Action.Link',
      'x-component-props': {},
      properties: {
        drawer: {
          type: 'void',
          'x-component': 'Action.Drawer',
          'x-decorator': 'Form',
          'x-decorator-props': {
            useValues: '{{ cm.useValuesFromRecord }}',
          },
          title: '{{t("Edit")}}',
          properties: {
            formSchema,
            footer: {
              type: 'void',
              'x-component': 'Action.Drawer.Footer',
              properties: {
                cancel: {
                  title: '{{t("Cancel")}}',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ cm.useCancelAction }}',
                  },
                },
                submit: {
                  title: '{{t("Submit")}}',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    useAction: '{{ cm.useUpdateAction }}',
                  },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      type: 'void',
      title: '{{ t("Delete") }}',
      'x-component': 'Action.Link',
      'x-component-props': {
        confirm: {
          title: "{{t('Delete')}}",
          content: "{{t('Are you sure you want to delete it?')}}",
        },
        useAction: '{{cm.useDestroyAction}}',
      },
    },
  },
};

export const useFilterActionProps = () => {
  const { collection } = useResourceContext();
  const options = useFilterFieldOptions(collection.fields);
  const service = useResourceActionContext();
  return useFilterFieldProps({
    options: options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
};

export function getSchema() {
  const schema: ISchema = {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-decorator': 'ResourceActionProvider',
        'x-decorator-props': {
          collection,
          resourceName: 'applications',
          request: {
            resource: 'applications',
            action: 'list',
            params: {
              pageSize: 50,
              sort: ['-createdAt'],
              appends: [],
            },
          },
        },
        'x-component': 'CollectionProvider_deprecated',
        'x-component-props': {
          collection,
        },
        properties: {
          actions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 16,
              },
            },
            properties: {
              filter: {
                'x-component': 'Filter.Action',
                'x-use-component-props': useFilterActionProps,
                default: {
                  $and: [{ displayName: { $includes: '' } }, { name: { $includes: '' } }],
                },
                title: "{{t('Filter')}}",
                'x-component-props': {
                  icon: 'FilterOutlined',
                },
                'x-align': 'left',
              },
              // migrateData: {
              //   type: 'void',
              //   title: `{{ t("Migrate data to new multi-app", { ns: "${NAMESPACE}" }) }}`,
              //   'x-component': 'Action',
              //   'x-component-props': {
              //     icon: 'DeliveredProcedureOutlined',
              //     useAction: useMigrateData,
              //   },
              // },
              migrate: {
                type: 'void',
                'x-component': Migrate,
              },
              delete: {
                type: 'void',
                title: '{{ t("Delete") }}',
                'x-component': 'Action',
                'x-component-props': {
                  icon: 'DeleteOutlined',
                  useAction: useDestroyAll,
                  confirm: {
                    title: "{{t('Delete')}}",
                    content: "{{t('Are you sure you want to delete it?')}}",
                  },
                },
              },

              create: {
                type: 'void',
                title: '{{t("Add new")}}',
                'x-decorator': (props) =>
                  React.createElement(SchemaComponentOptions, { ...props, scope: { createOnly: true } }),
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  icon: 'PlusOutlined',
                },
                properties: {
                  drawer: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      useValues(options) {
                        const ctx = useActionContext();
                        return useRequest(
                          () =>
                            Promise.resolve({
                              data: {
                                name: `a_${uid()}`,
                              },
                            }),
                          { ...options, refreshDeps: [ctx.visible] },
                        );
                      },
                    },
                    title: '{{t("Add new")}}',
                    properties: {
                      formSchema,
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          cancel: {
                            title: '{{t("Cancel")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ cm.useCancelAction }}',
                            },
                          },
                          submit: {
                            title: '{{t("Submit")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'primary',
                              useAction: '{{ cm.useCreateAction }}',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          table: {
            type: 'void',
            'x-uid': 'input',
            'x-component': 'Table.Void',
            'x-component-props': {
              rowKey: 'name',
              rowSelection: {
                type: 'checkbox',
              },
              useDataSource: '{{ cm.useDataSourceFromRAC }}',
            },
            properties: {
              displayName: {
                type: 'void',
                'x-decorator': 'Table.Column.Decorator',
                'x-component': 'Table.Column',
                properties: {
                  displayName: {
                    type: 'string',
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              name: {
                type: 'void',
                'x-decorator': 'Table.Column.Decorator',
                'x-component': 'Table.Column',
                properties: {
                  name: {
                    type: 'string',
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              pinned: {
                type: 'void',
                title: i18nText('Pin to menu'),
                'x-decorator': 'Table.Column.Decorator',
                'x-component': 'Table.Column',
                properties: {
                  pinned: {
                    type: 'string',
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              status: {
                type: 'void',
                'x-decorator': 'Table.Column.Decorator',
                'x-component': 'Table.Column',
                properties: {
                  status: {
                    type: 'string',
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              actions: {
                type: 'void',
                title: '{{t("Actions")}}',
                'x-component': 'Table.Column',
                properties: {
                  actions: {
                    type: 'void',
                    'x-component': 'Space',
                    'x-component-props': {
                      split: '|',
                    },
                    ...tableActionColumnSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return schema;
}
