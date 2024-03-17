import { general, PageConfig } from '@nocobase/test/e2e';
/**
 * 页面中有一个空的 Table 区块，并且配有字段:普通字段和关系字段
 */
export const oneTableBlock: PageConfig = {
  collections: general,
  pageSchema: {
    type: 'void',
    version: '2.0',
    'x-component': 'Page',
    _isJSONSchemaObject: true,
    properties: {
      gykihrjk18u: {
        type: 'void',
        version: '2.0',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        _isJSONSchemaObject: true,
        properties: {
          hxf5h572bwc: {
            type: 'void',
            version: '2.0',
            'x-component': 'Grid.Row',
            _isJSONSchemaObject: true,
            properties: {
              x0n8tm56iqj: {
                type: 'void',
                version: '2.0',
                'x-component': 'Grid.Col',
                _isJSONSchemaObject: true,
                properties: {
                  l4x3frse193: {
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
                      dataSource: 'main',
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
                          bvmen0z04i2: {
                            type: 'void',
                            title: "{{t('Add new')}}",
                            version: '2.0',
                            'x-align': 'right',
                            'x-action': 'create',
                            'x-designer': 'Action.Designer',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action': 'create',
                            'x-component-props': {
                              icon: 'PlusOutlined',
                              type: 'primary',
                              openMode: 'drawer',
                              component: 'CreateRecordAction',
                            },
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            _isJSONSchemaObject: true,
                            properties: {
                              drawer: {
                                type: 'void',
                                title: '{{ t("Add record") }}',
                                version: '2.0',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                _isJSONSchemaObject: true,
                                properties: {
                                  tabs: {
                                    type: 'void',
                                    version: '2.0',
                                    'x-component': 'Tabs',
                                    'x-initializer': 'TabPaneInitializersForCreateFormBlock',
                                    'x-component-props': {},
                                    _isJSONSchemaObject: true,
                                    properties: {
                                      tab1: {
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        version: '2.0',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component': 'Tabs.TabPane',
                                        'x-component-props': {},
                                        _isJSONSchemaObject: true,
                                        properties: {
                                          grid: {
                                            type: 'void',
                                            version: '2.0',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            _isJSONSchemaObject: true,
                                            properties: {
                                              f3q7xmyiyl4: {
                                                type: 'void',
                                                version: '2.0',
                                                'x-component': 'Grid.Row',
                                                _isJSONSchemaObject: true,
                                                properties: {
                                                  rffotw9jklc: {
                                                    type: 'void',
                                                    version: '2.0',
                                                    'x-component': 'Grid.Col',
                                                    _isJSONSchemaObject: true,
                                                    properties: {
                                                      d1s558c7cb4: {
                                                        type: 'void',
                                                        version: '2.0',
                                                        'x-designer': 'FormV2.Designer',
                                                        'x-component': 'CardItem',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-acl-action': 'general:create',
                                                        'x-component-props': {},
                                                        'x-decorator-props': {
                                                          resource: 'general',
                                                          collection: 'general',
                                                        },
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        _isJSONSchemaObject: true,
                                                        properties: {
                                                          lrygnjl6p4s: {
                                                            type: 'void',
                                                            version: '2.0',
                                                            'x-component': 'FormV2',
                                                            'x-component-props': {
                                                              useProps: '{{ useFormBlockProps }}',
                                                            },
                                                            _isJSONSchemaObject: true,
                                                            properties: {
                                                              grid: {
                                                                type: 'void',
                                                                version: '2.0',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'form:configureFields',
                                                                _isJSONSchemaObject: true,
                                                                properties: {
                                                                  ddz3kqt5kpf: {
                                                                    type: 'void',
                                                                    version: '2.0',
                                                                    'x-component': 'Grid.Row',
                                                                    _isJSONSchemaObject: true,
                                                                    properties: {
                                                                      vll7e5c0lh4: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'Grid.Col',
                                                                        _isJSONSchemaObject: true,
                                                                        properties: {
                                                                          singleLineText: {
                                                                            type: 'string',
                                                                            version: '2.0',
                                                                            'x-designer': 'FormItem.Designer',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-component-props': {},
                                                                            'x-collection-field':
                                                                              'general.singleLineText',
                                                                            _isJSONSchemaObject: true,
                                                                            'x-uid': '3pkx27o6m3j',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '8j6aujpq65v',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '4r1c8y0e06s',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  tb917i47w36: {
                                                                    type: 'void',
                                                                    version: '2.0',
                                                                    'x-component': 'Grid.Row',
                                                                    _isJSONSchemaObject: true,
                                                                    properties: {
                                                                      gtfi08wzouz: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'Grid.Col',
                                                                        _isJSONSchemaObject: true,
                                                                        properties: {
                                                                          oneToOneBelongsTo: {
                                                                            type: 'string',
                                                                            'x-uid': 'pwo35zuqr1v',
                                                                            default: null,
                                                                            version: '2.0',
                                                                            'x-designer': 'FormItem.Designer',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-component-props': {
                                                                              mode: 'Nester',
                                                                            },
                                                                            'x-collection-field':
                                                                              'general.oneToOneBelongsTo',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              dkch0rg951t: {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-index': 1,
                                                                                'x-component':
                                                                                  'AssociationField.Nester',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  grid: {
                                                                                    type: 'void',
                                                                                    version: '2.0',
                                                                                    'x-component': 'Grid',
                                                                                    'x-initializer':
                                                                                      'form:configureFields',
                                                                                    _isJSONSchemaObject: true,
                                                                                    properties: {
                                                                                      yhxqnl03mak: {
                                                                                        type: 'void',
                                                                                        version: '2.0',
                                                                                        'x-component': 'Grid.Row',
                                                                                        _isJSONSchemaObject: true,
                                                                                        properties: {
                                                                                          l7iokbg3wcs: {
                                                                                            type: 'void',
                                                                                            version: '2.0',
                                                                                            'x-component': 'Grid.Col',
                                                                                            _isJSONSchemaObject: true,
                                                                                            properties: {
                                                                                              nickname: {
                                                                                                type: 'string',
                                                                                                version: '2.0',
                                                                                                'x-designer':
                                                                                                  'FormItem.Designer',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-component-props': {},
                                                                                                'x-collection-field':
                                                                                                  'users.nickname',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                'x-uid': '4vyr92lhz7f',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '4wzfdz6xrgs',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'aen7e2woz46',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                      '54ayk66amem': {
                                                                                        type: 'void',
                                                                                        version: '2.0',
                                                                                        'x-component': 'Grid.Row',
                                                                                        _isJSONSchemaObject: true,
                                                                                        properties: {
                                                                                          hfl137d5gx0: {
                                                                                            type: 'void',
                                                                                            version: '2.0',
                                                                                            'x-component': 'Grid.Col',
                                                                                            _isJSONSchemaObject: true,
                                                                                            properties: {
                                                                                              username: {
                                                                                                type: 'string',
                                                                                                version: '2.0',
                                                                                                'x-designer':
                                                                                                  'FormItem.Designer',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-component-props': {},
                                                                                                'x-collection-field':
                                                                                                  'users.username',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                'x-uid': 'eotcjdflbgi',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'rwbh7lm3bma',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'o319tmva8fg',
                                                                                        'x-async': false,
                                                                                        'x-index': 2,
                                                                                      },
                                                                                      xhbqfbveyp0: {
                                                                                        type: 'void',
                                                                                        version: '2.0',
                                                                                        'x-component': 'Grid.Row',
                                                                                        _isJSONSchemaObject: true,
                                                                                        properties: {
                                                                                          wvypx99ojj0: {
                                                                                            type: 'void',
                                                                                            version: '2.0',
                                                                                            'x-component': 'Grid.Col',
                                                                                            _isJSONSchemaObject: true,
                                                                                            properties: {
                                                                                              email: {
                                                                                                type: 'string',
                                                                                                version: '2.0',
                                                                                                'x-designer':
                                                                                                  'FormItem.Designer',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-component-props': {},
                                                                                                'x-collection-field':
                                                                                                  'users.email',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                'x-uid': 'rjfub70uv31',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '1kt5y2aijem',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '14w4id6gxs5',
                                                                                        'x-async': false,
                                                                                        'x-index': 3,
                                                                                      },
                                                                                      '84ul6m1kqzv': {
                                                                                        type: 'void',
                                                                                        version: '2.0',
                                                                                        'x-component': 'Grid.Row',
                                                                                        _isJSONSchemaObject: true,
                                                                                        properties: {
                                                                                          '3h0ra3hwkr0': {
                                                                                            type: 'void',
                                                                                            version: '2.0',
                                                                                            'x-component': 'Grid.Col',
                                                                                            _isJSONSchemaObject: true,
                                                                                            properties: {
                                                                                              phone: {
                                                                                                type: 'string',
                                                                                                version: '2.0',
                                                                                                'x-designer':
                                                                                                  'FormItem.Designer',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-component-props': {},
                                                                                                'x-collection-field':
                                                                                                  'users.phone',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                'x-uid': 'kw641beat5d',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '6m93zxc1vdv',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'ty81vpz3o0n',
                                                                                        'x-async': false,
                                                                                        'x-index': 4,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'ownvko3myu2',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'twrluj9mh14',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'cllv6lhjq59',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'hshnjrfhnko',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'x8dr1tz2kot',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              actions: {
                                                                type: 'void',
                                                                version: '2.0',
                                                                'x-component': 'ActionBar',
                                                                'x-initializer': 'createForm:configureActions',
                                                                'x-component-props': {
                                                                  style: {
                                                                    marginTop: 24,
                                                                  },
                                                                  layout: 'one-column',
                                                                },
                                                                _isJSONSchemaObject: true,
                                                                'x-uid': '3vs5hzhb19b',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'bg7nbf4kpfo',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'g3gu5lo47a2',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'om69zcduw9q',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'twiigjtop0c',
                                                'x-async': false,
                                                'x-index': 2,
                                              },
                                            },
                                            'x-uid': 'eje4a2zww7g',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'uhk88drsltl',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'uqi3cyst86b',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'xe4hysl00cl',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '0nrtg8p8xn2',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '102mxbpes1i': {
                            type: 'void',
                            title: '{{ t("Delete") }}',
                            version: '2.0',
                            'x-align': 'right',
                            'x-action': 'destroy',
                            'x-designer': 'Action.Designer',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action': 'general:destroy',
                            'x-component-props': {
                              icon: 'DeleteOutlined',
                              confirm: {
                                title: "{{t('Delete record')}}",
                                content: "{{t('Are you sure you want to delete it?')}}",
                              },
                              useProps: '{{ useBulkDestroyActionProps }}',
                            },
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            _isJSONSchemaObject: true,
                            'x-uid': '2xl3c4hzknj',
                            'x-async': false,
                            'x-index': 2,
                          },
                          a6foojqjkxz: {
                            type: 'void',
                            title: '{{ t("Export") }}',
                            version: '2.0',
                            'x-align': 'right',
                            'x-action': 'export',
                            'x-designer': 'ExportDesigner',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-action-settings': {
                              exportSettings: [
                                {
                                  dataIndex: ['id'],
                                },
                                {
                                  dataIndex: ['nickname'],
                                },
                                {
                                  dataIndex: ['username'],
                                },
                                {
                                  dataIndex: ['email'],
                                },
                                {
                                  dataIndex: ['phone'],
                                },
                                {
                                  dataIndex: ['password'],
                                },
                              ],
                            },
                            'x-component-props': {
                              icon: 'clouddownloadoutlined',
                              useProps: '{{ useExportAction }}',
                            },
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            _isJSONSchemaObject: true,
                            'x-uid': 'ec384gccvkd',
                            'x-async': false,
                            'x-index': 1,
                          },
                          ub6x23zylo0: {
                            type: 'void',
                            title: '{{ t("Import") }}',
                            version: '2.0',
                            'x-align': 'right',
                            'x-action': 'importXlsx',
                            'x-designer': 'ImportDesigner',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action': 'importXlsx',
                            'x-action-settings': {
                              importSettings: {
                                explain: '',
                                importColumns: [
                                  {
                                    dataIndex: ['nickname'],
                                  },
                                  {
                                    dataIndex: ['username'],
                                  },
                                  {
                                    dataIndex: ['email'],
                                  },
                                  {
                                    dataIndex: ['phone'],
                                  },
                                  {
                                    dataIndex: ['password'],
                                  },
                                ],
                              },
                            },
                            'x-component-props': {
                              icon: 'CloudUploadOutlined',
                              openMode: 'modal',
                            },
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            _isJSONSchemaObject: true,
                            properties: {
                              modal: {
                                type: 'void',
                                title: '{{ t("Import Data", {ns: "import" }) }}',
                                version: '2.0',
                                'x-component': 'Action.Container',
                                'x-decorator': 'Form',
                                'x-component-props': {
                                  width: '50%',
                                  className: 'css-rg76rb',
                                },
                                _isJSONSchemaObject: true,
                                properties: {
                                  formLayout: {
                                    type: 'void',
                                    version: '2.0',
                                    'x-component': 'FormLayout',
                                    _isJSONSchemaObject: true,
                                    properties: {
                                      download: {
                                        type: 'void',
                                        title: '{{ t("Step 1: Download template", {ns: "import" }) }}',
                                        version: '2.0',
                                        'x-component': 'FormItem',
                                        'x-acl-ignore': true,
                                        _isJSONSchemaObject: true,
                                        properties: {
                                          tip: {
                                            type: 'void',
                                            version: '2.0',
                                            'x-editable': false,
                                            'x-component': 'Markdown.Void',
                                            'x-component-props': {
                                              style: {
                                                color: 'var(--colorText)',
                                                border: '1px solid var(--colorInfoBorder)',
                                                padding: 'var(--paddingContentVerticalSM)',
                                                marginBottom: 'var(--marginSM)',
                                                backgroundColor: 'var(--colorInfoBg)',
                                              },
                                              content: '{{ t("Download tip", {ns: "import" }) }}',
                                            },
                                            _isJSONSchemaObject: true,
                                            'x-uid': 'p47ou5drhji',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                          downloadAction: {
                                            type: 'void',
                                            title: '{{ t("Download template", {ns: "import" }) }}',
                                            version: '2.0',
                                            'x-component': 'Action',
                                            'x-component-props': {
                                              className: 'css-mdli8g',
                                              useAction: '{{ useDownloadXlsxTemplateAction }}',
                                            },
                                            _isJSONSchemaObject: true,
                                            'x-uid': 'dbxz3d2ujxa',
                                            'x-async': false,
                                            'x-index': 2,
                                          },
                                        },
                                        'x-uid': 'd6tpu2s3eiu',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                      upload: {
                                        type: 'array',
                                        title: '{{ t("Step 2: Upload Excel", {ns: "import" }) }}',
                                        version: '2.0',
                                        'x-component': 'Upload.Dragger',
                                        'x-decorator': 'FormItem',
                                        'x-validator': '{{ uploadValidator }}',
                                        'x-acl-ignore': true,
                                        'x-component-props': {
                                          action: '',
                                          height: '150px',
                                          tipContent: '{{ t("Upload placeholder", {ns: "import" }) }}',
                                          beforeUpload: '{{ beforeUploadHandler }}',
                                        },
                                        _isJSONSchemaObject: true,
                                        'x-uid': 'bqe1cf71x2a',
                                        'x-async': false,
                                        'x-index': 2,
                                      },
                                    },
                                    'x-uid': 'ub1gnhd3erd',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  footer: {
                                    version: '2.0',
                                    'x-component': 'Action.Container.Footer',
                                    'x-component-props': {},
                                    _isJSONSchemaObject: true,
                                    properties: {
                                      actions: {
                                        type: 'void',
                                        version: '2.0',
                                        'x-component': 'ActionBar',
                                        'x-component-props': {},
                                        _isJSONSchemaObject: true,
                                        properties: {
                                          cancel: {
                                            type: 'void',
                                            title: '{{ t("Cancel") }}',
                                            version: '2.0',
                                            'x-component': 'Action',
                                            'x-component-props': {
                                              useAction: '{{ cm.useCancelAction }}',
                                            },
                                            _isJSONSchemaObject: true,
                                            'x-uid': 'c6fy1agooio',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                          startImport: {
                                            type: 'void',
                                            title: '{{ t("Start import", {ns: "import" }) }}',
                                            version: '2.0',
                                            'x-component': 'Action',
                                            'x-reactions': {
                                              fulfill: {
                                                run: 'validateUpload($form, $self, $deps)',
                                              },
                                              dependencies: ['upload'],
                                            },
                                            'x-component-props': {
                                              type: 'primary',
                                              htmlType: 'submit',
                                              useAction: '{{ useImportStartAction }}',
                                            },
                                            _isJSONSchemaObject: true,
                                            'x-uid': 'fbe5njghnvp',
                                            'x-async': false,
                                            'x-index': 2,
                                          },
                                        },
                                        'x-uid': 'nj5w0gbzrsa',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'a9qjj5eotkw',
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': 'as8dekuon05',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '6l46l104rnj',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'umw2wrvyo28',
                        'x-async': false,
                        'x-index': 1,
                      },
                      nuqg6tj5dqw: {
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
                            'x-uid': 'swmh4uwsmwa',
                            version: '2.0',
                            'x-designer': 'TableV2.ActionColumnDesigner',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-initializer': 'table:configureItemActions',
                            'x-action-column': 'actions',
                            'x-component-props': {
                              width: 400,
                            },
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
                                properties: {
                                  rp84v9dau96: {
                                    type: 'void',
                                    title: '{{ t("Edit") }}',
                                    version: '2.0',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-component-props': {
                                      icon: 'EditOutlined',
                                      openMode: 'drawer',
                                    },
                                    _isJSONSchemaObject: true,
                                    properties: {
                                      drawer: {
                                        type: 'void',
                                        title: '{{ t("Edit record") }}',
                                        version: '2.0',
                                        'x-component': 'Action.Container',
                                        'x-component-props': {
                                          className: 'nb-action-popup',
                                        },
                                        _isJSONSchemaObject: true,
                                        properties: {
                                          tabs: {
                                            type: 'void',
                                            version: '2.0',
                                            'x-component': 'Tabs',
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-component-props': {},
                                            _isJSONSchemaObject: true,
                                            properties: {
                                              tab1: {
                                                type: 'void',
                                                title: '{{t("Edit")}}',
                                                version: '2.0',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component': 'Tabs.TabPane',
                                                'x-component-props': {},
                                                _isJSONSchemaObject: true,
                                                properties: {
                                                  grid: {
                                                    type: 'void',
                                                    version: '2.0',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    _isJSONSchemaObject: true,
                                                    properties: {
                                                      yyehsjjoo8e: {
                                                        type: 'void',
                                                        version: '2.0',
                                                        'x-component': 'Grid.Row',
                                                        _isJSONSchemaObject: true,
                                                        properties: {
                                                          '1u81bmn26oh': {
                                                            type: 'void',
                                                            version: '2.0',
                                                            'x-component': 'Grid.Col',
                                                            _isJSONSchemaObject: true,
                                                            properties: {
                                                              dwoh5owg1mu: {
                                                                type: 'void',
                                                                version: '2.0',
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-acl-action': 'general:update',
                                                                'x-component-props': {},
                                                                'x-decorator-props': {
                                                                  action: 'get',
                                                                  resource: 'general',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  collection: 'general',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                _isJSONSchemaObject: true,
                                                                properties: {
                                                                  wf32dhpznsx: {
                                                                    type: 'void',
                                                                    version: '2.0',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    _isJSONSchemaObject: true,
                                                                    properties: {
                                                                      grid: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        _isJSONSchemaObject: true,
                                                                        properties: {
                                                                          q3s02k44o3o: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              krgq64hq2lt: {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  singleLineText: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'general.singleLineText',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'lwz9i3cxh3f',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'cpxxudpe5vv',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'i2kne4spc11',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          pv2y7i07nz1: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              e1m9i3ff9jw: {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  phone: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'general.phone',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': '4no4a66qmxx',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'psai5tibdu1',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'uqfbp8yft29',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                          xmkdit1yn3r: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              h6dfgswjl74: {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  email: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'general.email',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'ovxawxrhxu8',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '0xw7tlk4rel',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'q0yn43c6ur1',
                                                                            'x-async': false,
                                                                            'x-index': 3,
                                                                          },
                                                                          '8lw4jgskiyq': {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              z97j4k1g0hu: {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  number: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'general.number',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'ohw7tc69996',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '4xywmvuw07u',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'e8xld0n55s8',
                                                                            'x-async': false,
                                                                            'x-index': 4,
                                                                          },
                                                                        },
                                                                        'x-uid': '08amqmd1yyl',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      actions: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'ActionBar',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component-props': {
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                          layout: 'one-column',
                                                                        },
                                                                        _isJSONSchemaObject: true,
                                                                        properties: {
                                                                          jtq8q1sada2: {
                                                                            type: 'void',
                                                                            title: '{{ t("Submit") }}',
                                                                            version: '2.0',
                                                                            'x-action': 'submit',
                                                                            'x-designer': 'Action.Designer',
                                                                            'x-component': 'Action',
                                                                            'x-action-settings': {
                                                                              triggerWorkflows: [],
                                                                            },
                                                                            'x-component-props': {
                                                                              type: 'primary',
                                                                              htmlType: 'submit',
                                                                              useProps: '{{ useUpdateActionProps }}',
                                                                            },
                                                                            _isJSONSchemaObject: true,
                                                                            'x-uid': 'beaj4s0mglf',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'oqa2c44qmrv',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'rxt19fkl2mp',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '0mmejmfgnrq',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'jnufl16l10v',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'vjuo13pvot5',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'ef56p3ubs3z',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '86u3yngtvsp',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ywexcvyt332',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'xclkpf3cmus',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'y0elzxa5ckn',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  '4xs33evufma': {
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    version: '2.0',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-component-props': {
                                      openMode: 'drawer',
                                    },
                                    _isJSONSchemaObject: true,
                                    properties: {
                                      drawer: {
                                        type: 'void',
                                        title: '{{ t("View record") }}',
                                        version: '2.0',
                                        'x-component': 'Action.Container',
                                        'x-component-props': {
                                          className: 'nb-action-popup',
                                        },
                                        _isJSONSchemaObject: true,
                                        properties: {
                                          tabs: {
                                            type: 'void',
                                            version: '2.0',
                                            'x-component': 'Tabs',
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-component-props': {},
                                            _isJSONSchemaObject: true,
                                            properties: {
                                              tab1: {
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                version: '2.0',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component': 'Tabs.TabPane',
                                                'x-component-props': {},
                                                _isJSONSchemaObject: true,
                                                properties: {
                                                  grid: {
                                                    type: 'void',
                                                    version: '2.0',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    _isJSONSchemaObject: true,
                                                    'x-uid': '9be5zlgowvl',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'h2l84gezc9z',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'fw7v14u7dw0',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'd6qcrw7pxm9',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'ot2916fqr88',
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                  yv7t1ushwsj: {
                                    type: 'void',
                                    title: 'Association field',
                                    'x-uid': 'j5l7v52ftxf',
                                    version: '2.0',
                                    'x-action': 'customize:popup',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-component-props': {
                                      danger: false,
                                      openMode: 'drawer',
                                    },
                                    _isJSONSchemaObject: true,
                                    properties: {
                                      drawer: {
                                        type: 'void',
                                        title: '{{ t("Popup") }}',
                                        version: '2.0',
                                        'x-component': 'Action.Container',
                                        'x-component-props': {
                                          className: 'nb-action-popup',
                                        },
                                        _isJSONSchemaObject: true,
                                        properties: {
                                          tabs: {
                                            type: 'void',
                                            version: '2.0',
                                            'x-component': 'Tabs',
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-component-props': {},
                                            _isJSONSchemaObject: true,
                                            properties: {
                                              tab1: {
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                version: '2.0',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component': 'Tabs.TabPane',
                                                'x-component-props': {},
                                                _isJSONSchemaObject: true,
                                                properties: {
                                                  grid: {
                                                    type: 'void',
                                                    version: '2.0',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    _isJSONSchemaObject: true,
                                                    properties: {
                                                      pk40wwnw0cp: {
                                                        type: 'void',
                                                        version: '2.0',
                                                        'x-component': 'Grid.Row',
                                                        _isJSONSchemaObject: true,
                                                        properties: {
                                                          vp07gwoy5zw: {
                                                            type: 'void',
                                                            version: '2.0',
                                                            'x-component': 'Grid.Col',
                                                            _isJSONSchemaObject: true,
                                                            properties: {
                                                              lcn5rklguxs: {
                                                                type: 'void',
                                                                version: '2.0',
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-acl-action': 'general:update',
                                                                'x-component-props': {},
                                                                'x-decorator-props': {
                                                                  action: 'get',
                                                                  resource: 'general',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  collection: 'general',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                _isJSONSchemaObject: true,
                                                                properties: {
                                                                  ayckfphyfov: {
                                                                    type: 'void',
                                                                    version: '2.0',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    _isJSONSchemaObject: true,
                                                                    properties: {
                                                                      grid: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        _isJSONSchemaObject: true,
                                                                        properties: {
                                                                          '7043nizntd8': {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              '3rpf7gxo2b0': {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  oneToOneBelongsTo: {
                                                                                    type: 'string',
                                                                                    'x-uid': '2r7qxq1devc',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    'x-collection-field':
                                                                                      'general.oneToOneBelongsTo',
                                                                                    _isJSONSchemaObject: true,
                                                                                    properties: {
                                                                                      jot4ibpbav6: {
                                                                                        type: 'void',
                                                                                        version: '2.0',
                                                                                        'x-index': 1,
                                                                                        'x-component':
                                                                                          'AssociationField.Nester',
                                                                                        _isJSONSchemaObject: true,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            type: 'void',
                                                                                            version: '2.0',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'form:configureFields',
                                                                                            _isJSONSchemaObject: true,
                                                                                            properties: {
                                                                                              dtxjb31ls31: {
                                                                                                type: 'void',
                                                                                                version: '2.0',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                properties: {
                                                                                                  '16hy9o43lw3': {
                                                                                                    type: 'void',
                                                                                                    version: '2.0',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    properties: {
                                                                                                      nickname: {
                                                                                                        type: 'string',
                                                                                                        version: '2.0',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-collection-field':
                                                                                                          'users.nickname',
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'bmgy7q59phb',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'kk4o7xzwakq',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'y6ecg89gwnc',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              ivx1km02x4a: {
                                                                                                type: 'void',
                                                                                                version: '2.0',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                properties: {
                                                                                                  '2ihsfcbje69': {
                                                                                                    type: 'void',
                                                                                                    version: '2.0',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    properties: {
                                                                                                      username: {
                                                                                                        type: 'string',
                                                                                                        version: '2.0',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-collection-field':
                                                                                                          'users.username',
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'egwd6ablbba',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '7s4mmbpo70u',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'qeqe9w2ss7j',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                              p9z0x51055h: {
                                                                                                type: 'void',
                                                                                                version: '2.0',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                properties: {
                                                                                                  wef811qqesy: {
                                                                                                    type: 'void',
                                                                                                    version: '2.0',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    properties: {
                                                                                                      email: {
                                                                                                        type: 'string',
                                                                                                        version: '2.0',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-collection-field':
                                                                                                          'users.email',
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'tf2u14d0bnm',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'hkyvgbi1ivc',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 't3gh0wv6e7n',
                                                                                                'x-async': false,
                                                                                                'x-index': 3,
                                                                                              },
                                                                                              v6h9rzbxz3y: {
                                                                                                type: 'void',
                                                                                                version: '2.0',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                properties: {
                                                                                                  '5mzmg368cgc': {
                                                                                                    type: 'void',
                                                                                                    version: '2.0',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    properties: {
                                                                                                      phone: {
                                                                                                        type: 'string',
                                                                                                        version: '2.0',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-collection-field':
                                                                                                          'users.phone',
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          '7svpr9sjqq7',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'wmnp7z1herk',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'x2372x0535z',
                                                                                                'x-async': false,
                                                                                                'x-index': 4,
                                                                                              },
                                                                                              '6e7rg543py2': {
                                                                                                type: 'void',
                                                                                                version: '2.0',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                properties: {
                                                                                                  '51r85dms6u5': {
                                                                                                    type: 'void',
                                                                                                    version: '2.0',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    properties: {
                                                                                                      password: {
                                                                                                        type: 'string',
                                                                                                        version: '2.0',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-collection-field':
                                                                                                          'users.password',
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'oadthvx1ers',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '3i3zf2kajwh',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '48y13rla8md',
                                                                                                'x-async': false,
                                                                                                'x-index': 5,
                                                                                              },
                                                                                              i9h89hft5dp: {
                                                                                                type: 'void',
                                                                                                version: '2.0',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                properties: {
                                                                                                  helm5fnfsjx: {
                                                                                                    type: 'void',
                                                                                                    version: '2.0',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    properties: {
                                                                                                      roles: {
                                                                                                        type: 'string',
                                                                                                        version: '2.0',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-collection-field':
                                                                                                          'users.roles',
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'o35fyaetimm',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'ymr0667h1rx',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'r94l4c51qdu',
                                                                                                'x-async': false,
                                                                                                'x-index': 6,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'mef6cnvk4n1',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '1cnjtwsrvce',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '3zzp77bn550',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '4lbpg41i5hh',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          z3ckqofz7uk: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              mhrfvtqmwwz: {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  oneToOneHasOne: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'general.oneToOneHasOne',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': '75qh2fu0yn3',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 't2b53tdr8a6',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'n9abk3dzeon',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                          z34ckqofz7uk: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              mhrfvtqmwwz: {
                                                                                type: 'void',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  phone: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'general.phone',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': '75qh2fu0yn3',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 't2b53tdr8a6',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'n9abk3dzeon',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-uid': 'pl7g0fjy2nh',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      actions: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'ActionBar',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component-props': {
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                          layout: 'one-column',
                                                                        },
                                                                        _isJSONSchemaObject: true,
                                                                        'x-uid': 't7fz6v4krgf',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'rbc3kl2hvhy',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '06o9bp7jenm',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'hye1tyke2f5',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'gvcjxzj18rx',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '6vljvmrpdr1',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'eefwh6mxm72',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'm1gv9s8t1dq',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '0tmh3ohxp7i',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 3,
                                  },
                                  cf04st1doqj: {
                                    type: 'void',
                                    title: 'Association block',
                                    'x-uid': 'ygit3lt71wu',
                                    version: '2.0',
                                    'x-action': 'customize:popup',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-component-props': {
                                      danger: false,
                                      openMode: 'drawer',
                                    },
                                    _isJSONSchemaObject: true,
                                    properties: {
                                      drawer: {
                                        type: 'void',
                                        title: '{{ t("Popup") }}',
                                        version: '2.0',
                                        'x-component': 'Action.Container',
                                        'x-component-props': {
                                          className: 'nb-action-popup',
                                        },
                                        _isJSONSchemaObject: true,
                                        properties: {
                                          tabs: {
                                            type: 'void',
                                            version: '2.0',
                                            'x-component': 'Tabs',
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-component-props': {},
                                            _isJSONSchemaObject: true,
                                            properties: {
                                              tab1: {
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                version: '2.0',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component': 'Tabs.TabPane',
                                                'x-component-props': {},
                                                _isJSONSchemaObject: true,
                                                properties: {
                                                  grid: {
                                                    type: 'void',
                                                    version: '2.0',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    _isJSONSchemaObject: true,
                                                    properties: {
                                                      h9gq1awpz33: {
                                                        type: 'void',
                                                        version: '2.0',
                                                        'x-component': 'Grid.Row',
                                                        _isJSONSchemaObject: true,
                                                        properties: {
                                                          wwma4u9vs33: {
                                                            type: 'void',
                                                            version: '2.0',
                                                            'x-component': 'Grid.Col',
                                                            _isJSONSchemaObject: true,
                                                            properties: {
                                                              e3wa9ksa61p: {
                                                                type: 'void',
                                                                version: '2.0',
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-acl-action': 'general.oneToOneBelongsTo:get',
                                                                'x-decorator-props': {
                                                                  action: 'get',
                                                                  resource: 'general.oneToOneBelongsTo',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  collection: 'users',
                                                                  readPretty: true,
                                                                  association: 'general.oneToOneBelongsTo',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                _isJSONSchemaObject: true,
                                                                properties: {
                                                                  hmrnj50stnn: {
                                                                    type: 'void',
                                                                    version: '2.0',
                                                                    'x-component': 'FormV2',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    _isJSONSchemaObject: true,
                                                                    properties: {
                                                                      actions: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'ActionBar',
                                                                        'x-initializer': 'details:configureActions',
                                                                        'x-component-props': {
                                                                          style: {
                                                                            marginBottom: 24,
                                                                          },
                                                                        },
                                                                        _isJSONSchemaObject: true,
                                                                        'x-uid': 'tdc35crk959',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      grid: {
                                                                        type: 'void',
                                                                        version: '2.0',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        _isJSONSchemaObject: true,
                                                                        properties: {
                                                                          hnzs6hajxl8: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              l2rzx99pe1q: {
                                                                                type: 'void',
                                                                                'x-uid': 'tjzdv9fcy46',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-component-props': {
                                                                                  width: 50,
                                                                                },
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  nickname: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'users.nickname',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'hwj09s913pp',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                              col_ieim3ainmxp: {
                                                                                type: 'void',
                                                                                'x-uid': 'osiaahtxspl',
                                                                                version: '2.0',
                                                                                'x-index': 2,
                                                                                'x-component': 'Grid.Col',
                                                                                'x-component-props': {
                                                                                  width: 50,
                                                                                },
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  username: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'users.username',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': '3fgcmm59sn2',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': '4jh24thyzji',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          w9sohgtdob8: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            'x-uid': 'lg4k7rtlroe',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                          '0xed87brbgn': {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              eck0tjtvtqj: {
                                                                                type: 'void',
                                                                                'x-uid': 'cu4iz7ec6cf',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-component-props': {
                                                                                  width: 50,
                                                                                },
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  email: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field': 'users.email',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'f5nxznv89nw',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                              col_q8pei4rwpuu: {
                                                                                type: 'void',
                                                                                'x-uid': 'bze2uaq8sac',
                                                                                version: '2.0',
                                                                                'x-index': 2,
                                                                                'x-component': 'Grid.Col',
                                                                                'x-component-props': {
                                                                                  width: 50,
                                                                                },
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  roles: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field': 'users.roles',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'p6o44dyg2hv',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': '8487clm2h1d',
                                                                            'x-async': false,
                                                                            'x-index': 3,
                                                                          },
                                                                          z2urij42mlu: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            properties: {
                                                                              xxowyuoye0h: {
                                                                                type: 'void',
                                                                                'x-uid': 'hmgps9sm6g8',
                                                                                version: '2.0',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-component-props': {
                                                                                  width: 50,
                                                                                },
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  phone: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field': 'users.phone',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'j7q42thdc0l',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                              col_8kb6rj112c7: {
                                                                                type: 'void',
                                                                                'x-uid': 'axqn8wwbhno',
                                                                                version: '2.0',
                                                                                'x-index': 2,
                                                                                'x-component': 'Grid.Col',
                                                                                'x-component-props': {
                                                                                  width: 50,
                                                                                },
                                                                                _isJSONSchemaObject: true,
                                                                                properties: {
                                                                                  password: {
                                                                                    type: 'string',
                                                                                    version: '2.0',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-component-props': {},
                                                                                    'x-collection-field':
                                                                                      'users.password',
                                                                                    _isJSONSchemaObject: true,
                                                                                    'x-uid': 'eni7v79rei8',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'p8q6fzmoyze',
                                                                            'x-async': false,
                                                                            'x-index': 4,
                                                                          },
                                                                          acnkxdxfcrb: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            'x-uid': 'uh1c0g2zmh7',
                                                                            'x-async': false,
                                                                            'x-index': 5,
                                                                          },
                                                                          tp22hmqfkx4: {
                                                                            type: 'void',
                                                                            version: '2.0',
                                                                            'x-component': 'Grid.Row',
                                                                            _isJSONSchemaObject: true,
                                                                            'x-uid': 'tjp2c1g04mp',
                                                                            'x-async': false,
                                                                            'x-index': 6,
                                                                          },
                                                                        },
                                                                        'x-uid': 'k8uldkiwlty',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'moj4dj9zlaw',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '8mncgotvyen',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'icoqry4f469',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 't4c10e77fao',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'etsjrvzlha2',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'lg5dob1gc6r',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'zpiznv38ffh',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '94pm27jgsyh',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 4,
                                  },
                                  k4602nzuf6r: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    title: '{{ t("Delete") }}',
                                    'x-action': 'destroy',
                                    'x-component': 'Action.Link',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:delete',
                                    'x-component-props': {
                                      icon: 'DeleteOutlined',
                                      confirm: {
                                        title: "{{t('Delete record')}}",
                                        content: "{{t('Are you sure you want to delete it?')}}",
                                      },
                                      useProps: '{{ useDestroyActionProps }}',
                                    },
                                    'x-action-settings': {
                                      triggerWorkflows: [],
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    type: 'void',
                                    'x-uid': 'a6mt7vf9g67',
                                    'x-async': false,
                                    'x-index': 5,
                                  },
                                },
                                'x-uid': 'mi05lvz5sj2',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                          '3pmpjhgqowq': {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              singleLineText: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.singleLineText',
                                _isJSONSchemaObject: true,
                                'x-uid': 'xm6e5fx373q',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '6t82jp5hr1m',
                            'x-async': false,
                            'x-index': 2,
                          },
                          '11e49qf01aw': {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              longText: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.longText',
                                _isJSONSchemaObject: true,
                                'x-uid': 't5nrfwmaigp',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'b3442vog2ub',
                            'x-async': false,
                            'x-index': 3,
                          },
                          ty56uhq3oc3: {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              phone: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {},
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.phone',
                                _isJSONSchemaObject: true,
                                'x-uid': 'veclsb4jroc',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'xunnak6o7cj',
                            'x-async': false,
                            'x-index': 4,
                          },
                          ld3bbfttiuh: {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              email: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.email',
                                _isJSONSchemaObject: true,
                                'x-uid': 'iy4abo2fgtf',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ps5f4jilksp',
                            'x-async': false,
                            'x-index': 5,
                          },
                          kgu9w0kfa3h: {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              singleSelect: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  style: {
                                    width: '100%',
                                  },
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.singleSelect',
                                _isJSONSchemaObject: true,
                                'x-uid': 'r1hf1edkoxe',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'm38xdtsxffw',
                            'x-async': false,
                            'x-index': 6,
                          },
                          '0nwbyr3jin1': {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              oneToOneBelongsTo: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  size: 'small',
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.oneToOneBelongsTo',
                                _isJSONSchemaObject: true,
                                'x-uid': 'o1mia5vv7kx',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'yqloj3n5bsd',
                            'x-async': false,
                            'x-index': 7,
                          },
                          xgyu9wopugu: {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              oneToOneHasOne: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  size: 'small',
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.oneToOneHasOne',
                                _isJSONSchemaObject: true,
                                'x-uid': 'lo7x9558odx',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '439igde42zv',
                            'x-async': false,
                            'x-index': 8,
                          },
                          '83lxo5i9pwq': {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              oneToMany: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  size: 'small',
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.oneToMany',
                                _isJSONSchemaObject: true,
                                'x-uid': '9h8rquhl00h',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '8mufbssl4do',
                            'x-async': false,
                            'x-index': 9,
                          },
                          vzkxeoy50i9: {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              manyToOne: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  size: 'small',
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.manyToOne',
                                _isJSONSchemaObject: true,
                                'x-uid': 'atg1d7n0ncs',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ipj7p04jdqk',
                            'x-async': false,
                            'x-index': 10,
                          },
                          x1i674dto56: {
                            type: 'void',
                            version: '2.0',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-decorator': 'TableV2.Column.Decorator',
                            _isJSONSchemaObject: true,
                            properties: {
                              manyToMany: {
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-decorator': null,
                                'x-read-pretty': true,
                                'x-component-props': {
                                  size: 'small',
                                  ellipsis: true,
                                },
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-collection-field': 'general.manyToMany',
                                _isJSONSchemaObject: true,
                                'x-uid': 'zp7u52u5b3s',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'wv4jzt9d5js',
                            'x-async': false,
                            'x-index': 11,
                          },
                        },
                        'x-uid': 'vxm6u2njnf7',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 's4vae2h1w0s',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '5jcwzp2opkq',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'j3zf6q2e3c8',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '0q7hj0y8wmr',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'vq3rjplt98m',
    'x-async': true,
    'x-index': 1,
  },
};

export const newTableBlock: PageConfig = {
  collections: general,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '46txyuq0grs': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          zahcrjgcnp9: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              au2rt1euteu: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  ml4odxr7n6g: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-decorator-props': {
                      collection: 'general',
                      dataSource: 'main',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        properties: {
                          slrfnm3niyj: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Bulk update") }}',
                            'x-component': 'Action',
                            'x-align': 'right',
                            'x-acl-action': 'update',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-action': 'customize:bulkUpdate',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:bulkUpdate',
                            'x-action-settings': {
                              assignedValues: {},
                              updateMode: 'selected',
                              onSuccess: {
                                manualClose: true,
                                redirecting: false,
                                successMessage: '{{t("Updated successfully")}}',
                              },
                            },
                            'x-component-props': {
                              icon: 'EditOutlined',
                              useProps: '{{ useCustomizeBulkUpdateActionProps }}',
                            },
                            'x-uid': 'n1qxijc21mx',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '2zkhhoww1fr': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{t("Bulk edit")}}',
                            'x-component': 'Action',
                            'x-action': 'customize:bulkEdit',
                            'x-action-settings': {
                              updateMode: 'selected',
                            },
                            'x-component-props': {
                              openMode: 'drawer',
                              icon: 'EditOutlined',
                            },
                            'x-align': 'right',
                            'x-decorator': 'ACLActionProvider',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:bulkEdit',
                            'x-acl-action': 'update',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{t("Bulk edit")}}',
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
                                    'x-initializer': 'TabPaneInitializersForBulkEditFormBlock',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Bulk edit")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:bulkEdit:addBlock',
                                            'x-uid': '8nuffbe34bb',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '4oldm9wc10s',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '194thgnvcpy',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '1x3ly7atx00',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '75x1gquc69a',
                            'x-async': false,
                            'x-index': 2,
                          },
                          huteob4p7ua: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: "{{t('Add new')}}",
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:addNew',
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
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-uid': 'yjj9tl588o1',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '0zjlqupqrd0',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'sjmso5vq3bc',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '131b76phmyr',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '4ekiy4xn5ip',
                            'x-async': false,
                            'x-index': 3,
                          },
                          xi969uyvexr: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            title: '{{ t("Delete") }}',
                            'x-action': 'destroy',
                            'x-component': 'Action',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:bulkDelete',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-component-props': {
                              icon: 'DeleteOutlined',
                              confirm: {
                                title: "{{t('Delete record')}}",
                                content: "{{t('Are you sure you want to delete it?')}}",
                              },
                              useProps: '{{ useBulkDestroyActionProps }}',
                            },
                            'x-action-settings': {
                              triggerWorkflows: [],
                            },
                            'x-acl-action': 'general:destroy',
                            'x-align': 'right',
                            type: 'void',
                            'x-uid': 'x5nhm8j5prk',
                            'x-async': false,
                            'x-index': 4,
                          },
                        },
                        'x-uid': 's99upcj5h12',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '1pflm3akx4z': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
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
                            'x-initializer': 'table:configureItemActions',
                            properties: {
                              '0vgecinvudu': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  kieddfdng7p: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
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
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-uid': '2k0540e57ol',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 's7gi356fs70',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '8grec6h6mtp',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'assiov38tvg',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'utm143emmhc',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  is523lf1al3: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Edit") }}',
                                    'x-action': 'update',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:edit',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      icon: 'EditOutlined',
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
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-uid': 'wsyp993s4e3',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'cffbmo4sb6k',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '9dwrb18ntjm',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'rz924lz6i2u',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'nkrdjd1jz5j',
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                  k4602nzuf6r: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    title: '{{ t("Delete") }}',
                                    'x-action': 'destroy',
                                    'x-component': 'Action.Link',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:delete',
                                    'x-component-props': {
                                      icon: 'DeleteOutlined',
                                      confirm: {
                                        title: "{{t('Delete record')}}",
                                        content: "{{t('Are you sure you want to delete it?')}}",
                                      },
                                      useProps: '{{ useDestroyActionProps }}',
                                    },
                                    'x-action-settings': {
                                      triggerWorkflows: [],
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    type: 'void',
                                    'x-uid': 'a6mt7vf9g67',
                                    'x-async': false,
                                    'x-index': 3,
                                  },
                                },
                                'x-uid': '7q9j7135hk4',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'c8iecn06wyp',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'm0blrbf9bzr',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '63uhxny4lrn',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'tcne2atmx0n',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'bk1yx2i13k8',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'if4rb336r5q',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '532o6vwg8bi',
    'x-async': true,
    'x-index': 1,
  },
};
