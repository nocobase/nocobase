import { CollectionSetting, PageConfig, generalWithM2oSingleSelect } from '@nocobase/test/e2e';

/**
 * 1. 创建一个名为 general 的 collection，其包含 时间、Percent 类型的字段
 */
export const generalWithDatetimeFields: CollectionSetting[] = [
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
        name: 'singleLineText2',
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'Single line text2',
        },
      },
      {
        name: 'startDatetime',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'Start date time',
          required: true,
        },
      },
      {
        name: 'startDatetime2',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'Start date time2',
          required: true,
        },
      },
      {
        name: 'endDatetime',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'End date time',
          required: true,
        },
      },
      {
        name: 'endDatetime2',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'End date time2',
          required: true,
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
      {
        name: 'percent',
        type: 'float',
        interface: 'percent',
        uiSchema: {
          'x-component-props': {
            step: '0.01',
            stringMode: true,
            addonAfter: '%',
          },
          'x-component': 'Percent',
          title: 'Percent',
        },
      },
      {
        name: 'percent2',
        type: 'float',
        interface: 'percent',
        uiSchema: {
          'x-component-props': {
            step: '0.01',
            stringMode: true,
            addonAfter: '%',
          },
          'x-component': 'Percent',
          title: 'Percent2',
        },
      },
    ],
  },
];

export const oneEmptyGantt: PageConfig = {
  collections: generalWithDatetimeFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      jebhzap4dzi: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          gl57m4hyewf: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              jm7n5dybw6t: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  nsq0rdemz4i: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'general:list',
                    'x-decorator': 'GanttBlockProvider',
                    'x-decorator-props': {
                      collection: 'general',
                      resource: 'general',
                      action: 'list',
                      fieldNames: {
                        id: 'id',
                        start: 'startDatetime',
                        range: 'day',
                        title: 'singleLineText',
                        end: 'endDatetime',
                      },
                      params: {
                        paginate: false,
                      },
                    },
                    'x-designer': 'Gantt.Designer',
                    'x-component': 'CardItem',
                    properties: {
                      zf07g7relim: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Gantt',
                        'x-component-props': {
                          useProps: '{{ useGanttBlockProps }}',
                        },
                        properties: {
                          toolBar: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-initializer': 'gantt:configureActions',
                            'x-uid': 'guwovmwt4c0',
                            'x-async': false,
                            'x-index': 1,
                          },
                          table: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'array',
                            'x-decorator': 'div',
                            'x-decorator-props': {
                              style: {
                                float: 'left',
                                maxWidth: '35%',
                              },
                            },
                            'x-initializer': 'table:configureColumns',
                            'x-component': 'TableV2',
                            'x-component-props': {
                              rowKey: 'id',
                              rowSelection: {
                                type: 'checkbox',
                              },
                              useProps: '{{ useTableBlockProps }}',
                              pagination: false,
                            },
                            properties: {
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Actions") }}',
                                'x-action-column': 'actions',
                                'x-decorator': 'TableV2.Column.ActionBar',
                                'x-component': 'TableV2.Column',
                                'x-designer': 'TableV2.ActionColumnDesigner',
                                'x-initializer': 'table:configureItemActions',
                                properties: {
                                  actions: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-decorator': 'DndContext',
                                    'x-component': 'Space',
                                    'x-component-props': {
                                      split: '|',
                                    },
                                    'x-uid': '9in7s3pymsd',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'rgpbsjwvq2h',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'g7qwompxaeo',
                            'x-async': false,
                            'x-index': 2,
                          },
                          detail: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Gantt.Event',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Action.Drawer',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                title: '{{ t("View record") }}',
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
                                            'x-uid': 'gxtfjqzxbfu',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'zxwwx4358p1',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '1p0tnmzpsim',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'hcue8v3fwti',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'fg7cjxu4hxp',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': 'rf47sf7k16z',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'tritqukkd86',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '3am2ctuhyka',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p8pesbc7fiv',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ddm9fhkvrbw',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'vpk8sp3eap1',
    'x-async': true,
    'x-index': 1,
  },
};
/**
 * 一个空的 Table 区块，并且有这些按钮：Bulk edit
 */
export const oneEmptyTableBlockWithCustomizeUpdate: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    type: 'void',
    version: '2.0',
    'x-component': 'Page',
    _isJSONSchemaObject: true,
    properties: {
      s409jhc9wzp: {
        type: 'void',
        version: '2.0',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        _isJSONSchemaObject: true,
        properties: {
          btrf53i4lpi: {
            type: 'void',
            version: '2.0',
            'x-component': 'Grid.Row',
            _isJSONSchemaObject: true,
            properties: {
              '6u5d4dju1zw': {
                type: 'void',
                version: '2.0',
                'x-component': 'Grid.Col',
                _isJSONSchemaObject: true,
                properties: {
                  yxyx102howk: {
                    type: 'void',
                    version: '2.0',
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-filter-targets': [],
                    'x-decorator-props': {
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      dragSort: false,
                      resource: 'general',
                      showIndex: true,
                      collection: 'general',
                      disableTemplate: false,
                    },
                    _isJSONSchemaObject: true,
                    properties: {
                      actions: {
                        type: 'void',
                        version: '2.0',
                        'x-component': 'ActionBar',
                        'x-initializer': 'table:configureActions',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        _isJSONSchemaObject: true,
                        properties: {
                          hsb2p0q5ftw: {
                            type: 'void',
                            title: '{{ t("Bulk update") }}',
                            version: '2.0',
                            'x-align': 'right',
                            'x-action': 'customize:bulkUpdate',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:bulkUpdate',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action': 'update',
                            'x-action-settings': {
                              onSuccess: {
                                manualClose: true,
                                redirecting: false,
                                successMessage: '{{t("Updated successfully")}}',
                              },
                              updateMode: 'selected',
                              assignedValues: {},
                            },
                            'x-component-props': {
                              icon: 'EditOutlined',
                              useProps: '{{ useCustomizeBulkUpdateActionProps }}',
                            },
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            _isJSONSchemaObject: true,
                            'x-uid': '5nghpuc3f3x',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '8lq9zqwwkqd',
                        'x-async': false,
                        'x-index': 1,
                      },
                      dcblkvx1jj1: {
                        type: 'array',
                        version: '2.0',
                        'x-component': 'TableV2',
                        'x-initializer': 'table:configureColumns',
                        'x-component-props': {
                          rowKey: 'id',
                          useProps: '{{ useTableBlockProps }}',
                          rowSelection: {
                            type: 'checkbox',
                          },
                        },
                        _isJSONSchemaObject: true,
                        properties: {
                          actions: {
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            version: '2.0',
                            'x-designer': 'TableV2.ActionColumnDesigner',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-initializer': 'table:configureItemActions',
                            'x-action-column': 'actions',
                            _isJSONSchemaObject: true,
                            properties: {
                              actions: {
                                type: 'void',
                                version: '2.0',
                                'x-component': 'Space',
                                'x-decorator': 'DndContext',
                                'x-component-props': {
                                  split: '|',
                                },
                                _isJSONSchemaObject: true,
                                'x-uid': 'dqt7mgaazmh',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qp1nqbd1ccv',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '32v8q0beyo2',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 't785fa9uwcc',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'pebalqz6iw2',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'drll4zh4jq1',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '5fdz5g6qr6y',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'z47gi9qo5jn',
    'x-async': true,
    'x-index': 1,
  },
};
