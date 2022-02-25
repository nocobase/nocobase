import { uid } from '@formily/shared';
import { defaultProps } from './properties';
import { IField } from './types';

export const subTable: IField = {
  name: 'subTable',
  type: 'object',
  group: 'relation',
  order: 2,
  title: '{{t("Sub-table")}}',
  isAssociation: true,
  disabled: true,
  default: {
    type: 'hasMany',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Table',
      'x-component-props': {},
      enum: [],
    },
  },
  initialize: (values: any) => {
    if (!values.target) {
      values.target = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
  },
  properties: {
    ...defaultProps,
    subtable: {
      type: 'void',
      'x-component': 'DataSourceProvider',
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            // style: {
            //   marginBottom: 16,
            // },
          },
          properties: {
            delete: {
              type: 'void',
              title: '{{ t("Delete") }}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ ds.useBulkDestroyAction }}',
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            create: {
              type: 'void',
              title: '{{ t("Add new") }}',
              'x-component': 'AddSubFieldAction',
              'x-component-props': {
                type: 'primary',
              },
            },
          },
        },
        children: {
          type: 'array',
          title: '{{t("Fields")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Table.Array',
          'x-component-props': {
            pagination: false,
            expandable: {
              childrenColumnName: '__nochildren__',
            },
            rowKey: 'name',
            rowSelection: {
              type: 'checkbox',
            },
            useSelectedRowKeys: '{{ ds.useSelectedRowKeys }}',
            useDataSource: '{{ ds.useDataSource }}',
            // scroll: { x: '100%' },
          },
          properties: {
            column1: {
              type: 'void',
              title: '{{ t("Field display name") }}',
              'x-component': 'Table.Column',
              properties: {
                'uiSchema.title': {
                  type: 'number',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              title: '{{ t("Field name") }}',
              'x-component': 'Table.Column',
              properties: {
                name: {
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column3: {
              type: 'void',
              title: '{{ t("Field interface") }}',
              'x-component': 'Table.Column',
              properties: {
                interface: {
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column4: {
              type: 'void',
              title: '{{ t("Actions") }}',
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
                      title: '{{ t("Edit") }}',
                      'x-component': 'EditSubFieldAction',
                      'x-component-props': {
                        // useAction: '{{ ds.useUpdateAction }}',
                      },
                    },
                    delete: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        useAction: '{{ ds.useDestroyAction }}',
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
        },
      },
    },
    // children: {
    //   type: 'array',
    //   title: '{{t("Sub-table fields")}}',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'DatabaseField',
    // },
  },
};
