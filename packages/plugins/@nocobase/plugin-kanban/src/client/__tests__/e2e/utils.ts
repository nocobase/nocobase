import { PageConfig, CollectionSetting } from '@nocobase/test/client';

/**
 * 1. 创建一个名为 general 的 collection，其包含 single select 类型的字段
 */
export const generalWithSingleSelect: CollectionSetting[] = [
  {
    name: 'general',
    title: 'General',
    fields: [
      {
        name: 'singleLineText',
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'Single line text',
        },
      },
      {
        name: 'singleSelect',
        interface: 'select',
        uiSchema: {
          enum: [
            {
              value: 'option1',
              label: 'option2',
              color: 'red',
            },
            {
              value: 'option2',
              label: 'option2',
              color: 'magenta',
            },
            {
              value: 'option3',
              label: 'option3',
              color: 'volcano',
            },
          ],
          type: 'string',
          'x-component': 'Select',
          title: 'Single select',
        },
      },
      {
        name: 'f_t22o7loai3j',
        interface: 'integer',
        isForeignKey: true,
        uiSchema: {
          type: 'number',
          title: 'f_t22o7loai3j',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      },
      {
        name: 'manyToOne',
        interface: 'm2o',
        foreignKey: 'f_t22o7loai3j',
        uiSchema: {
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: false,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
          title: 'Many to one',
        },
        target: 'users',
        targetKey: 'id',
      },
    ],
  },
];

export const oneEmptyKanbanBlock: PageConfig = {
  collections: generalWithSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      cgnaby890vq: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          li1ohlkp28k: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              z2ksk39i7be: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  q2wkwje0ugs: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'general:list',
                    'x-decorator': 'KanbanBlockProvider',
                    'x-decorator-props': {
                      collection: 'general',
                      resource: 'general',
                      action: 'list',
                      groupField: 'singleSelect',
                      params: {
                        sort: ['singleSelect_sort'],
                        paginate: false,
                      },
                    },
                    'x-designer': 'Kanban.Designer',
                    'x-component': 'CardItem',
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'KanbanActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': '6gapzktari1',
                        'x-async': false,
                        'x-index': 1,
                      },
                      uofc68x5pyf: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'Kanban',
                        'x-component-props': {
                          useProps: '{{ useKanbanBlockProps }}',
                        },
                        properties: {
                          card: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-read-pretty': true,
                            'x-label-disabled': true,
                            'x-decorator': 'BlockItem',
                            'x-component': 'Kanban.Card',
                            'x-component-props': {
                              openMode: 'drawer',
                            },
                            'x-designer': 'Kanban.Card.Designer',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-component-props': {
                                  dndContext: false,
                                },
                                'x-uid': 'ec2uu5cbtxb',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'wwq4rync215',
                            'x-async': false,
                            'x-index': 1,
                          },
                          cardViewer: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("View") }}',
                            'x-designer': 'Action.Designer',
                            'x-component': 'Kanban.CardViewer',
                            'x-action': 'view',
                            'x-component-props': {
                              openMode: 'drawer',
                            },
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("View record") }}',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'TabPaneInitializers',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Details")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'RecordBlockInitializers',
                                            'x-uid': '2s4hzb0dnhg',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '3q8wdj8w030',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '7q26jmvaboa',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'muteugjpq3e',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '0ul0tk6ve1z',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'iw25h23rift',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'gha6t6nn855',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '82171zt55y4',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'b85nywqaxtw',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'yyzcjth4t13',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '6pdx9e6cup2',
    'x-async': true,
    'x-index': 1,
  },
};
