/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { ISchema } from '@nocobase/client';
import { hooksNameMap } from './hooks';
import { ipBlackListCollName } from '../../../constants';

const form = {
  ipRange: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
};
export const tableSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: ipBlackListCollName,
    dragSort: false,
    action: 'list',
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
          title: '{{t("Add")}}',
          'x-component': 'Action',
          'x-component-props': {
            openMode: 'drawer',
            icon: 'PlusOutlined',
            type: 'primary',
          },
          'x-decorator': 'Space',
          properties: {
            drawer: {
              type: 'void',
              title: '{{t("Add")}}',
              'x-component': 'Action.Drawer',
              'x-component-props': {
                zIndex: 2000,
                width: 800,
              },
              'x-decorator': 'FormV2',
              'x-use-decorator-props': hooksNameMap.useCreateFormProps,
              properties: {
                ...form,
                footer: {
                  type: 'void',
                  'x-component': 'Action.Drawer.Footer',
                  properties: {
                    cancel: {
                      title: '{{t("Cancel")}}',
                      'x-component': 'Action',
                      'x-use-component-props': hooksNameMap.useCloseActionProps,
                    },
                    submit: {
                      title: '{{t("Submit")}}',
                      'x-component': 'Action',
                      'x-use-component-props': hooksNameMap.useSubmitActionProps,
                    },
                  },
                },
              },
            },
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
        rowKey: 'key',
      },
      properties: {
        ipRange: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("IP")}}',
          'x-component-props': {
            width: 100,
          },
          properties: {
            ipRange: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
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
              'x-decorator': 'Space',
              properties: {
                drawer: {
                  type: 'void',
                  title: '{{t("Edit")}}',
                  'x-component': 'Action.Drawer',
                  'x-component-props': {
                    zIndex: 2000,
                    width: 800,
                  },
                  'x-decorator': 'FormV2',
                  'x-use-decorator-props': 'useEditFormProps',
                  properties: {
                    ...form,
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        cancel: {
                          title: '{{t("Cancel")}}',
                          'x-component': 'Action',
                          'x-use-component-props': hooksNameMap.useCloseActionProps,
                        },
                        submit: {
                          title: 'Submit',
                          'x-component': 'Action',
                          'x-use-component-props': hooksNameMap.useSubmitActionProps,
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
              'x-component-props': {
                confirm: {
                  title: "{{t('Delete template')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
              'x-use-component-props': 'useDestroyActionProps',
            },
          },
        },
      },
    },
  },
};
