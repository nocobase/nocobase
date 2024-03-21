import { PageConfig, generalWithAssociation } from '@nocobase/test/e2e';

export const T3377: PageConfig = {
  collections: generalWithAssociation,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '9ceuqyw4ak4': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          dtuo84w9hyg: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '7uaaqswm95y': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '1cfjo8r78he': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      dataSource: 'main',
                      resource: 'general',
                      collection: 'general',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-component-props': {},
                    properties: {
                      '8lwxiwoywg1': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-component-props': {
                          useProps: '{{ useFormBlockProps }}',
                        },
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            properties: {
                              '729znsrntep': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '5p86kmo6egw': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      oneToMany: {
                                        'x-uid': 'avqy27sb260',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.oneToMany',
                                        'x-component-props': {
                                          fieldNames: {
                                            label: 'id',
                                            value: 'id',
                                          },
                                          mode: 'SubTable',
                                        },
                                        default: null,
                                        properties: {
                                          '8y7afx0j5th': {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.SubTable',
                                            'x-initializer': 'table:configureColumns',
                                            'x-initializer-props': {
                                              action: false,
                                            },
                                            'x-index': 1,
                                            properties: {
                                              '142uprbj0nc': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                properties: {
                                                  roles: {
                                                    'x-uid': '8166uxmyjhx',
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'users.roles',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      fieldNames: {
                                                        label: 'name',
                                                        value: 'name',
                                                      },
                                                      ellipsis: true,
                                                      size: 'small',
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'fzuzbc7eeez',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'siihawqjsjt',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'bwho4aaehk8',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 's227w6yu1c8',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'kw0g1r7goe1',
                            'x-async': false,
                            'x-index': 1,
                          },
                          lt5gxor0084: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'FormActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                marginTop: 24,
                              },
                            },
                            'x-uid': 'zaerntg7pj3',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'cpvzwnvfv5b',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'otvbtpe6k8t',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '9fklx2ir6ps',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'cnlpg1c4tni',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ne63abszen5',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'yxsu4c1ag4d',
    'x-async': true,
    'x-index': 1,
  },
};
