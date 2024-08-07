/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { formProperties } from './create-form';
export const tableSchema = {
  type: 'void',
  'x-uid': 'input',
  'x-component': 'Table.Void',
  'x-component-props': {
    rowKey: 'id',
    rowSelection: {
      type: 'checkbox',
    },
    useDataSource: '{{ cm.useDataSourceFromRAC }}',
  },
  properties: {
    id: {
      type: 'void',
      'x-decorator': 'Table.Column.Decorator',
      'x-component': 'Table.Column',
      properties: {
        id: {
          type: 'number',
          'x-component': 'CollectionField',
          'x-read-pretty': true,
        },
      },
    },
    title: {
      type: 'void',
      'x-decorator': 'Table.Column.Decorator',
      'x-component': 'Table.Column',
      properties: {
        title: {
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
          type: 'boolean',
          'x-component': 'CollectionField',
          'x-read-pretty': true,
        },
      },
    },
    notificationType: {
      title: '{{t("Notification Type")}}',
      type: 'void',
      'x-decorator': 'Table.Column.Decorator',
      'x-component': 'Table.Column',
      properties: {
        notificationType: {
          type: 'string',
          'x-component': 'Select',
          'x-read-pretty': true,
          enum: '{{ notificationTypeOptions }}',
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
            update: {
              type: 'void',
              title: '{{t("Configure")}}',
              'x-component': 'Action.Link',
              'x-component-props': {
                type: 'primary',
              },
              properties: {
                drawer: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    useValues: '{{ cm.useValuesFromRecord }}',
                  },
                  title: '{{t("Configure")}}',
                  properties: {
                    ...formProperties,
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
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
                useAction: '{{cm.useDestroyAction}}',
              },
              'x-disabled': '{{ useCanNotDelete() }}',
            },
          },
        },
      },
    },
  },
};
