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
import { NAMESPACE } from '../locale';
export const statusEnum = [
  { value: 'loading', label: `{{t("Loading",{ns:"${NAMESPACE}"})}}`, color: 'orange' },
  { value: 'loading-failed', label: `{{t("Failed",{ns:"${NAMESPACE}"})}}`, color: 'red' },
  { value: 'loaded', label: `{{t("Loaded",{ns:"${NAMESPACE}"})}}`, color: 'green' },
  { value: 'reloading', label: `{{t("Reloading",{ns:"${NAMESPACE}"})}}`, color: 'orange' },
];
const collection = {
  name: 'collections-' + uid(),
  fields: [
    {
      type: 'string',
      name: 'key',
      interface: 'input',
      uiSchema: {
        title: `{{t("Data source name",{ ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'displayName',
      interface: 'input',
      uiSchema: {
        title: `{{t("Data source display name",{ ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'type',
      interface: 'select',
      uiSchema: {
        title: `{{t("Type", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        enum: '{{types}}',
      } as ISchema,
    },
    {
      type: 'string',
      name: 'status',
      interface: 'select',
      uiSchema: {
        title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        enum: statusEnum,
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'enabled',
      uiSchema: {
        type: 'boolean',
        title: '{{t("Enabled")}}',
        'x-component': 'Checkbox',
      },
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
        resourceName: 'dataSources',
        request: {
          resource: 'dataSources',
          action: 'list',
          params: {
            pageSize: 50,
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
            refresh: {
              type: 'void',
              title: '{{ t("Refresh") }}',
              'x-component': 'Action',
              'x-use-component-props': 'useRefreshActionProps',
              'x-component-props': {
                icon: 'ReloadOutlined',
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
                actionCallback: '{{ dataSourceDeleteCallback }}',
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
            rowKey: 'key',
            rowSelection: {
              type: 'checkbox',
            },
            useDataSource: '{{ cm.useDataSourceFromRAC }}',
            onSuccess: '{{ dataSourceListCallback }}',
          },
          properties: {
            key: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                key: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
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
            type: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                type: {
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
            enabled: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                enabled: {
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
                    // split: '|',
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
                      'x-reactions': ['{{useIsAbleDelete($self)}}'],
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
                      'x-reactions': ['{{useIsAbleDelete($self)}}'],
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
