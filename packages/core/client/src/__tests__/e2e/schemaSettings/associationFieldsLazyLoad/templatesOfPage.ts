import { PageConfig, generalWithMultiLevelRelationshipFields } from '@nocobase/test/client';

export const testingLazyLoadingOfDisplayAssociationFields: PageConfig = {
  collections: generalWithMultiLevelRelationshipFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      chxe6j9szj6: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          djjvozyzzha: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              pbes49a5cl4: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  ha51vlyefac: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                    },
                    'x-designer': 'FormV2.Designer',
                    'x-component': 'CardItem',
                    'x-component-props': {},
                    properties: {
                      ih1nztqs13s: {
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
                              grgso6wba2b: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  h8lo5808cy4: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      m2oField0: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.m2oField0',
                                        'x-component-props': {},
                                        'x-uid': 'y2bhwuzsffe',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'z59ao0q32u3',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'lzcl42nimim',
                                'x-async': false,
                                'x-index': 1,
                              },
                              utb2rtfq32g: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '9eg2gq78f2v': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      'm2oField0.id': {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-read-pretty': true,
                                        'x-component-props': {
                                          'pattern-disable': true,
                                        },
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.m2oField0.id',
                                        'x-uid': 'u32ijkyyi0m',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'zieisf6j5p6',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'bairx76ympz',
                                'x-async': false,
                                'x-index': 2,
                              },
                              '9e2ea2rlrkt': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  j3wsgcewsod: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      'm2oField0.m2oField1': {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-read-pretty': true,
                                        'x-component-props': {
                                          'pattern-disable': true,
                                          fieldNames: {
                                            label: 'id',
                                            value: 'id',
                                          },
                                        },
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.m2oField0.m2oField1',
                                        'x-uid': '6bd9e6utxs2',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'gnmrd6yupaj',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'b8tmz97m6x3',
                                'x-async': false,
                                'x-index': 3,
                              },
                            },
                            'x-uid': 'lfgi8eim0mo',
                            'x-async': false,
                            'x-index': 1,
                          },
                          actions: {
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
                            properties: {
                              w3wtnxq77vt: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                title: '{{ t("Submit") }}',
                                'x-action': 'submit',
                                'x-component': 'Action',
                                'x-designer': 'Action.Designer',
                                'x-component-props': {
                                  type: 'primary',
                                  htmlType: 'submit',
                                  useProps: '{{ useCreateActionProps }}',
                                },
                                'x-action-settings': {
                                  triggerWorkflows: [],
                                },
                                type: 'void',
                                'x-uid': '93e5papnmj0',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '7wqbpt1wava',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'su9jns6zj7l',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '1jpth1sbull',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'yn6nf6c4szy',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'febgraq7qvc',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'pbd6pelckfe',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'id3e7c1lwkk',
    'x-async': true,
    'x-index': 1,
  },
};

