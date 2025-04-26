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

import { useEffect } from 'react';
import { uid } from '@formily/shared';
import { useAPIClient, useActionContext, useRecord, useRequest } from '@nocobase/client';

export const newSubDepartmentSchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Action.Drawer',
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues(options: any) {
          const ctx = useActionContext();
          const record = useRecord();
          return useRequest(() => Promise.resolve({ data: { parent: { ...record } } }), {
            ...options,
            refreshDeps: [ctx.visible],
          });
        },
      },
      title: '{{t("New sub department")}}',
      properties: {
        title: {
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
        },
        parent: {
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': 'departments.parent',
          'x-component-props': {
            component: 'DepartmentSelect',
          },
        },
        roles: {
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': 'departments.roles',
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
                useAction: '{{ useCreateDepartment }}',
              },
            },
          },
        },
      },
    },
  },
};

export const editDepartmentSchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Action.Drawer',
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues(options: any) {
          const api = useAPIClient();
          const ctx = useActionContext();
          const record = useRecord();
          const result = useRequest(
            () =>
              api
                .resource('departments')
                .get({
                  filterByTk: record['id'],
                  appends: ['parent(recursively=true)', 'roles', 'owners'],
                })
                .then((res: any) => res?.data),
            { ...options, manual: true },
          );
          useEffect(() => {
            if (ctx.visible) {
              result.run();
            }
          }, [ctx.visible]);
          return result;
        },
      },
      title: '{{t("Edit department")}}',
      properties: {
        title: {
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
        },
        parent: {
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': 'departments.parent',
          'x-component-props': {
            component: 'SuperiorDepartmentSelect',
          },
        },
        roles: {
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': 'departments.roles',
        },
        owners: {
          title: '{{t("Owners")}}',
          'x-component': 'DepartmentOwnersField',
          'x-decorator': 'FormItem',
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
                useAction: '{{ useUpdateDepartment }}',
              },
            },
          },
        },
      },
    },
  },
};

export const departmentOwnersSchema = {
  type: 'void',
  properties: {
    drawer: {
      title: '{{t("Select Owners")}}',
      'x-component': 'Action.Drawer',
      properties: {
        resource: {
          type: 'void',
          'x-decorator': 'FormItem',
          'x-component': 'RequestProvider',
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
                  type: 'void',
                  title: '{{ t("Filter") }}',
                  default: {
                    $and: [{ username: { $includes: '' } }, { nickname: { $includes: '' } }],
                  },
                  'x-action': 'filter',
                  'x-component': 'Filter.Action',
                  'x-use-component-props': 'useFilterActionProps',
                  'x-component-props': {
                    icon: 'FilterOutlined',
                  },
                  'x-align': 'left',
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
                  onChange: '{{ handleSelect }}',
                },
                useDataSource: '{{ cm.useDataSourceFromRAC }}',
              },
              properties: {
                username: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  properties: {
                    username: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                    },
                  },
                },
                nickname: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  properties: {
                    nickname: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                    },
                  },
                },
                phone: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  properties: {
                    phone: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                    },
                  },
                },
                email: {
                  type: 'void',
                  'x-decorator': 'Table.Column.Decorator',
                  'x-component': 'Table.Column',
                  properties: {
                    email: {
                      type: 'string',
                      'x-component': 'CollectionField',
                      'x-read-pretty': true,
                    },
                  },
                },
              },
            },
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
            confirm: {
              title: '{{t("Confirm")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                useAction: '{{ useSelectOwners }}',
              },
            },
          },
        },
      },
    },
  },
};
