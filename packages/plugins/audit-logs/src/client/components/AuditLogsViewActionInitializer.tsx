import { ActionInitializer } from '@nocobase/client';
import React from 'react';

export const AuditLogsViewActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("View") }}',
    'x-action': 'view',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-component-props': {
      openMode: 'drawer',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("View record") }}',
        'x-component': 'Action.Container',
        'x-component-props': {
          className: 'nb-action-popup',
        },
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            // 'x-initializer': 'TabPaneInitializers',
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Details")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid',
                    // 'x-initializer': 'RecordBlockInitializers',
                    properties: {
                      '7ypqrxaqysp': {
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Grid.Row',
                        properties: {
                          '1fc2l8dwe7m': {
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid.Col',
                            properties: {
                              '5ley6xifrsb': {
                                version: '2.0',
                                type: 'void',
                                'x-acl-action': 'auditLogs:get',
                                'x-decorator': 'FormBlockProvider',
                                'x-decorator-props': {
                                  resource: 'auditLogs',
                                  collection: 'auditLogs',
                                  readPretty: true,
                                  action: 'get',
                                  useParams: '{{ useParamsFromRecord }}',
                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                },
                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                'x-component': 'CardItem',
                                properties: {
                                  bv710pbf9w6: {
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'FormV2',
                                    'x-read-pretty': true,
                                    'x-component-props': {
                                      useProps: '{{ useFormBlockProps }}',
                                    },
                                    properties: {
                                      // actions: {
                                      //   version: '2.0',
                                      //   type: 'void',
                                      //   'x-initializer': 'ReadPrettyFormActionInitializers',
                                      //   'x-component': 'ActionBar',
                                      //   'x-component-props': {
                                      //     style: {
                                      //       marginBottom: 24,
                                      //     },
                                      //   },
                                      // },
                                      grid: {
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid',
                                        // 'x-initializer': 'ReadPrettyFormItemInitializers',
                                        properties: {
                                          g4c24abnbd9: {
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              fkt9dj5lu1k: {
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  createdAt: {
                                                    version: '2.0',
                                                    type: 'string',
                                                    'x-designer': 'FormItem.Designer',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.createdAt',
                                                    'x-component-props': {},
                                                    'x-read-pretty': true,
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          l267bkv423v: {
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              tehaepm5xqy: {
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  type: {
                                                    version: '2.0',
                                                    type: 'string',
                                                    'x-designer': 'FormItem.Designer',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.type',
                                                    'x-component-props': {},
                                                    'x-read-pretty': true,
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          zhmn2tkzdh2: {
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              yuwyej17i64: {
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  recordId: {
                                                    version: '2.0',
                                                    type: 'string',
                                                    'x-designer': 'FormItem.Designer',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.recordId',
                                                    'x-component-props': {},
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          '6q933ic06mj': {
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              nwtbkqd99zl: {
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  collectionName: {
                                                    version: '2.0',
                                                    type: 'string',
                                                    'x-designer': 'FormItem.Designer',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.collectionName',
                                                    'x-component-props': {},
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          xd4kzulndqk: {
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              k3sd72n83zd: {
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  user: {
                                                    version: '2.0',
                                                    type: 'string',
                                                    'x-designer': 'FormItem.Designer',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.user',
                                                    'x-component-props': {},
                                                    'x-read-pretty': true,
                                                    properties: {
                                                      viewer: {
                                                        version: '2.0',
                                                        type: 'void',
                                                        title: '{{ t("View record") }}',
                                                        'x-component': 'RecordPicker.Viewer',
                                                        'x-component-props': {
                                                          className: 'nb-action-popup',
                                                        },
                                                        properties: {
                                                          tabs: {
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Tabs',
                                                            'x-component-props': {},
                                                            'x-initializer': 'TabPaneInitializers',
                                                            properties: {
                                                              tab1: {
                                                                version: '2.0',
                                                                type: 'void',
                                                                title: '{{t("Details")}}',
                                                                'x-component': 'Tabs.TabPane',
                                                                'x-designer': 'Tabs.Designer',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  grid: {
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'RecordBlockInitializers',
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          '3lghgclbtcg': {
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              '8l1v1auwlx0': {
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  changes: {
                                                    version: '2.0',
                                                    type: 'void',
                                                    // 'x-designer': 'FormItem.Designer',
                                                    'x-component': 'TableField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.changes',
                                                    'x-component-props': {},
                                                    properties: {
                                                      block: {
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-decorator': 'TableFieldProvider',
                                                        'x-acl-action': 'auditChanges:list',
                                                        'x-decorator-props': {
                                                          collection: 'auditChanges',
                                                          association: 'auditLogs.changes',
                                                          resource: 'auditLogs.changes',
                                                          action: 'list',
                                                          params: {
                                                            paginate: false,
                                                          },
                                                          showIndex: true,
                                                          dragSort: false,
                                                        },
                                                        properties: {
                                                          actions: {
                                                            version: '2.0',
                                                            type: 'void',
                                                            // 'x-initializer': 'SubTableActionInitializers',
                                                            'x-component': 'TableField.ActionBar',
                                                            'x-component-props': {},
                                                          },
                                                          changes: {
                                                            version: '2.0',
                                                            type: 'array',
                                                            // 'x-initializer': 'TableColumnInitializers',
                                                            'x-component': 'TableV2',
                                                            'x-component-props': {
                                                              rowSelection: {
                                                                type: 'checkbox',
                                                              },
                                                              useProps: '{{ useTableFieldProps }}',
                                                            },
                                                            properties: {
                                                              '5uvv96u9ict': {
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableV2.Column.Decorator',
                                                                // 'x-designer': 'TableV2.Column.Designer',
                                                                'x-component': 'TableV2.Column',
                                                                properties: {
                                                                  field: {
                                                                    version: '2.0',
                                                                    'x-collection-field': 'auditChanges.field',
                                                                    'x-component': 'CollectionField',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      ellipsis: true,
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                              h7a4tgt11gd: {
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableV2.Column.Decorator',
                                                                // 'x-designer': 'TableV2.Column.Designer',
                                                                'x-component': 'TableV2.Column',
                                                                properties: {
                                                                  before: {
                                                                    version: '2.0',
                                                                    'x-collection-field': 'auditChanges.before',
                                                                    'x-component': 'CollectionField',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      ellipsis: true,
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                              m275z8rglzx: {
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableV2.Column.Decorator',
                                                                // 'x-designer': 'TableV2.Column.Designer',
                                                                'x-component': 'TableV2.Column',
                                                                properties: {
                                                                  after: {
                                                                    version: '2.0',
                                                                    'x-collection-field': 'auditChanges.after',
                                                                    'x-component': 'CollectionField',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      ellipsis: true,
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