export const testingLazyLoadingOfDisplayAssociationFieldsOfSubForm: PageConfig = {
  collections: generalWithMultiLevelRelationshipFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      fg73c78h3y5: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          mxqswxl18hb: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              pvya66dzvlv: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  g5f3es7nr3r: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                    },
                    'x-designer': 'FormV2.Designer',
                    'x-component': 'CardItem',
                    'x-component-props': {},
                    properties: {
                      c5o86nxd9mb: {
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
                              '6k12v33b6j3': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  ejv7tdy2q1g: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      m2oField0: {
                                        'x-uid': 'ijsezl2rah0',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.m2oField0',
                                        'x-component-props': {
                                          mode: 'Nester',
                                        },
                                        default: null,
                                        properties: {
                                          sitlmusvkkb: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.Nester',
                                            'x-index': 1,
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'FormItemInitializers',
                                                properties: {
                                                  '9c4mwdnt1kf': {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      zudd6bmz8hi: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          m2oField1: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'string',
                                                            'x-designer': 'FormItem.Designer',
                                                            'x-component': 'CollectionField',
                                                            'x-decorator': 'FormItem',
                                                            'x-collection-field': 'm2oField1.m2oField1',
                                                            'x-component-props': {},
                                                            'x-uid': 'vmmm2ps83ps',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'lfjt1mhtl1m',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '3ruo5g1rlbl',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                  klebqe3e574: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      j446pc51eyn: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          'm2oField1.id': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'string',
                                                            'x-designer': 'FormItem.Designer',
                                                            'x-component': 'CollectionField',
                                                            'x-read-pretty': true,
                                                            'x-component-props': {
                                                              'pattern-disable': true,
                                                            },
                                                            'x-decorator': 'FormItem',
                                                            'x-collection-field': 'm2oField1.m2oField1.id',
                                                            'x-uid': '7hnxu7tlltv',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'vk58v8zpmkv',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'ymxrni6xxzw',
                                                    'x-async': false,
                                                    'x-index': 2,
                                                  },
                                                  qk6n0s3rvk8: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      h0g7qin8fs0: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          'm2oField1.m2oField2': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'string',
                                                            'x-designer': 'FormItem.Designer',
                                                            'x-component': 'CollectionField',
                                                            'x-read-pretty': true,
                                                            'x-component-props': {
                                                              'pattern-disable': true,
                                                              fieldNames: {
                                                                label: 'id',
                                                                value: 'id',
                                                              },
                                                            },
                                                            'x-decorator': 'FormItem',
                                                            'x-collection-field': 'm2oField1.m2oField1.m2oField2',
                                                            'x-uid': 'dgladqknqnn',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'bqo7plvgb0x',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'no21vaa586q',
                                                    'x-async': false,
                                                    'x-index': 3,
                                                  },
                                                },
                                                'x-uid': 'awlaaufu6ay',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'cn0jjygl84n',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'su0d33tuog3',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ht322ua6dhi',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'juoqrg2igra',
                            'x-async': false,
                            'x-index': 1,
                          },
                          actions: {
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
                            properties: {
                              rdn1925t3ob: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                title: '{{ t("Submit") }}',
                                'x-action': 'submit',
                                'x-component': 'Action',
                                'x-designer': 'Action.Designer',
                                'x-component-props': {
                                  type: 'primary',
                                  htmlType: 'submit',
                                  useProps: '{{ useCreateActionProps }}',
                                },
                                'x-action-settings': {
                                  triggerWorkflows: [],
                                },
                                type: 'void',
                                'x-uid': 'e7m2uvv5pm3',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '48u4hmqlo6h',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'qsh7fle6kg5',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'vto5yeudv3q',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'fls10nmi74s',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '6f5agngf4ek',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '9ix5t83i1ts',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'f8ujqqi4tyi',
    'x-async': true,
    'x-index': 1,
  },
};

export const testingLazyLoadingOfAssociationFieldsOfSubForm: PageConfig = {
  collections: generalWithMultiLevelRelationshipFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      c28btifcxho: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          spt3dncqt6g: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              uldwynws3cx: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  bzn1h0lpoks: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-decorator-props': {
                      collection: 'general',
                      resource: 'general',
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
                        properties: {
                          gia25ckb33i: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: "{{t('Add new')}}",
                            'x-designer': 'Action.Designer',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Add record") }}',
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
                                    'x-initializer': 'TabPaneInitializersForCreateFormBlock',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'CreateFormBlockInitializers',
                                            'x-uid': 'ezrqm7whaxk',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'k3o2j3ki7b0',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'l4inxlbpx7u',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'rlqph2piz80',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'czs0vecrs2j',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '6dzswixui3y',
                        'x-async': false,
                        'x-index': 1,
                      },
                      e9himo1vo6z: {
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
                                  '14v6hewqyv9': {
                                    'x-uid': 'eho7lu9n9w5',
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
                                                      rxh2yo159ct: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          '69rqqe6s59n': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              cv1hoy6z73u: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'general:get',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'general',
                                                                  collection: 'general',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                properties: {
                                                                  ebfwg6en8z3: {
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
                                                                        'x-uid': 'nczbuzgyi5i',
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
                                                                          h091lw5s3ot: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              '0okszebti37': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  id: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'general.id',
                                                                                    'x-component-props': {},
                                                                                    'x-read-pretty': true,
                                                                                    'x-uid': '0i8lx83o56y',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'm6fpas6blbk',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '65osczc92cz',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          srpbcst368p: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              '4abbfjvct52': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2oField0: {
                                                                                    'x-uid': 'xg3v3n31u5u',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'general.m2oField0',
                                                                                    'x-component-props': {
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    properties: {
                                                                                      jeamfyhg8r9: {
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
                                                                                              '7gni7kgrxc6': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  ol9n4vgrj4a: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      id: {
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
                                                                                                          'm2oField1.id',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-read-pretty':
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'pcudj4r7tag',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'f11jr4ikfae',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '09v08ousd8s',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              '6i64qc2t8yl': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  ua78t3hazyg: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oField1: {
                                                                                                        'x-uid':
                                                                                                          '6i5hvki95fm',
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
                                                                                                          'm2oField1.m2oField1',
                                                                                                        'x-component-props':
                                                                                                          {
                                                                                                            mode: 'Nester',
                                                                                                          },
                                                                                                        properties: {
                                                                                                          l64n7q06u69: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'AssociationField.Nester',
                                                                                                            'x-index': 1,
                                                                                                            properties:
                                                                                                              {
                                                                                                                grid: {
                                                                                                                  _isJSONSchemaObject:
                                                                                                                    true,
                                                                                                                  version:
                                                                                                                    '2.0',
                                                                                                                  type: 'void',
                                                                                                                  'x-component':
                                                                                                                    'Grid',
                                                                                                                  'x-initializer':
                                                                                                                    'FormItemInitializers',
                                                                                                                  properties:
                                                                                                                    {
                                                                                                                      wfis8uozy45:
                                                                                                                        {
                                                                                                                          _isJSONSchemaObject:
                                                                                                                            true,
                                                                                                                          version:
                                                                                                                            '2.0',
                                                                                                                          type: 'void',
                                                                                                                          'x-component':
                                                                                                                            'Grid.Row',
                                                                                                                          properties:
                                                                                                                            {
                                                                                                                              widjeb1iua5:
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Col',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      id: {
                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                          true,
                                                                                                                                        version:
                                                                                                                                          '2.0',
                                                                                                                                        type: 'string',
                                                                                                                                        'x-designer':
                                                                                                                                          'FormItem.Designer',
                                                                                                                                        'x-component':
                                                                                                                                          'CollectionField',
                                                                                                                                        'x-decorator':
                                                                                                                                          'FormItem',
                                                                                                                                        'x-collection-field':
                                                                                                                                          'm2oField2.id',
                                                                                                                                        'x-component-props':
                                                                                                                                          {},
                                                                                                                                        'x-read-pretty':
                                                                                                                                          true,
                                                                                                                                        'x-uid':
                                                                                                                                          'm8wz20ffkim',
                                                                                                                                        'x-async':
                                                                                                                                          false,
                                                                                                                                        'x-index': 1,
                                                                                                                                      },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    '8zrvt9woaxx',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 1,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          'x-uid':
                                                                                                                            'qg62l58hu4n',
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 1,
                                                                                                                        },
                                                                                                                      gos46xkhf6j:
                                                                                                                        {
                                                                                                                          _isJSONSchemaObject:
                                                                                                                            true,
                                                                                                                          version:
                                                                                                                            '2.0',
                                                                                                                          type: 'void',
                                                                                                                          'x-component':
                                                                                                                            'Grid.Row',
                                                                                                                          properties:
                                                                                                                            {
                                                                                                                              dvgf1pge350:
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Col',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      m2oField2:
                                                                                                                                        {
                                                                                                                                          'x-uid':
                                                                                                                                            'gweez55achj',
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'string',
                                                                                                                                          'x-designer':
                                                                                                                                            'FormItem.Designer',
                                                                                                                                          'x-component':
                                                                                                                                            'CollectionField',
                                                                                                                                          'x-decorator':
                                                                                                                                            'FormItem',
                                                                                                                                          'x-collection-field':
                                                                                                                                            'm2oField2.m2oField2',
                                                                                                                                          'x-component-props':
                                                                                                                                            {
                                                                                                                                              mode: 'Nester',
                                                                                                                                            },
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              ipwo3aeoxd1:
                                                                                                                                                {
                                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                                    true,
                                                                                                                                                  version:
                                                                                                                                                    '2.0',
                                                                                                                                                  type: 'void',
                                                                                                                                                  'x-component':
                                                                                                                                                    'AssociationField.Nester',
                                                                                                                                                  'x-index': 1,
                                                                                                                                                  properties:
                                                                                                                                                    {
                                                                                                                                                      grid: {
                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                          true,
                                                                                                                                                        version:
                                                                                                                                                          '2.0',
                                                                                                                                                        type: 'void',
                                                                                                                                                        'x-component':
                                                                                                                                                          'Grid',
                                                                                                                                                        'x-initializer':
                                                                                                                                                          'FormItemInitializers',
                                                                                                                                                        properties:
                                                                                                                                                          {
                                                                                                                                                            '8ga4k036hkh':
                                                                                                                                                              {
                                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                                  true,
                                                                                                                                                                version:
                                                                                                                                                                  '2.0',
                                                                                                                                                                type: 'void',
                                                                                                                                                                'x-component':
                                                                                                                                                                  'Grid.Row',
                                                                                                                                                                properties:
                                                                                                                                                                  {
                                                                                                                                                                    msnws5m7e3n:
                                                                                                                                                                      {
                                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                                          true,
                                                                                                                                                                        version:
                                                                                                                                                                          '2.0',
                                                                                                                                                                        type: 'void',
                                                                                                                                                                        'x-component':
                                                                                                                                                                          'Grid.Col',
                                                                                                                                                                        properties:
                                                                                                                                                                          {
                                                                                                                                                                            id: {
                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                true,
                                                                                                                                                                              version:
                                                                                                                                                                                '2.0',
                                                                                                                                                                              type: 'string',
                                                                                                                                                                              'x-designer':
                                                                                                                                                                                'FormItem.Designer',
                                                                                                                                                                              'x-component':
                                                                                                                                                                                'CollectionField',
                                                                                                                                                                              'x-decorator':
                                                                                                                                                                                'FormItem',
                                                                                                                                                                              'x-collection-field':
                                                                                                                                                                                'm2oField3.id',
                                                                                                                                                                              'x-component-props':
                                                                                                                                                                                {},
                                                                                                                                                                              'x-read-pretty':
                                                                                                                                                                                true,
                                                                                                                                                                              'x-uid':
                                                                                                                                                                                '9rpoyelp388',
                                                                                                                                                                              'x-async':
                                                                                                                                                                                false,
                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                            },
                                                                                                                                                                          },
                                                                                                                                                                        'x-uid':
                                                                                                                                                                          '3l348ecw0f4',
                                                                                                                                                                        'x-async':
                                                                                                                                                                          false,
                                                                                                                                                                        'x-index': 1,
                                                                                                                                                                      },
                                                                                                                                                                  },
                                                                                                                                                                'x-uid':
                                                                                                                                                                  'ii5542jvwe9',
                                                                                                                                                                'x-async':
                                                                                                                                                                  false,
                                                                                                                                                                'x-index': 1,
                                                                                                                                                              },
                                                                                                                                                            '08qsmq3fwps':
                                                                                                                                                              {
                                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                                  true,
                                                                                                                                                                version:
                                                                                                                                                                  '2.0',
                                                                                                                                                                type: 'void',
                                                                                                                                                                'x-component':
                                                                                                                                                                  'Grid.Row',
                                                                                                                                                                properties:
                                                                                                                                                                  {
                                                                                                                                                                    f8be5hgqwzq:
                                                                                                                                                                      {
                                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                                          true,
                                                                                                                                                                        version:
                                                                                                                                                                          '2.0',
                                                                                                                                                                        type: 'void',
                                                                                                                                                                        'x-component':
                                                                                                                                                                          'Grid.Col',
                                                                                                                                                                        properties:
                                                                                                                                                                          {
                                                                                                                                                                            m2oField3:
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
                                                                                                                                                                                'x-decorator':
                                                                                                                                                                                  'FormItem',
                                                                                                                                                                                'x-collection-field':
                                                                                                                                                                                  'm2oField3.m2oField3',
                                                                                                                                                                                'x-component-props':
                                                                                                                                                                                  {},
                                                                                                                                                                                'x-uid':
                                                                                                                                                                                  'ves5a1w4pmu',
                                                                                                                                                                                'x-async':
                                                                                                                                                                                  false,
                                                                                                                                                                                'x-index': 1,
                                                                                                                                                                              },
                                                                                                                                                                          },
                                                                                                                                                                        'x-uid':
                                                                                                                                                                          'u6qilftivur',
                                                                                                                                                                        'x-async':
                                                                                                                                                                          false,
                                                                                                                                                                        'x-index': 1,
                                                                                                                                                                      },
                                                                                                                                                                  },
                                                                                                                                                                'x-uid':
                                                                                                                                                                  'nbrjmpq5y84',
                                                                                                                                                                'x-async':
                                                                                                                                                                  false,
                                                                                                                                                                'x-index': 2,
                                                                                                                                                              },
                                                                                                                                                          },
                                                                                                                                                        'x-uid':
                                                                                                                                                          '3klghjyhn2e',
                                                                                                                                                        'x-async':
                                                                                                                                                          false,
                                                                                                                                                        'x-index': 1,
                                                                                                                                                      },
                                                                                                                                                    },
                                                                                                                                                  'x-uid':
                                                                                                                                                    'k9ck22tm51h',
                                                                                                                                                  'x-async':
                                                                                                                                                    false,
                                                                                                                                                },
                                                                                                                                            },
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                          'x-index': 1,
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    'm4wi2pzpr87',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 1,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          'x-uid':
                                                                                                                            'sp5w23qy3i1',
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 2,
                                                                                                                        },
                                                                                                                    },
                                                                                                                  'x-uid':
                                                                                                                    'oqz60xa1yfi',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                  'x-index': 1,
                                                                                                                },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'n1rdyer1njy',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      't0kqiyg4azb',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'hix2aljl42o',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'v4l4i2y2muy',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'r92l2b1ewpw',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'wlal3xrcd21',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'gy06o4bfvel',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-uid': 'rnp98kdp6i7',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'jydd6xqpmag',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '99xcv098sqb',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'ore0g08xym5',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'c4rlk8cyndy',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'auduflh6ir7',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '6lystaearad',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'xu14c7orxj9',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'uqa225n3ft0',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  kry6i1da0tj: {
                                    'x-uid': 'stbtydj2qmh',
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
                                                      scqusdl60dp: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          '56qqqtcv7sq': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              psqi07luu6x: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'general:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  resource: 'general',
                                                                  collection: 'general',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  s5yzffu11uz: {
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
                                                                          row_x1kzwaop93e: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              o61mnyb3cna: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  id: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'general.id',
                                                                                    'x-component-props': {},
                                                                                    'x-read-pretty': true,
                                                                                    'x-uid': '2o3igjsny73',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '24k5mv82ryg',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'cv0w2l9u3rz',
                                                                            'x-async': false,
                                                                          },
                                                                          x4lyvwpaszb: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              t0j05k5davx: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2oField0: {
                                                                                    'x-uid': '5m0bfy8diwb',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'general.m2oField0',
                                                                                    'x-component-props': {
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    properties: {
                                                                                      fzpkx5l8as7: {
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
                                                                                              '0o134mwdmzm': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  '7dxzwgyax59': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      id: {
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
                                                                                                          'm2oField1.id',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-read-pretty':
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'b7wd6150b6h',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'msf0aqn6h85',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '25a3ulhciro',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              '3m1ohstn0b8': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  sqtguwxadwu: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oField1: {
                                                                                                        'x-uid':
                                                                                                          'v2nrgm7uu51',
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
                                                                                                          'm2oField1.m2oField1',
                                                                                                        'x-component-props':
                                                                                                          {
                                                                                                            mode: 'Nester',
                                                                                                          },
                                                                                                        properties: {
                                                                                                          f963gxcp0uz: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'AssociationField.Nester',
                                                                                                            'x-index': 1,
                                                                                                            properties:
                                                                                                              {
                                                                                                                grid: {
                                                                                                                  _isJSONSchemaObject:
                                                                                                                    true,
                                                                                                                  version:
                                                                                                                    '2.0',
                                                                                                                  type: 'void',
                                                                                                                  'x-component':
                                                                                                                    'Grid',
                                                                                                                  'x-initializer':
                                                                                                                    'FormItemInitializers',
                                                                                                                  properties:
                                                                                                                    {
                                                                                                                      '2eg7xlliyk0':
                                                                                                                        {
                                                                                                                          _isJSONSchemaObject:
                                                                                                                            true,
                                                                                                                          version:
                                                                                                                            '2.0',
                                                                                                                          type: 'void',
                                                                                                                          'x-component':
                                                                                                                            'Grid.Row',
                                                                                                                          properties:
                                                                                                                            {
                                                                                                                              '4d008vpig0f':
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Col',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      id: {
                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                          true,
                                                                                                                                        version:
                                                                                                                                          '2.0',
                                                                                                                                        type: 'string',
                                                                                                                                        'x-designer':
                                                                                                                                          'FormItem.Designer',
                                                                                                                                        'x-component':
                                                                                                                                          'CollectionField',
                                                                                                                                        'x-decorator':
                                                                                                                                          'FormItem',
                                                                                                                                        'x-collection-field':
                                                                                                                                          'm2oField2.id',
                                                                                                                                        'x-component-props':
                                                                                                                                          {},
                                                                                                                                        'x-read-pretty':
                                                                                                                                          true,
                                                                                                                                        'x-uid':
                                                                                                                                          'eqh4uwwrdb2',
                                                                                                                                        'x-async':
                                                                                                                                          false,
                                                                                                                                        'x-index': 1,
                                                                                                                                      },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    'gc19ujdgy5h',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 1,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          'x-uid':
                                                                                                                            'yykls3t9pug',
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 1,
                                                                                                                        },
                                                                                                                      kzbf5h1vbqw:
                                                                                                                        {
                                                                                                                          _isJSONSchemaObject:
                                                                                                                            true,
                                                                                                                          version:
                                                                                                                            '2.0',
                                                                                                                          type: 'void',
                                                                                                                          'x-component':
                                                                                                                            'Grid.Row',
                                                                                                                          properties:
                                                                                                                            {
                                                                                                                              f2v2e9t8juk:
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Col',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      m2oField2:
                                                                                                                                        {
                                                                                                                                          'x-uid':
                                                                                                                                            '17ecpej7sb9',
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'string',
                                                                                                                                          'x-designer':
                                                                                                                                            'FormItem.Designer',
                                                                                                                                          'x-component':
                                                                                                                                            'CollectionField',
                                                                                                                                          'x-decorator':
                                                                                                                                            'FormItem',
                                                                                                                                          'x-collection-field':
                                                                                                                                            'm2oField2.m2oField2',
                                                                                                                                          'x-component-props':
                                                                                                                                            {
                                                                                                                                              mode: 'Nester',
                                                                                                                                            },
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              yp3xjukzbmo:
                                                                                                                                                {
                                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                                    true,
                                                                                                                                                  version:
                                                                                                                                                    '2.0',
                                                                                                                                                  type: 'void',
                                                                                                                                                  'x-component':
                                                                                                                                                    'AssociationField.Nester',
                                                                                                                                                  'x-index': 1,
                                                                                                                                                  properties:
                                                                                                                                                    {
                                                                                                                                                      grid: {
                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                          true,
                                                                                                                                                        version:
                                                                                                                                                          '2.0',
                                                                                                                                                        type: 'void',
                                                                                                                                                        'x-component':
                                                                                                                                                          'Grid',
                                                                                                                                                        'x-initializer':
                                                                                                                                                          'FormItemInitializers',
                                                                                                                                                        properties:
                                                                                                                                                          {
                                                                                                                                                            wca260ji2ih:
                                                                                                                                                              {
                                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                                  true,
                                                                                                                                                                version:
                                                                                                                                                                  '2.0',
                                                                                                                                                                type: 'void',
                                                                                                                                                                'x-component':
                                                                                                                                                                  'Grid.Row',
                                                                                                                                                                properties:
                                                                                                                                                                  {
                                                                                                                                                                    j19p1r016pj:
                                                                                                                                                                      {
                                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                                          true,
                                                                                                                                                                        version:
                                                                                                                                                                          '2.0',
                                                                                                                                                                        type: 'void',
                                                                                                                                                                        'x-component':
                                                                                                                                                                          'Grid.Col',
                                                                                                                                                                        properties:
                                                                                                                                                                          {
                                                                                                                                                                            id: {
                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                true,
                                                                                                                                                                              version:
                                                                                                                                                                                '2.0',
                                                                                                                                                                              type: 'string',
                                                                                                                                                                              'x-designer':
                                                                                                                                                                                'FormItem.Designer',
                                                                                                                                                                              'x-component':
                                                                                                                                                                                'CollectionField',
                                                                                                                                                                              'x-decorator':
                                                                                                                                                                                'FormItem',
                                                                                                                                                                              'x-collection-field':
                                                                                                                                                                                'm2oField3.id',
                                                                                                                                                                              'x-component-props':
                                                                                                                                                                                {},
                                                                                                                                                                              'x-read-pretty':
                                                                                                                                                                                true,
                                                                                                                                                                              'x-uid':
                                                                                                                                                                                'yjbtit5eri9',
                                                                                                                                                                              'x-async':
                                                                                                                                                                                false,
                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                            },
                                                                                                                                                                          },
                                                                                                                                                                        'x-uid':
                                                                                                                                                                          '2wj9t16qv49',
                                                                                                                                                                        'x-async':
                                                                                                                                                                          false,
                                                                                                                                                                        'x-index': 1,
                                                                                                                                                                      },
                                                                                                                                                                  },
                                                                                                                                                                'x-uid':
                                                                                                                                                                  'wv2eouh5o38',
                                                                                                                                                                'x-async':
                                                                                                                                                                  false,
                                                                                                                                                                'x-index': 1,
                                                                                                                                                              },
                                                                                                                                                            ihzeejjyski:
                                                                                                                                                              {
                                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                                  true,
                                                                                                                                                                version:
                                                                                                                                                                  '2.0',
                                                                                                                                                                type: 'void',
                                                                                                                                                                'x-component':
                                                                                                                                                                  'Grid.Row',
                                                                                                                                                                properties:
                                                                                                                                                                  {
                                                                                                                                                                    nuwqnjguqtc:
                                                                                                                                                                      {
                                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                                          true,
                                                                                                                                                                        version:
                                                                                                                                                                          '2.0',
                                                                                                                                                                        type: 'void',
                                                                                                                                                                        'x-component':
                                                                                                                                                                          'Grid.Col',
                                                                                                                                                                        properties:
                                                                                                                                                                          {
                                                                                                                                                                            m2oField3:
                                                                                                                                                                              {
                                                                                                                                                                                'x-uid':
                                                                                                                                                                                  '2bkbiayqed2',
                                                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                                                  true,
                                                                                                                                                                                version:
                                                                                                                                                                                  '2.0',
                                                                                                                                                                                type: 'string',
                                                                                                                                                                                'x-designer':
                                                                                                                                                                                  'FormItem.Designer',
                                                                                                                                                                                'x-component':
                                                                                                                                                                                  'CollectionField',
                                                                                                                                                                                'x-decorator':
                                                                                                                                                                                  'FormItem',
                                                                                                                                                                                'x-collection-field':
                                                                                                                                                                                  'm2oField3.m2oField3',
                                                                                                                                                                                'x-component-props':
                                                                                                                                                                                  {
                                                                                                                                                                                    mode: 'Select',
                                                                                                                                                                                  },
                                                                                                                                                                                properties:
                                                                                                                                                                                  {
                                                                                                                                                                                    j1l0upv47vn:
                                                                                                                                                                                      {
                                                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                                                          true,
                                                                                                                                                                                        version:
                                                                                                                                                                                          '2.0',
                                                                                                                                                                                        type: 'void',
                                                                                                                                                                                        'x-component':
                                                                                                                                                                                          'AssociationField.Nester',
                                                                                                                                                                                        'x-index': 1,
                                                                                                                                                                                        properties:
                                                                                                                                                                                          {
                                                                                                                                                                                            grid: {
                                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                                true,
                                                                                                                                                                                              version:
                                                                                                                                                                                                '2.0',
                                                                                                                                                                                              type: 'void',
                                                                                                                                                                                              'x-component':
                                                                                                                                                                                                'Grid',
                                                                                                                                                                                              'x-initializer':
                                                                                                                                                                                                'FormItemInitializers',
                                                                                                                                                                                              properties:
                                                                                                                                                                                                {
                                                                                                                                                                                                  '9xq8mnnzyrw':
                                                                                                                                                                                                    {
                                                                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                                                                        true,
                                                                                                                                                                                                      version:
                                                                                                                                                                                                        '2.0',
                                                                                                                                                                                                      type: 'void',
                                                                                                                                                                                                      'x-component':
                                                                                                                                                                                                        'Grid.Row',
                                                                                                                                                                                                      properties:
                                                                                                                                                                                                        {
                                                                                                                                                                                                          nbqmql24khd:
                                                                                                                                                                                                            {
                                                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                                                true,
                                                                                                                                                                                                              version:
                                                                                                                                                                                                                '2.0',
                                                                                                                                                                                                              type: 'void',
                                                                                                                                                                                                              'x-component':
                                                                                                                                                                                                                'Grid.Col',
                                                                                                                                                                                                              properties:
                                                                                                                                                                                                                {
                                                                                                                                                                                                                  id: {
                                                                                                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                                                                                                      true,
                                                                                                                                                                                                                    version:
                                                                                                                                                                                                                      '2.0',
                                                                                                                                                                                                                    type: 'string',
                                                                                                                                                                                                                    'x-designer':
                                                                                                                                                                                                                      'FormItem.Designer',
                                                                                                                                                                                                                    'x-component':
                                                                                                                                                                                                                      'CollectionField',
                                                                                                                                                                                                                    'x-decorator':
                                                                                                                                                                                                                      'FormItem',
                                                                                                                                                                                                                    'x-collection-field':
                                                                                                                                                                                                                      'users.id',
                                                                                                                                                                                                                    'x-component-props':
                                                                                                                                                                                                                      {},
                                                                                                                                                                                                                    'x-read-pretty':
                                                                                                                                                                                                                      true,
                                                                                                                                                                                                                    'x-uid':
                                                                                                                                                                                                                      'rnkwrneb7dy',
                                                                                                                                                                                                                    'x-async':
                                                                                                                                                                                                                      false,
                                                                                                                                                                                                                    'x-index': 1,
                                                                                                                                                                                                                  },
                                                                                                                                                                                                                },
                                                                                                                                                                                                              'x-uid':
                                                                                                                                                                                                                'c5v4i42w1i1',
                                                                                                                                                                                                              'x-async':
                                                                                                                                                                                                                false,
                                                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                                                            },
                                                                                                                                                                                                        },
                                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                                        'lgxcefydtp0',
                                                                                                                                                                                                      'x-async':
                                                                                                                                                                                                        false,
                                                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                                                    },
                                                                                                                                                                                                },
                                                                                                                                                                                              'x-uid':
                                                                                                                                                                                                'w0idtr6dwa4',
                                                                                                                                                                                              'x-async':
                                                                                                                                                                                                false,
                                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                                            },
                                                                                                                                                                                          },
                                                                                                                                                                                        'x-uid':
                                                                                                                                                                                          'a09ma68c41f',
                                                                                                                                                                                        'x-async':
                                                                                                                                                                                          false,
                                                                                                                                                                                      },
                                                                                                                                                                                  },
                                                                                                                                                                                'x-async':
                                                                                                                                                                                  false,
                                                                                                                                                                                'x-index': 1,
                                                                                                                                                                              },
                                                                                                                                                                          },
                                                                                                                                                                        'x-uid':
                                                                                                                                                                          'qe3hnw9xe6e',
                                                                                                                                                                        'x-async':
                                                                                                                                                                          false,
                                                                                                                                                                        'x-index': 1,
                                                                                                                                                                      },
                                                                                                                                                                  },
                                                                                                                                                                'x-uid':
                                                                                                                                                                  'o5zh8m5qx6a',
                                                                                                                                                                'x-async':
                                                                                                                                                                  false,
                                                                                                                                                                'x-index': 2,
                                                                                                                                                              },
                                                                                                                                                          },
                                                                                                                                                        'x-uid':
                                                                                                                                                          'nigeia3gqlm',
                                                                                                                                                        'x-async':
                                                                                                                                                          false,
                                                                                                                                                        'x-index': 1,
                                                                                                                                                      },
                                                                                                                                                    },
                                                                                                                                                  'x-uid':
                                                                                                                                                    'rz5kiy9vh12',
                                                                                                                                                  'x-async':
                                                                                                                                                    false,
                                                                                                                                                },
                                                                                                                                            },
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                          'x-index': 1,
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    'hkjnncj6dhj',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 1,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          'x-uid':
                                                                                                                            'l4zkvdlmobo',
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 2,
                                                                                                                        },
                                                                                                                    },
                                                                                                                  'x-uid':
                                                                                                                    'xw4i68d64mt',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                  'x-index': 1,
                                                                                                                },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'z3bm22to5yl',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'fh4n239d4rs',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '4csuyzs8wi1',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'g2flsox1luw',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'xk8wl43zd39',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'hcopuvnktmu',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '3zge5v7fs2s',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-uid': 'c7n7fepc8u6',
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
                                                                        properties: {
                                                                          '31gyn2416at': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            title: '{{ t("Submit") }}',
                                                                            'x-action': 'submit',
                                                                            'x-component': 'Action',
                                                                            'x-designer': 'Action.Designer',
                                                                            'x-component-props': {
                                                                              type: 'primary',
                                                                              htmlType: 'submit',
                                                                              useProps: '{{ useUpdateActionProps }}',
                                                                            },
                                                                            'x-action-settings': {
                                                                              triggerWorkflows: [],
                                                                            },
                                                                            type: 'void',
                                                                            'x-uid': 'sp95wa30evt',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'yjo21wnu0iq',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'o18o45z7gay',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '8alup4gy395',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'l8qffi5w837',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '1oc31zgwq73',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'f7srqre9q5e',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'pwvj69kkqfc',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'rlwyma5eyi2',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '2lhkaanjkzb',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': 'zf9v442mpn3',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ritxqjy6csk',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'aysju5p3ddr',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'xo84doqcapz',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '4aa7kaxeojd',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'zetvg5woo4f',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'x4r6648qveh',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '9e7bblze4m7',
    'x-async': true,
    'x-index': 1,
  },
};

export const testingLazyLoadingOfAssociationFieldsOfSubTable: PageConfig = {
  collections: generalWithMultiLevelRelationshipFields,
  pageSchema: {},
};
