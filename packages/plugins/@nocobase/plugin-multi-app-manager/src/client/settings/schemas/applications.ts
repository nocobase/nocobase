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
import { tval } from '@nocobase/utils/client';
import {
  SchemaComponentOptions,
  useActionContext,
  useRecord,
  useRequest,
  useResourceActionContext,
  useResourceContext,
  useFilterFieldProps,
  useFilterFieldOptions,
} from '@nocobase/client';
import React from 'react';
import { i18nText } from '../../utils';
import { NAMESPACE } from '../../../locale';

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
    'options.database': {
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': 'Fieldset',
      'x-component-props': {
        variant: 'borderless',
      },
      title: `{{t("Database options", { ns: "${NAMESPACE}" })}}`,
      properties: {
        grid: {
          type: 'void',
          'x-component': 'Grid',
          properties: {
            originRow: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                dailectCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 25,
                  },
                  properties: {
                    dialect: {
                      type: 'string',
                      title: `{{t("Dialect", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      enum: [
                        { label: 'PostgreSQL', value: 'postgres' },
                        { label: 'MySQL', value: 'mysql' },
                        { label: 'Mariadb', value: 'mariadb' },
                        { label: 'KingBase', value: 'kingbase' },
                      ],
                      required: true,
                    },
                  },
                },
                hostCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    host: {
                      type: 'string',
                      title: `{{t("Host", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      required: true,
                    },
                  },
                },
                portCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 25,
                  },
                  properties: {
                    port: {
                      type: 'number',
                      title: `{{t("Port", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'InputNumber',
                    },
                  },
                },
              },
            },
            authRow: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                usernameCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    username: {
                      type: 'string',
                      title: `{{t("Username", { ns: "${NAMESPACE}" })}}`,
                      'x-component': 'Input',
                      'x-decorator': 'FormItem',
                      required: true,
                    },
                  },
                },
                portCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    password: {
                      type: 'string',
                      title: `{{t("Password", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.Password',
                      default: '',
                    },
                  },
                },
              },
            },
            databaseRow: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                databaseCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    database: {
                      type: 'string',
                      title: `{{t("Database name", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      required: true,
                    },
                  },
                },
                schemaCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    schema: {
                      type: 'string',
                      title: `{{t("Schema", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-reactions': [
                        {
                          dependencies: ['.dialect'],
                          fulfill: {
                            state: {
                              visible: '{{ $deps[0] === "postgres" }}',
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            tableRow: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                tablePrefixCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    tablePrefix: {
                      type: 'string',
                      title: `{{t("Table prefix", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
                schemaCol: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    underscored: {
                      type: 'boolean',
                      title: `{{t("Naming style", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Radio.Group',
                      enum: [
                        { label: `{{t("Camel case", { ns: "${NAMESPACE}" })}}`, value: false },
                        { label: `{{t("Snake case", { ns: "${NAMESPACE}" })}}`, value: true },
                      ],
                      default: false,
                    },
                  },
                },
              },
            },
          },
        },
      },
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
export const schema: ISchema = {
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
