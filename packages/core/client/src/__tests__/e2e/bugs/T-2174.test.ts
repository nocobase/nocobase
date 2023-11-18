import { expect, test } from '@nocobase/test/client';

const config = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      x9ersztdq7x: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          ppgwx2drpng: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              c25gfj884oe: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  urmc26btvb5: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'test2174:list',
                    'x-decorator-props': {
                      collection: 'test2174',
                      resource: 'test2174',
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
                    'x-index': 1,
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
                        'x-index': 1,
                        'x-uid': '7wfu81uqxox',
                        'x-async': false,
                      },
                      yxgybgmfhkp: {
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
                        'x-index': 2,
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
                            'x-index': 1,
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
                                'x-index': 1,
                                properties: {
                                  r51kgwrhpgd: {
                                    'x-uid': 'udzm8hggmmb',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View details',
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
                                    'x-index': 1,
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'RecordBlockInitializers',
                                                    'x-index': 1,
                                                    properties: {
                                                      g8w7wq09bgo: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          '42t1ais26x8': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              zmq6hmh2i3a: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'test2174.f_q32e4ieq49n:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: null,
                                                                  resource: 'test2174.f_q32e4ieq49n',
                                                                  collection: 'test2174',
                                                                  association: 'test2174.f_q32e4ieq49n',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                'x-index': 1,
                                                                properties: {
                                                                  qii0gw1cb8e: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'FormItemInitializers',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          s3hhb0ohnv1: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              t2qtgv250s0: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  singleSelect: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'test2174.singleSelect',
                                                                                    'x-component-props': {
                                                                                      style: {
                                                                                        width: '100%',
                                                                                      },
                                                                                    },
                                                                                    'x-index': 1,
                                                                                    'x-uid': '75ls3qlq3kw',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'ndb8zhrxgq0',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': '14q94mijyx4',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '6vfyrsrkw29',
                                                                        'x-async': false,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'CreateFormActionInitializers',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-index': 2,
                                                                        properties: {
                                                                          afuxokt3osc: {
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
                                                                            'x-index': 1,
                                                                            'x-uid': '6idd8u0fs5v',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '8xm66k2wcbq',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'ia7qdocnj0k',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'ai78ycshc04',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'gipnqnxa7c7',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': '4fztm3s6pqr',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'yiwh3chdjzg',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'mar9ww8zdd6',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': '29brl1obftp',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'r4qbds05tcz',
                                        'x-async': false,
                                      },
                                    },
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'hp7glbaipmc',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'k9u1fta4jdq',
                            'x-async': false,
                          },
                          x6soi4xw3yn: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-index': 2,
                            properties: {
                              singleSelect: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'test2174.singleSelect',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  style: {
                                    width: '100%',
                                  },
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                default: 'np55dbbny0e',
                                'x-index': 1,
                                'x-uid': 'ots1wvv436n',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'yx4mdriq3jp',
                            'x-async': false,
                          },
                          aoj0myt8kgn: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-index': 3,
                            properties: {
                              f_q32e4ieq49n: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'test2174.f_q32e4ieq49n',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                  size: 'small',
                                  fieldNames: {
                                    label: 'singleSelect',
                                    value: 'id',
                                  },
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-index': 1,
                                properties: {
                                  ony7hpl5247: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'AssociationField.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-index': 1,
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'TabPaneInitializers',
                                        'x-index': 1,
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-index': 1,
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'RecordBlockInitializers',
                                                'x-index': 1,
                                                'x-uid': 'roog7uz0d2o',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'x05lq9x1n0n',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'hrymp5hthg3',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'ujkf9096qwq',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '02kpdjz33yd',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'e366r5cz2cv',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'wkdjjugn3l8',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'n3f07077krt',
                    'x-async': false,
                  },
                },
                'x-uid': 'i920mrykzkp',
                'x-async': false,
              },
            },
            'x-uid': '8a5n45kb55h',
            'x-async': false,
          },
        },
        'x-uid': 'wcobb00rn5y',
        'x-async': false,
      },
    },
    'x-uid': 'pfr9jap0zsf',
    'x-async': true,
  },
  collections: [
    {
      name: 'test2174',
      title: 'Test',
      fields: [
        {
          name: 'f_lkqy3eh4ag7',
          interface: 'integer',
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: 'f_lkqy3eh4ag7',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          name: 'f_rathx54cqpy',
          interface: 'integer',
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: 'f_rathx54cqpy',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          name: 'singleSelect',
          interface: 'select',
          uiSchema: {
            enum: [
              {
                value: 'np55dbbny0e',
                label: 'option1',
              },
              {
                value: 'zxteco8rjfc',
                label: 'option2',
              },
              {
                value: 'p7pi40zd91q',
                label: 'option3',
              },
            ],
            type: 'string',
            'x-component': 'Select',
            title: 'Single select',
          },
        },
        {
          name: 'f_q32e4ieq49n',
          interface: 'o2m',
          foreignKey: 'f_rathx54cqpy',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: true,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
            title: 'One to many',
          },
          target: 'test2174',
          targetKey: 'id',
          sourceKey: 'id',
        },
      ],
    },
  ],
};

// fix https://nocobase.height.app/T-2174
test('BUG: should show default value option', async ({ page, mockPage, mockRecord }) => {
  const nocoPage = await mockPage(config).waitForInit();
  await mockRecord('test2174');
  await nocoPage.goto();

  await page.getByLabel('action-Action.Link-View details-view-test2174-table-0').click();
  await page.getByLabel('block-item-CollectionField-test2174-form-test2174.singleSelect-Single select').hover();
  await page
    .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-test2174-test2174.singleSelect')
    .hover();

  await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
});
