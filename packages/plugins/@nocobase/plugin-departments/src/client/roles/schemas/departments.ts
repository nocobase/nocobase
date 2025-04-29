/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { uid } from '@formily/shared';

export const getDepartmentsSchema = () => ({
  type: 'void',
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
        [uid()]: {
          type: 'void',
          title: '{{ t("Filter") }}',
          'x-action': 'filter',
          'x-component': 'Filter.Action',
          'x-use-component-props': 'useFilterActionProps',
          'x-component-props': {
            icon: 'FilterOutlined',
          },
          'x-align': 'left',
        },
        actions: {
          type: 'void',
          'x-component': 'Space',
          properties: {
            remove: {
              type: 'void',
              title: '{{t("Remove")}}',
              'x-component': 'Action',
              'x-component-props': {
                icon: 'MinusOutlined',
                confirm: {
                  title: "{{t('Remove')}}",
                  content: "{{t('Are you sure you want to remove these departments?')}}",
                },
                style: {
                  marginRight: 8,
                },
                useAction: '{{ useBulkRemoveDepartments }}',
              },
            },
            create: {
              type: 'void',
              title: '{{t("Add departments")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                icon: 'PlusOutlined',
              },
              properties: {
                drawer: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'FormV2',
                  title: '{{t("Add departments")}}',
                  properties: {
                    table: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'DepartmentTable',
                      'x-component-props': {
                        useDataSource: '{{ useDataSource }}',
                        useDisabled: '{{ useDisabled }}',
                      },
                    },
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
                            useAction: '{{ useAddDepartments }}',
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
    },
    table: {
      type: 'void',
      'x-component': 'Table.Void',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        useDataSource: '{{ cm.useDataSourceFromRAC }}',
      },
      properties: {
        title: {
          type: 'void',
          title: '{{t("Department name")}}',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            title: {
              type: 'string',
              'x-component': 'DepartmentTitle',
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
                remove: {
                  type: 'void',
                  title: '{{ t("Remove") }}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    confirm: {
                      title: "{{t('Remove department')}}",
                      content: "{{t('Are you sure you want to remove it?')}}",
                    },
                    useAction: '{{ useRemoveDepartment }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
