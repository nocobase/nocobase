import { CollectionSetting, PageConfig } from '@nocobase/test/e2e';

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
        name: 'singleSelect_sort',
        interface: 'sort',
        scopeKey: 'singleSelect',
        hidden: true,
        type: 'sort',
      },
      {
        name: 'singleSelect',
        interface: 'select',
        uiSchema: {
          enum: [
            {
              value: 'option1',
              label: 'option1',
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
      sp1e0rp3272: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '4io56n1mje4': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              ltnu6re5ctl: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  v8nqwpajlqi: {
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
                        'x-initializer': 'kanban:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'p8urndbswek',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '1g2kx5ld8wj': {
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
                                'x-uid': 'ab07zz24rx2',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'lx8jojqoxak',
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
                                            'x-initializer': 'popup:common:addBlock',
                                            'x-uid': '2hsi7zy93g6',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'i7jfppu1oy5',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'hgl0a2a3506',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'vy24wl1hda3',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1k5u78s6hxm',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'wila2fay8gp',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '3yci31krdmf',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '3zk2v89pmxk',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'hkvyce0eer5',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '9tev3j3rxtd',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'imkzeo7w9u6',
    'x-async': true,
    'x-index': 1,
  },
};
