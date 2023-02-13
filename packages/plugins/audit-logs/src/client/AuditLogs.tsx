import { ArrayTable } from '@formily/antd';
import { observer, useField } from '@formily/react';
import {
  CollectionManagerContext,
  CollectionManagerProvider,
  TableBlockProvider,
  useCollection,
  useRecord,
} from '@nocobase/client';
import React, { createContext, useContext } from 'react';
import { AuditLogsDesigner } from './AuditLogsDesigner';

const collection = {
  name: 'auditLogs',
  title: '{{t("Audit logs")}}',
  fields: [
    {
      name: 'createdAt',
      type: 'date',
      interface: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
        },
        'x-read-pretty': true,
      },
    },
    {
      name: 'type',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '{{t("Action type")}}',
        'x-component': 'Select',
        'x-read-pretty': true,
        enum: [
          { label: '{{t("Create record")}}', value: 'create', color: 'lime' },
          { label: '{{t("Update record")}}', value: 'update', color: 'gold' },
          { label: '{{t("Delete record")}}', value: 'destroy', color: 'magenta' },
        ],
      },
    },
    {
      name: 'recordId',
      type: 'string',
      interface: 'input',
      uiSchema: {
        title: '{{t("Record ID")}}',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      name: 'collectionName',
      type: 'string',
      interface: 'input',
      uiSchema: {
        title: '{{t("Collection display name")}}',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      name: 'user',
      type: 'belongsTo',
      interface: 'createdBy',
      target: 'users',
      targetKey: 'id',
      uiSchema: {
        type: 'object',
        title: '{{t("User")}}',
        'x-component': 'RecordPicker',
        'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
        'x-read-pretty': true,
      },
    },
  ],
};

const IsAssociationBlock = createContext(null);

