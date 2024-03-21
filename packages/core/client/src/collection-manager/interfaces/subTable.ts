import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { defaultProps } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class SubTableFieldInterface extends CollectionFieldInterface {
  name = 'subTable';
  type = 'object';
  group = 'relation';
  order = 2;
  title = '{{t("Sub-table")}}';
  isAssociation = true;
  default = {
    type: 'hasMany',
    uiSchema: {
      type: 'void',
      'x-component': 'TableField',
      'x-component-props': {},
    },
  };
  availableTypes = ['hasMany'];
  schemaInitialize(schema: ISchema, { field, readPretty }) {
    const association = `${field.collectionName}.${field.name}`;
    schema['type'] = 'void';
    schema['x-component'] = 'TableField';
    schema['properties'] = {
      block: {
        type: 'void',
        'x-decorator': 'TableFieldProvider',
        'x-acl-action': `${field.target}:list`,
        'x-decorator-props': {
          collection: field.target,
          association: association,
          resource: association,
          action: 'list',
          params: {
            paginate: false,
          },
          showIndex: true,
          dragSort: false,
        },
        properties: {
          actions: {
            type: 'void',
            'x-initializer': 'subTable:configureActions',
            'x-component': 'TableField.ActionBar',
            'x-component-props': {},
          },
          [field.name]: {
            type: 'array',
            'x-initializer': 'table:configureColumns',
            'x-component': 'TableV2',
            'x-component-props': {
              rowSelection: {
                type: 'checkbox',
              },
              useProps: '{{ useTableFieldProps }}',
            },
          },
        },
      },
    };
  }
  initialize = (values: any) => {
    if (!values.target) {
      values.target = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
  };
  properties = {
    ...defaultProps,
    subtable: {
      type: 'void',
      'x-component': 'SubFieldDataSourceProvider',
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
  };
}
