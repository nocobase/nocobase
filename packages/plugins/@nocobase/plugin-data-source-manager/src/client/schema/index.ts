import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { NAMESPACE } from '../locale';

const collection = {
  name: 'collections-' + uid(),
  fields: [
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: `{{t("Connection name",{ ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'description',
      interface: 'input',
      uiSchema: {
        title: `{{t("Description",{ ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'dialect',
      interface: 'select',
      uiSchema: {
        title: `{{t("Database dialaect", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
      } as ISchema,
    },
  ],
};

export const databaseConnectionSchema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection,
        resourceName: 'databaseConnections',
        request: {
          resource: 'databaseConnections',
          action: 'list',
          params: {
            pageSize: 50,
            appends: [],
          },
        },
      },
      'x-component': 'CollectionProvider',
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
            refresh: {
              type: 'void',
              title: '{{ t("Refresh") }}',
              'x-component': 'Action',
              'x-component-props': {
                icon: 'ReloadOutlined',
                useProps: '{{ useRefreshActionProps }}',
              },
            },
            delete: {
              type: 'void',
              title: '{{ t("Delete") }}',
              'x-component': 'Action',
              'x-component-props': {
                icon: 'DeleteOutlined',
                useAction: '{{ cm.useBulkDestroyAction }}',
                confirm: {
                  title: "{{t('Delete')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            create: {
              type: 'void',
              title: '{{t("Add new")}}',
              'x-component': 'CreateDatabaseConnectAction',
              'x-component-props': {
                type: 'primary',
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
            description: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                description: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            dialect: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                dialect: {
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
                  properties: {
                    view: {
                      type: 'void',
                      title: '{{t("View")}}',
                      'x-component': 'ViewDatabaseConnectionAction',
                      'x-component-props': {
                        type: 'primary',
                      },
                    },
                    update: {
                      type: 'void',
                      title: '{{t("Edit")}}',
                      'x-component': 'EditDatabaseConnectionAction',
                      'x-component-props': {
                        type: 'primary',
                      },
                    },
                    delete: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        confirm: {
                          title: '{{t("Delete")}}',
                          content: '{{t("Are you sure you want to delete it?")}}',
                        },
                        useAction: '{{useDestroyAction}}',
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
  },
};

export const connectionFormSchema = {
  name: {
    type: 'string',
    title: `{{t("Connection name",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': 'uid',
    'x-disabled': '{{ createOnly }}',
    description:
      "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
  },
  description: {
    type: 'string',
    title: `{{t("Description",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  host: {
    type: 'string',
    title: `{{t("Host",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  port: {
    type: 'string',
    title: `{{t("Port",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  database: {
    type: 'string',
    title: `{{t("Database",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  username: {
    type: 'string',
    title: `{{t("Username",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  password: {
    type: 'string',
    title: `{{t("Password",{ ns: "${NAMESPACE}" })}}`,
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Password',
  },
  allowEditCollection: {
    type: 'string',
    'x-content': `{{t("Allow adding and modifying collection",{ ns: "${NAMESPACE}" })}}`,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': true,
  },
};
