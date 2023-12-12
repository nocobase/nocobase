import { general, PageConfig } from '@nocobase/test/client';

export const oneEmptyTableBlockWithExportAndImportAction: PageConfig = {
  collections: general,
  pageSchema: {
    type: 'void',
    version: '2.0',
    'x-component': 'Page',
    _isJSONSchemaObject: true,
    properties: {
      ad0rxb3bbwj: {
        type: 'void',
        version: '2.0',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        _isJSONSchemaObject: true,
        properties: {
          '1xc82jb4xlj': {
            type: 'void',
            version: '2.0',
            'x-component': 'Grid.Row',
            _isJSONSchemaObject: true,
            properties: {
              x2rn9jn7nxs: {
                type: 'void',
                version: '2.0',
                'x-component': 'Grid.Col',
                _isJSONSchemaObject: true,
                properties: {
                  xjd1gaa9kie: {
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
                        'x-initializer': 'TableActionInitializers',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        _isJSONSchemaObject: true,
                        properties: {
                          '5moy52sdgc2': {
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
                                  dataIndex: ['singleSelect'],
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
                            'x-uid': '2ceeylrw6gk',
                            'x-async': false,
                            'x-index': 1,
                          },
                          rr62jj8gw37: {
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
                                    dataIndex: ['id'],
                                  },
                                  {
                                    dataIndex: ['singleSelect'],
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
                                            'x-uid': '7gjodqivf7h',
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
                                            'x-uid': '59x28lqwdwq',
                                            'x-async': false,
                                            'x-index': 2,
                                          },
                                        },
                                        'x-uid': 'i6xytfpenah',
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
                                        'x-uid': 'yx4uter9dq2',
                                        'x-async': false,
                                        'x-index': 2,
                                      },
                                    },
                                    'x-uid': 'c9m72xy620u',
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
                                            'x-uid': 'c5f4rrab3o8',
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
                                            'x-uid': '8lyk6l2miwt',
                                            'x-async': false,
                                            'x-index': 2,
                                          },
                                        },
                                        'x-uid': '30eoo8h0zpw',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'ghzct1zkxu5',
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': 'chhud9h4y5o',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '83ub170gze6',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'wvdbte8emcl',
                        'x-async': false,
                        'x-index': 1,
                      },
                      q976rlu3dgn: {
                        type: 'array',
                        version: '2.0',
                        'x-component': 'TableV2',
                        'x-initializer': 'TableColumnInitializers',
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
                            'x-initializer': 'TableActionColumnInitializers',
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
                                'x-uid': '7k4iud3d4d0',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'evykskqgl3k',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'mzfp6a7h58z',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '9uw9ykngp3s',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'hjjs1tnibak',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'qtplcn381mq',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '2eahnl4qan1',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'olfpfdq174j',
    'x-async': true,
    'x-index': 1,
  },
};

export const backtoRootRole = async (page) => {
  await page.getByTestId('user-center-button').hover();
  await page.getByRole('button', { name: 'switch-role' }).click();
  await page.getByRole('option', { name: 'Root' }).click();
};
