import { PageConfig } from './e2eUtils';

/**
 * 一个空的 group 页面
 */
export const groupPageEmpty: PageConfig = {
  type: 'group',
  name: 'Empty group',
  pageSchema: {
    type: 'void',
  },
};

export const linkPage: PageConfig = {
  type: 'link',
  name: 'Link',
  url: '/',
  pageSchema: {
    type: 'void',
  },
};

/**
 * 一个空的且启用 tabs 的 page 页面
 */
export const tabPageEmpty: PageConfig = {
  pageSchema: {
    'x-uid': 'esny2dg7yz8',
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-component-props': {
      enablePageTabs: true,
    },
    properties: {
      '66azy7h1rj0': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-uid': 'ir8tvhr1xqi',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-async': true,
    'x-index': 1,
  },
};

/**
 * 1. 一个数据表，且拥有一个对一的关系字段
 * 2. 一个 Table 区块，且基于上面的 collection
 */
export const schemaInitializerTable: PageConfig = {
  collections: [
    {
      key: '11a4ik8kl9p',
      name: 't_unp4scqamw9',
      title: 'schemaInitializerTable',
      inherit: false,
      hidden: false,
      description: null,
      fields: [
        {
          key: 's4qqlcnoapb',
          name: 'id',
          type: 'bigInt',
          interface: 'id',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
          uiSchema: {
            type: 'number',
            title: '{{t("ID")}}',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          key: 'xbmezad7lqw',
          name: 'f_glmx57v26jp',
          type: 'bigInt',
          interface: 'integer',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: 'f_glmx57v26jp',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          key: '49vw1432lci',
          name: 'f_zcrjd5yzin4',
          type: 'bigInt',
          interface: 'integer',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: 'f_zcrjd5yzin4',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          key: 'gdxte5tkil3',
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          field: 'createdAt',
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
        {
          key: 'th9daz2jccp',
          name: 'createdBy',
          type: 'belongsTo',
          interface: 'createdBy',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          target: 'users',
          foreignKey: 'createdById',
          uiSchema: {
            type: 'object',
            title: '{{t("Created by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          targetKey: 'id',
        },
        {
          key: 'nm2ndl19c93',
          name: 'updatedAt',
          type: 'date',
          interface: 'updatedAt',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          field: 'updatedAt',
          uiSchema: {
            type: 'string',
            title: '{{t("Last updated at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
        {
          key: '7w5jcnfoev4',
          name: 'updatedBy',
          type: 'belongsTo',
          interface: 'updatedBy',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          target: 'users',
          foreignKey: 'updatedById',
          uiSchema: {
            type: 'object',
            title: '{{t("Last updated by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          targetKey: 'id',
        },
        {
          key: 'rfyf6cgmj1g',
          name: 'f_pw7uiecc8uc',
          type: 'belongsTo',
          interface: 'obo',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          foreignKey: 'f_glmx57v26jp',
          onDelete: 'SET NULL',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: false,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
            title: 'One to one (belongs to)',
          },
          target: 'users',
          targetKey: 'id',
        },
        {
          key: 'iwdx4j629w7',
          name: 'f_nlag88n4f22',
          type: 'hasOne',
          interface: 'oho',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          foreignKey: 'f_90fy41an7i7',
          onDelete: 'SET NULL',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: false,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
            title: 'One to one (has one)',
          },
          target: 'users',
          sourceKey: 'id',
        },
        {
          key: 'tj5utt622c5',
          name: 'f_mpzuntgzwhp',
          type: 'belongsTo',
          interface: 'm2o',
          description: null,
          collectionName: 't_unp4scqamw9',
          parentKey: null,
          reverseKey: null,
          foreignKey: 'f_zcrjd5yzin4',
          onDelete: 'SET NULL',
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
      category: [],
      logging: true,
      autoGenId: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
      sortable: true,
      template: 'general',
      view: false,
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      i9tltxwy1zd: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          fdkznek8n9o: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              qqjb1h3wfw8: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '2tguu2tfldr': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 't_unp4scqamw9:list',
                    'x-decorator-props': {
                      collection: 't_unp4scqamw9',
                      resource: 't_unp4scqamw9',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'TableActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'yua2ss66y9j',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pdv91sygvv8: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'TableColumnInitializers',
                        'x-component': 'TableV2',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                          useProps: '{{ useTableBlockProps }}',
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
                            'x-initializer': 'TableActionColumnInitializers',
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
                                'x-uid': 'hn2sfhtqhoh',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '6ibzk6jzhxm',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'ys113qin9xn',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '2mbwbsomp3t',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'uqznz647hoa',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'cm64yzy59qh',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'w26ak58jtka',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '24ajc4tx11u',
    'x-async': true,
    'x-index': 1,
  },
};
