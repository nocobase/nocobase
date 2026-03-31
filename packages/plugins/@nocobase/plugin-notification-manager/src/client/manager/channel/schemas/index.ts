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
import { COLLECTION_NAME } from '../../../../constant';
import { formProperties, updateFormProperties } from './form';

export const createFormSchema: ISchema = {
  type: 'object',
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      'x-decorator': 'FormV2',
      'x-use-decorator-props': 'useCreateFormProps',
      title: '{{t("Add new")}}',
      properties: {
        ...formProperties,
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            cancel: {
              title: '{{t("Cancel")}}',
              'x-component': 'Action',
              'x-use-component-props': 'useCloseActionProps',
            },
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-use-component-props': 'useCreateActionProps',
            },
          },
        },
      },
    },
  },
};

export const channelsSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: COLLECTION_NAME.channels,
    action: 'list',
    dragSort: false,
    params: {
      sort: ['createdAt'],
      pageSize: 20,
    },
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
          title: "{{t('Refresh')}}",
          'x-action': 'refresh',
          'x-component': 'Action',
          'x-use-component-props': 'useRefreshActionProps',
          'x-component-props': {
            icon: 'ReloadOutlined',
          },
        },
        create: {
          type: 'void',
          title: '{{t("Add new")}}',
          'x-component': 'AddNew',
          'x-component-props': {
            type: 'primary',
          },
        },
        filter: {
          'x-action': 'filter',
          type: 'object',
          'x-component': 'Filter.Action',
          title: "{{t('Filter')}}",
          'x-use-component-props': 'useFilterActionProps',
          'x-component-props': {
            icon: 'FilterOutlined',
          },
          'x-align': 'left',
        },
      },
    },
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: 'name',
      },
      properties: {
        title: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Channel display name")}}',
          'x-component-props': {
            width: 100,
          },
          properties: {
            title: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        name: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Channel name")}}',
          'x-component-props': {
            width: 100,
          },
          properties: {
            name: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        description: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Description")}}',
          'x-component-props': {
            width: 200,
          },
          properties: {
            description: {
              type: 'boolean',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        notificationType: {
          title: '{{t("Notification type")}}',
          type: 'void',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 200,
          },
          properties: {
            notificationType: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        actions: {
          type: 'void',
          title: '{{t("Actions")}}',
          'x-component': 'TableV2.Column',
          properties: {
            edit: {
              type: 'void',
              title: '{{t("Edit")}}',
              'x-component': 'Action.Link',
              'x-component-props': {
                openMode: 'drawer',
              },
              'x-use-component-props': 'useRecordEditActionProps',
              'x-decorator': 'Space',
              properties: {
                drawer: {
                  type: 'void',
                  title: '{{t("Edit")}}',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'FormV2',
                  'x-use-decorator-props': 'useEditFormProps',
                  properties: {
                    ...updateFormProperties,
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        cancel: {
                          title: '{{t("Cancel")}}',
                          'x-component': 'Action',
                          'x-use-component-props': 'useCloseActionProps',
                        },
                        submit: {
                          title: 'Submit',
                          'x-component': 'Action',
                          'x-use-component-props': 'useEditActionProps',
                        },
                      },
                    },
                  },
                },
              },
            },
            delete: {
              type: 'void',
              title: '{{t("Delete")}}',
              'x-decorator': 'Space',
              'x-component': 'Action.Link',
              'x-use-component-props': 'useRecordDeleteActionProps',
              'x-component-props': {
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
          },
        },
      },
    },
  },
};
