import { ActionInitializer } from '@nocobase/client';
import React from 'react';

export const AuditLogsViewActionInitializer = () => {
  const schema = {
    type: 'void',
    title: '{{ t("View") }}',
    'x-action': 'view',
    // 'x-designer': 'Action.Designer',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:view',
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
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Details")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    properties: {
                      '7ypqrxaqysp': {
                        type: 'void',
                        'x-component': 'Grid.Row',
                        properties: {
                          '1fc2l8dwe7m': {
                            type: 'void',
                            'x-component': 'Grid.Col',
                            properties: {
                              '5ley6xifrsb': {
                                type: 'void',
                                'x-acl-action': 'auditLogs:get',
                                'x-decorator': 'FormBlockProvider',
                                'x-decorator-props': {
                                  resource: 'auditLogs',
                                  collection: 'auditLogs',
                                  readPretty: true,
                                  action: 'get',
                                  params: {
                                    appends: ['collection', 'user', 'changes'],
                                  },
                                  useParams: '{{ useParamsFromRecord }}',
                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                },
                                'x-component': 'CardItem',
                                properties: {
                                  bv710pbf9w6: {
                                    type: 'void',
                                    'x-component': 'FormV2',
                                    'x-use-component-props': 'useFormBlockProps',
                                    'x-read-pretty': true,
                                    properties: {
                                      grid: {
                                        type: 'void',
                                        'x-component': 'Grid',
                                        properties: {
                                          g4c24abnbd9: {
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              fkt9dj5lu1k: {
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  createdAt: {
                                                    type: 'string',
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
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              tehaepm5xqy: {
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  type: {
                                                    type: 'string',
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
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              yuwyej17i64: {
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  recordId: {
                                                    type: 'string',
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
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              nwtbkqd99zl2: {
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  'collection.title': {
                                                    type: 'string',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.collection.title',
                                                    'x-component-props': {},
                                                  },
                                                },
                                              },
                                              nwtbkqd99zl1: {
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  'collection.name': {
                                                    type: 'string',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.collection.name',
                                                    'x-component-props': {},
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          xd4kzulndqk: {
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              k3sd72n83zd: {
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  user: {
                                                    type: 'string',
                                                    'x-component': 'CollectionField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.user',
                                                    'x-component-props': {},
                                                    'x-read-pretty': true,
                                                    properties: {
                                                      viewer: {
                                                        type: 'void',
                                                        title: '{{ t("View record") }}',
                                                        'x-component': 'RecordPicker.Viewer',
                                                        'x-component-props': {
                                                          className: 'nb-action-popup',
                                                        },
                                                        properties: {
                                                          tabs: {
                                                            type: 'void',
                                                            'x-component': 'Tabs',
                                                            'x-component-props': {},
                                                            'x-initializer': 'TabPaneInitializers',
                                                            properties: {
                                                              tab1: {
                                                                type: 'void',
                                                                title: '{{t("Details")}}',
                                                                'x-component': 'Tabs.TabPane',
                                                                'x-designer': 'Tabs.Designer',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  grid: {
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'popup:common:addBlock',
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
                                            type: 'void',
                                            'x-component': 'Grid.Row',
                                            properties: {
                                              '8l1v1auwlx0': {
                                                type: 'void',
                                                'x-component': 'Grid.Col',
                                                properties: {
                                                  changes: {
                                                    type: 'void',
                                                    'x-component': 'TableField',
                                                    'x-decorator': 'FormItem',
                                                    'x-collection-field': 'auditLogs.changes',
                                                    'x-component-props': {},
                                                    properties: {
                                                      block: {
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
                                                            type: 'void',
                                                            'x-component': 'TableField.ActionBar',
                                                            'x-component-props': {},
                                                          },
                                                          changes: {
                                                            type: 'array',
                                                            'x-component': 'TableV2',
                                                            'x-use-component-props': 'useTableFieldProps',
                                                            'x-component-props': {
                                                              rowSelection: false,
                                                            },
                                                            properties: {
                                                              '5uvv96u9ict': {
                                                                type: 'void',
                                                                'x-decorator': 'TableV2.Column.Decorator',
                                                                'x-component': 'TableV2.Column',
                                                                properties: {
                                                                  field: {
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
                                                                type: 'void',
                                                                'x-decorator': 'TableV2.Column.Decorator',
                                                                'x-component': 'TableV2.Column',
                                                                properties: {
                                                                  before: {
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
                                                                type: 'void',
                                                                'x-decorator': 'TableV2.Column.Decorator',
                                                                'x-component': 'TableV2.Column',
                                                                properties: {
                                                                  after: {
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
  return <ActionInitializer schema={schema} />;
};