export const useAuditLogsSchema = () => {
  // const isAssoc = useContext(IsAssociationBlock);
  // const ext = {};
  // if (!isAssoc) {
  //   ext['column31'] = {
  //     type: 'void',
  //     'x-decorator': 'TableV2.Column.Decorator',
  //     'x-component': 'TableV2.Column',
  //     'x-designer': 'TableV2.Column.Designer',
  //     title: '{{t("Record ID")}}',
  //     properties: {
  //       recordId: {
  //         'x-component': 'Input',
  //         'x-read-pretty': true,
  //       },
  //     },
  //   };
  // }

  return {
    type: 'void',
    name: 'lfm4trkw8j3',
    'x-component': 'div',
    properties: {
      actions: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
        properties: {
          filter: {
            type: 'void',
            title: '{{ t("Filter") }}',
            'x-action': 'filter',
            // 'x-designer': 'Filter.Action.Designer',
            'x-component': 'Filter.Action',
            'x-component-props': {
              icon: 'FilterOutlined',
              useProps: '{{ useFilterActionProps }}',
            },
            'x-align': 'left',
          },
        },
      },
      y84dlntcaup: {
        type: 'array',
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
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-action-column': 'actions',
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.ActionColumnDesigner',
            'x-initializer': 'TableActionColumnInitializers',
            properties: {
              actions: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {
                  split: '|',
                },
                properties: {
                  o80rypwmeeg: {
                    type: 'void',
                    title: '{{ t("View") }}',
                    'x-designer': 'Action.Designer',
                    'x-component': 'Action.Link',
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
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            properties: {
                              tdlav8o9o17: {
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '7bsnaf47i6g': {
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      '6s2qbihe3tu': {
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
                                          mevpuonrda0: {
                                            type: 'void',
                                            'x-component': 'FormV2',
                                            'x-read-pretty': true,
                                            'x-component-props': {
                                              useProps: '{{ useFormBlockProps }}',
                                            },
                                            properties: {
                                              grid: {
                                                type: 'void',
                                                'x-component': 'Grid',
                                                properties: {
                                                  row1: {
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      col11: {
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          collection: {
                                                            type: 'string',
                                                            title: '{{t("Collection display name")}}',
                                                            'x-component': 'AuditLogsCollection',
                                                            'x-decorator': 'FormItem',
                                                            'x-read-pretty': true,
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                  row2: {
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      col21: {
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          type: {
                                                            type: 'string',
                                                            'x-component': 'CollectionField',
                                                            'x-decorator': 'FormItem',
                                                            'x-read-pretty': true,
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                  row3: {
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      col31: {
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          createdAt: {
                                                            type: 'string',
                                                            'x-component': 'CollectionField',
                                                            'x-decorator': 'FormItem',
                                                            'x-read-pretty': true,
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                  row4: {
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      col41: {
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          user: {
                                                            type: 'string',
                                                            title: '{{t("User")}}',
                                                            'x-component': 'AuditLogsUsername',
                                                            'x-decorator': 'FormItem',
                                                            'x-read-pretty': true,
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                  row5: {
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      col51: {
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          changes: {
                                                            type: 'array',
                                                            title: '{{t("Field value changes")}}',
                                                            'x-decorator': 'FormItem',
                                                            'x-component': 'AuditLogsArrayTable',
                                                            'x-component-props': {
                                                              pagination: { pageSize: 10 },
                                                              scroll: { x: '100%' },
                                                            },
                                                            items: {
                                                              type: 'object',
                                                              properties: {
                                                                column3: {
                                                                  type: 'void',
                                                                  'x-component': 'AuditLogsArrayTable.Column',
                                                                  'x-component-props': {
                                                                    width: 200,
                                                                    title: '{{t("Field")}}',
                                                                  },
                                                                  properties: {
                                                                    field: {
                                                                      type: 'string',
                                                                      //'x-decorator': 'Editable',
                                                                      'x-component': 'AuditLogsField',
                                                                    },
                                                                  },
                                                                },
                                                                column4: {
                                                                  type: 'void',
                                                                  'x-component': 'AuditLogsArrayTable.Column',
                                                                  'x-component-props': {
                                                                    width: 200,
                                                                    title: '{{t("Before change")}}',
                                                                  },
                                                                  properties: {
                                                                    before: {
                                                                      type: 'string',
                                                                      'x-decorator': 'FormItem',
                                                                      'x-component': 'AuditLogsValue',
                                                                    },
                                                                  },
                                                                },
                                                                column5: {
                                                                  type: 'void',
                                                                  'x-component': 'AuditLogsArrayTable.Column',
                                                                  'x-component-props': {
                                                                    width: 200,
                                                                    title: '{{t("After change")}}',
                                                                  },
                                                                  properties: {
                                                                    after: {
                                                                      type: 'string',
                                                                      'x-decorator': 'FormItem',
                                                                      'x-component': 'AuditLogsValue',
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
          column1: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.Column.Designer',
            properties: {
              createdAt: {
                'x-component': 'CollectionField',
                'x-read-pretty': true,
              },
            },
          },
          column2: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.Column.Designer',
            properties: {
              type: {
                'x-component': 'CollectionField',
                'x-read-pretty': true,
              },
            },
          },
          column3: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.Column.Designer',
            title: '{{t("Collection display name")}}',
            properties: {
              collection: {
                'x-component': 'AuditLogsCollection',
                'x-read-pretty': true,
              },
            },
          },
          column31: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.Column.Designer',
            title: '{{t("Record ID")}}',
            properties: {
              recordId: {
                'x-component': 'Input',
                'x-read-pretty': true,
              },
            },
          },
          column4: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.Column.Designer',
            title: '{{t("User")}}',
            properties: {
              user: {
                'x-component': 'AuditLogsUsername',
                'x-read-pretty': true,
              },
            },
          },
        },
      },
    },
  };
};

export const AuditLogs: any = () => {};

AuditLogs.Decorator = observer((props: any) => {
  const parent = useCollection();
  const record = useRecord();
  const { interfaces } = useContext(CollectionManagerContext);
  let filter = props?.params?.filter;
  if (parent.name) {
    const filterByTk = record?.[parent.filterTargetKey || 'id'];
    if (filter) {
      filter = {
        $and: [
          filter,
          {
            collectionName: parent.name,
            recordId: `${filterByTk}`,
          },
        ],
      };
    } else {
      filter = {
        collectionName: parent.name,
        recordId: `${filterByTk}`,
      };
    }
  }
  const defaults = {
    collection: 'auditLogs',
    resource: 'auditLogs',
    action: 'list',
    params: {
      pageSize: 20,
      appends: ['collection', 'user'],
      ...props.params,
      filter,
      sort: '-createdAt',
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };
  return (
    <IsAssociationBlock.Provider value={!!parent.name}>
      <CollectionManagerProvider collections={[collection]} interfaces={interfaces}>
        <TableBlockProvider {...defaults}>{props.children}</TableBlockProvider>
      </CollectionManagerProvider>
    </IsAssociationBlock.Provider>
  );
});

AuditLogs.Designer = AuditLogsDesigner;
