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

export const membersActionSchema = {
  type: 'void',
  'x-component': 'Space',
  properties: {
    remove: {
      type: 'void',
      title: '{{t("Remove")}}',
      'x-component': 'Action',
      'x-component-props': {
        icon: 'UserDeleteOutlined',
        confirm: {
          title: "{{t('Remove members')}}",
          content: "{{t('Are you sure you want to remove these members?')}}",
        },
        style: {
          marginRight: 8,
        },
        useAction: '{{ useBulkRemoveMembersAction }}',
      },
    },
    create: {
      type: 'void',
      title: '{{t("Add members")}}',
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        icon: 'UserAddOutlined',
      },
      properties: {
        drawer: {
          type: 'void',
          'x-component': 'AddMembers',
        },
      },
    },
  },
};

export const rowRemoveActionSchema = {
  type: 'void',
  properties: {
    remove: {
      title: '{{ t("Remove") }}',
      'x-component': 'Action.Link',
      'x-component-props': {
        confirm: {
          title: "{{t('Remove member')}}",
          content: "{{t('Are you sure you want to remove it?')}}",
        },
        useAction: '{{ useRemoveMemberAction }}',
      },
    },
  },
};

export const getMembersSchema = (department: any, user: any) => ({
  type: 'void',
  'x-component': 'CardItem',
  'x-component-props': {
    heightMode: 'fullHeight',
  },
  properties: {
    ...(!user
      ? {
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
                'x-use-component-props': 'useMemberFilterActionProps',
                'x-component-props': {
                  icon: 'FilterOutlined',
                },
                'x-align': 'left',
              },
              refresh: {
                type: 'void',
                title: '{{ t("Refresh") }}',
                'x-action': 'refresh',
                'x-component': 'Action',
                'x-use-component-props': 'useRefreshActionProps',
                'x-component-props': {
                  icon: 'ReloadOutlined',
                },
              },
              actions: {
                type: 'void',
                'x-component': 'MemberActions',
              },
            },
          },
        }
      : {}),
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        pagination: {
          showTotal: '{{ useShowTotal }}',
        },
      },
      properties: {
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
        // Setting - Department members table
        departments: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            departments: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        ...(department
          ? {
              isOwner: {
                type: 'void',
                'x-decorator': 'Table.Column.Decorator',
                'x-component': 'Table.Column',
                'x-component-props': {
                  style: {
                    minWidth: 100,
                  },
                },
                title: '{{t("Owner")}}',
                properties: {
                  isOwner: {
                    type: 'boolean',
                    'x-component': 'IsOwnerField',
                  },
                },
              },
            }
          : {}),
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
        actions: {
          type: 'void',
          title: '{{t("Actions")}}',
          'x-component': 'Table.Column',
          'x-component-props': {
            fixed: 'right',
          },
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
                      'x-decorator': 'FormV2',
                      title: '{{t("Configure")}}',
                      properties: {
                        // Setting - Config - config member departments drawer
                        departments: {
                          title: '{{t("Departments")}}',
                          'x-decorator': 'FormItem',
                          'x-component': 'UserDepartmentsField',
                        },
                        // footer: {
                        //   type: 'void',
                        //   'x-component': 'Action.Drawer.Footer',
                        //   properties: {
                        //     cancel: {
                        //       title: '{{t("Cancel")}}',
                        //       'x-component': 'Action',
                        //       'x-component-props': {
                        //         useAction: '{{ cm.useCancelAction }}',
                        //       },
                        //     },
                        //     submit: {
                        //       title: '{{t("Submit")}}',
                        //       'x-component': 'Action',
                        //       'x-component-props': {
                        //         type: 'primary',
                        //         // useAction: '{{ useSetDepartments }}',
                        //       },
                        //     },
                        //   },
                        // },
                      },
                    },
                  },
                },
                ...(department
                  ? {
                      remove: {
                        type: 'void',
                        'x-component': 'RowRemoveAction',
                      },
                    }
                  : {}),
              },
            },
          },
        },
      },
    },
  },
});

export const addMembersSchema = {
  type: 'object',
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      'x-decorator': 'Form',
      title: '{{t("Add members")}}',
      properties: {
        resource: {
          type: 'void',
          'x-decorator': 'FormItem',
          'x-component': 'AddMembersListProvider',
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
                  'x-use-component-props': 'useAddMembersFilterActionProps',
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
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
              },
              'x-use-component-props': 'useAddMembersActionProps',
            },
          },
        },
      },
    },
  },
};

export const userDepartmentsSchema = {
  type: 'void',
  properties: {
    drawer: {
      title: '{{t("Select Departments")}}',
      'x-decorator': 'Form',
      'x-component': 'Action.Drawer',
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
            confirm: {
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
};
