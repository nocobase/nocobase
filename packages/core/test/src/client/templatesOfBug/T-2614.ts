import { PageConfig } from '../e2eUtils';

export const T2614: PageConfig = {
  collections: [
    {
      name: 'T2614',
      fields: [
        {
          name: 'm2o',
          interface: 'm2o',
          target: 'T2614Target1',
        },
      ],
    },
    {
      name: 'T2614Target1',
      fields: [
        {
          name: 'm2oOfTarget1',
          interface: 'm2o',
          target: 'T2614Target2',
        },
      ],
    },
    {
      name: 'T2614Target2',
      fields: [
        {
          name: 'm2oOfTarget2',
          interface: 'm2o',
          target: 'users',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      oaeetth18tf: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          vv0l8wohslb: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '7se9siwa4ce': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '249fb0vofov': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'T2614:list',
                    'x-decorator-props': {
                      collection: 'T2614',
                      resource: 'T2614',
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
                        'x-uid': 'vq4vg5mpbxz',
                        'x-async': false,
                        'x-index': 1,
                      },
                      v76qyn133dr: {
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
                                properties: {
                                  '02okcjna453': {
                                    'x-uid': 'xowhnp7a686',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
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
                                                    properties: {
                                                      qbl84fadyr0: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          pfnr7qcapp2: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              eomkz742tgm: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'T2614:get',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'T2614',
                                                                  collection: 'T2614',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                properties: {
                                                                  sekfkpv5dh2: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    properties: {
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer':
                                                                          'ReadPrettyFormActionInitializers',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          style: {
                                                                            marginBottom: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'mt321nhie11',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer':
                                                                          'ReadPrettyFormItemInitializers',
                                                                        properties: {
                                                                          i39cn9ve66b: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              h6aq6z28saw: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2o: {
                                                                                    'x-uid': '5zamj2l0hxp',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2614.m2o',
                                                                                    'x-component-props': {
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    properties: {
                                                                                      sgu8ssav8z3: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.Nester',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'FormItemInitializers',
                                                                                            properties: {
                                                                                              e5kqdzyj562: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  '36nwk5wtcze': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oOfTarget1: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2614Target1.m2oOfTarget1',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-uid':
                                                                                                          '9x1i9kks2io',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'gnqmqaqs49i',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'sku445zzg07',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              bnd1dnje70d: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  ygyvra5m18v: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      'm2oOfTarget1.id':
                                                                                                        {
                                                                                                          _isJSONSchemaObject:
                                                                                                            true,
                                                                                                          version:
                                                                                                            '2.0',
                                                                                                          type: 'string',
                                                                                                          'x-designer':
                                                                                                            'FormItem.Designer',
                                                                                                          'x-component':
                                                                                                            'CollectionField',
                                                                                                          'x-read-pretty':
                                                                                                            true,
                                                                                                          'x-component-props':
                                                                                                            {
                                                                                                              'pattern-disable':
                                                                                                                true,
                                                                                                            },
                                                                                                          'x-decorator':
                                                                                                            'FormItem',
                                                                                                          'x-collection-field':
                                                                                                            'T2614Target1.m2oOfTarget1.id',
                                                                                                          'x-uid':
                                                                                                            '0trg79yim60',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 1,
                                                                                                        },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'auigm7t6blc',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '6ll6h4ii2td',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'wxo0qlrm5ss',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '73iro2istbt',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'h3feczketbc',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'nb5fbboc504',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'dehspo2sh69',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'lyvcisiy2mz',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'u78ad3fqfdo',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'r8s2aj79b9q',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'fgsdtpfae0q',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'dzzom03ln6q',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'u8h5d2ecch0',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '1dlp1swsc68',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'qa2uyudep13',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  '697zke71z0l': {
                                    'x-uid': '7o63dwge91d',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Edit record',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    properties: {
                                      drawer: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{ t("Edit record") }}',
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
                                                title: '{{t("Edit")}}',
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
                                                    properties: {
                                                      z79dioevb4n: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          krzxk68va81: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              '7ms7r5wolwa': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'T2614:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  resource: 'T2614',
                                                                  collection: 'T2614',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  '4pxevnwkd12': {
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
                                                                        'x-initializer': 'FormItemInitializers',
                                                                        properties: {
                                                                          j9egu0k0tkq: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              zpv9u8httu7: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2o: {
                                                                                    'x-uid': '1pyjlpyhxue',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2614.m2o',
                                                                                    'x-component-props': {
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    properties: {
                                                                                      ts1e7dq92gw: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.Nester',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'FormItemInitializers',
                                                                                            properties: {
                                                                                              esgv9d2n3jl: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  fvjf1i0u5tj: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oOfTarget1: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2614Target1.m2oOfTarget1',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-uid':
                                                                                                          'tbl4cxpqqhr',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '0inwt7v6zx1',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'ooid2e23vzk',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              '8jo9e13m9pu': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  dbwz7xfmcsf: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      'm2oOfTarget1.id':
                                                                                                        {
                                                                                                          _isJSONSchemaObject:
                                                                                                            true,
                                                                                                          version:
                                                                                                            '2.0',
                                                                                                          type: 'string',
                                                                                                          'x-designer':
                                                                                                            'FormItem.Designer',
                                                                                                          'x-component':
                                                                                                            'CollectionField',
                                                                                                          'x-read-pretty':
                                                                                                            true,
                                                                                                          'x-component-props':
                                                                                                            {
                                                                                                              'pattern-disable':
                                                                                                                true,
                                                                                                            },
                                                                                                          'x-decorator':
                                                                                                            'FormItem',
                                                                                                          'x-collection-field':
                                                                                                            'T2614Target1.m2oOfTarget1.id',
                                                                                                          'x-uid':
                                                                                                            'no1h1z3kbqn',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 1,
                                                                                                        },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'f1w8n47pxgk',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'v6x8pzyim4q',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'ixnvtkde6ut',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'a0765a01l4v',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'nhq72b5xej7',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '0rchr17dcvr',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'fvfqd52uoaa',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'UpdateFormActionInitializers',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'bm93ifuifak',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '6s8ie14bci8',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'hljdd9nlub3',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'h14avrpxyu9',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'n54e5yj7uo8',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'o6q0ebwuei0',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'ej65121swhj',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '521m41b059u',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '6ddt1wgx8zu',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': '1oj9b60cf3w',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qdzdffxf5da',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 't7svx0a3pce',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'w8kzfaxgchd',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'hg44qtd6uw6',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'vv4zzxbtbja',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '6klhg23a43i',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '9ebjl68x43b',
    'x-async': true,
    'x-index': 1,
  },
};
