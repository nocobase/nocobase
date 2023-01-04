import { ISchema, Schema } from '@formily/react';
import { message } from 'antd';
import { uid } from '@formily/shared';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../../api-client';
import { useAPIClient } from '../../../api-client';
import { i18n } from '../../../i18n';
import { CollectionOptions } from '../../types';
import { CollectionTemplate } from '../components/CollectionTemplate';
import { collectionFieldSchema } from './collectionFields';

const compile = (source) => {
  return Schema.compile(source, { t: i18n.t });
};

export const collection: CollectionOptions = {
  name: 'collections',
  filterTargetKey: 'name',
  targetKey: 'name',
  sortable: true,
  fields: [
    {
      type: 'integer',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Collection display name") }}',
        type: 'number',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Collection name") }}',
        type: 'string',
        'x-component': 'Input',
        description:
          '{{t("Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.")}}',
      },
    },
    {
      type: 'string',
      name: 'template',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Collection Template") }}',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      collectionName: 'collections',
      sourceKey: 'name',
      targetKey: 'name',
      uiSchema: {},
    },
    {
      type: 'hasMany',
      name: 'inherits',
      interface: 'select',
      uiSchema: {
        title: '{{ t("Inherits") }}',
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          mode: 'multiple',
        },
      },
    },
  ],
};

export const collectionSchema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      properties: {
        tabs: {
          type: 'void',
          'x-component': 'ConfigurationTabs',
        },
      },
    },
  },
};

export const collectionTableSchema = (filterParams):ISchema => {
  console.log(filterParams)
  return {
    type: 'object',
    properties: {
      block: {
        type: 'void',
        'x-collection': 'collections',
        'x-decorator': 'ResourceActionProvider',
        'x-decorator-props': {
          collection: collection,
          dragSort: true,
          request: {
            resource: 'collections',
            action: 'list',
            params: {
              pageSize: 50,
              sort: 'sort',
              filter: {
                'hidden.$isFalsy': true,
                'options.category.$contains':2
                // ...filterParams,
              },
              appends: [],
            },
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
              filter: {
                type: 'void',
                title: '{{ t("Filter") }}',
                default: {
                  $and: [{ title: { $includes: '' } }, { name: { $includes: '' } }],
                },
                'x-action': 'filter',
                'x-component': 'Filter.Action',
                'x-component-props': {
                  icon: 'FilterOutlined',
                  useProps: '{{ cm.useFilterActionProps }}',
                },
                'x-align': 'left',
              },
              delete: {
                type: 'void',
                title: '{{ t("Delete") }}',
                'x-component': 'Action',
                'x-component-props': {
                  icon: 'DeleteOutlined',
                  useAction: '{{ cm.useBulkDestroyActionAndRefreshCM }}',
                  confirm: {
                    title: "{{t('Delete record')}}",
                    content: "{{t('Are you sure you want to delete it?')}}",
                  },
                },
              },
              create: {
                type: 'void',
                title: '{{ t("Create collection") }}',
                'x-component': 'AddCollection',
                'x-component-props': {
                  type: 'primary',
                },
              },
              addCategories: {
                type: 'void',
                title: '{{ t("Add category") }}',
                'x-component': 'AddCategory',
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
              useAction() {
                const api = useAPIClient();
                const { t } = useTranslation();
                return {
                  async move(from, to) {
                    await api.resource('collections').move({
                      sourceId: from.key,
                      targetId: to.key,
                    });
                    message.success(t('Saved successfully'), 0.2);
                  },
                };
              },
            },
            properties: {
              column1: {
                type: 'void',
                'x-decorator': 'Table.Column.Decorator',
                'x-component': 'Table.Column',
                properties: {
                  title: {
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              column2: {
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
              column3: {
                type: 'void',
                'x-decorator': 'Table.Column.Decorator',
                'x-component': 'Table.Column',
                title: '{{t("Collection template")}}',
                properties: {
                  template: {
                    'x-component': CollectionTemplate,
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
                      view: {
                        type: 'void',
                        title: '{{ t("Configure fields") }}',
                        'x-component': 'Action.Link',
                        'x-component-props': {},
                        properties: {
                          drawer: {
                            type: 'void',
                            'x-component': 'Action.Drawer',
                            'x-component-props': {
                              destroyOnClose: true,
                            },
                            'x-reactions': (field) => {
                              const i = field.path.segments[1];
                              const table = field.form.getValuesIn(`table.${i}`);
                              if (table) {
                                field.title = `${compile(table.title)} - ${compile('{{ t("Configure fields") }}')}`;
                              }
                            },
                            properties: {
                              collectionFieldSchema,
                            },
                          },
                        },
                      },
                      update: {
                        type: 'void',
                        title: '{{ t("Edit") }}',
                        'x-component': 'EditCollection',
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
                            title: "{{t('Delete record')}}",
                            content: "{{t('Are you sure you want to delete it?')}}",
                          },
                          useAction: '{{ cm.useDestroyActionAndRefreshCM }}',
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
};

export const collectionCategorySchema: ISchema = {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      'x-decorator': 'Form',
      'x-component': 'Action.Modal',
      title: '{{ t("Create category") }}',
      'x-component-props': {
        width: 520,
        getContainer: '{{ getContainer }}',
      },
      properties: {
        name: {
          type: 'string',
          title: '{{t("Category name")}}',
          required: true,
          'x-disabled': '{{ !createOnly }}',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        sort: {
          type: 'double',
          title: '{{t("Sort")}}',
          required: false,
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
        },
        color: {
          type: 'string',
          title: '{{t("Color")}}',
          required: false,
          'x-decorator': 'FormItem',
          'x-component': 'ColorSelect',
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Modal.Footer',
          properties: {
            action1: {
              title: '{{ t("Cancel") }}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCancelAction }}',
              },
            },
            action2: {
              title: '{{ t("Submit") }}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                useAction: '{{ useCreateCategry }}',
              },
            },
          },
        },
      },
    },
  },
};
