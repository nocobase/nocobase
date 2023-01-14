import { ArrayTable } from '@formily/antd';
import { observer, useField } from '@formily/react';
import { FormProvider, SchemaComponent, useCompile, useRecord } from '@nocobase/client';
import React, { createContext, useContext } from 'react';
import { CommentItem, getContent } from '../CommentBlock/CommentBlock';
import { useCommentTranslation } from '../locale';
import { CommentRecordDecorator } from './CommentRecord.Decorator';
import { CommentRecordDesigner } from './CommentRecord.Designer';

const Username = observer(() => {
  const field = useField<any>();
  return <div>{field?.value?.nickname || field.value?.id}</div>;
});

const PlainText = observer(() => {
  const field = useField<any>();
  return <div>{field.value}</div>;
});

const Field = observer(() => {
  const field = useField<any>();
  const compile = useCompile();
  if (!field.value) {
    return null;
  }
  return <div>{field.value?.uiSchema?.title ? compile(field.value?.uiSchema?.title) : field.value.name}</div>;
});

const Value = observer(() => {
  const field = useField<any>();
  const record = ArrayTable.useRecord();
  if (record.field?.uiSchema) {
    return (
      <FormProvider>
        <SchemaComponent
          schema={{
            name: record.field.name,
            ...record.field?.uiSchema,
            default: field.value,
            'x-read-pretty': true,
          }}
        />
      </FormProvider>
    );
  }
  return <div>{field.value ? JSON.stringify(field.value) : null}</div>;
});

const Commenter = observer(() => {
  const field = useField<any>();
  if (!field.value) {
    return null;
  }
  return <div>{field.value.nickname}</div>;
});

const CommentContent = observer(() => {
  const record = useRecord();

  return <div>{getContent(record as CommentItem)}</div>;
});

export const IsAssociationBlock = createContext(null);

export const CommentRecord: any = () => {
  const isAssoc = useContext(IsAssociationBlock);
  const { t } = useCommentTranslation();
  const ext = {};
  if (!isAssoc) {
    ext['column31'] = {
      type: 'void',
      'x-component': 'TableV2.Column',
      title: '{{t("Record ID")}}',
      properties: {
        recordId: {
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    };
  }
  return (
    <SchemaComponent
      memoized
      components={{ ArrayTable, Username, Field, Value, Commenter, PlainText, CommentContent }}
      schema={{
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
                                          commentBlock: {
                                            type: 'void',
                                            'x-designer': 'CommentBlock.Designer',
                                            'x-decorator': 'CommentBlock.Decorator',
                                            'x-component': 'CommentBlock',
                                            'x-component-props': {
                                              from: 'commentRecord',
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
                properties: {
                  createdAt: {
                    'x-component': 'CollectionField',
                    'x-read-pretty': true,
                  },
                },
              },
              columnContent: {
                type: 'void',
                'x-component': 'TableV2.Column',
                title: t('Comment content'),
                properties: {
                  content: {
                    'x-component': 'CommentContent',
                    'x-read-pretty': true,
                  },
                },
              },
              columnCollectioName: {
                type: 'void',
                'x-component': 'TableV2.Column',
                title: t('Collection name'),
                properties: {
                  collectioName: {
                    'x-component': 'PlainText',
                    'x-read-pretty': true,
                  },
                },
              },
              columnRecordId: {
                type: 'void',
                'x-component': 'TableV2.Column',
                title: '{{t("Record ID")}}',
                properties: {
                  recordId: {
                    'x-component': 'PlainText',
                    'x-read-pretty': true,
                  },
                },
              },
              columnCommenter: {
                type: 'void',
                'x-component': 'TableV2.Column',
                title: t('Commenter'),
                properties: {
                  commenter: {
                    'x-component': 'Commenter',
                    'x-read-pretty': true,
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

CommentRecord.Designer = CommentRecordDesigner;
CommentRecord.Decorator = CommentRecordDecorator;
