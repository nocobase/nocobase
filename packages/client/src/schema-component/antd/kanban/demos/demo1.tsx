/**
 * title: Kanban
 */

import { useForm } from '@formily/react';
import { observable } from '@formily/reactive';
import {
  ActionContext,
  AntdSchemaComponentProvider,
  CollectionField,
  CollectionManagerProvider,
  CollectionProvider,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';

const dataSource = observable([
  {
    id: 1,
    title: 'Card title 1',
    description: 'Card content',
    status: 'doing',
  },
  {
    id: 2,
    title: 'Card title 2',
    description: 'Card content',
    status: 'doing',
  },
  {
    id: 3,
    title: 'Card title 3',
    description: 'Card content',
    status: 'undo',
  },
  {
    id: 4,
    title: 'Card title 4',
    description: 'Card content',
    status: 'doing',
  },
  {
    id: 5,
    title: 'Card title 5',
    description: 'Card content',
    status: 'done',
  },
]);

const groupField = {
  name: 'status',
  enum: [
    { label: '未开始', value: 'undo', index: 1 },
    { label: '进行中', value: 'doing', index: 2 },
    { label: '已完成', value: 'done', index: 3 },
  ],
};

const schema: any = {
  type: 'void',
  name: 'kanban',
  'x-component': 'Kanban',
  'x-component-props': {
    dataSource,
    groupField,
    cardAdderPosition: 'bottom',
    allowAddCard: { on: 'bottom' },
    disableColumnDrag: true,
    useDragEndAction: '{{ useDragEndHandler }}',
  },
  properties: {
    card: {
      type: 'void',
      name: 'card',
      'x-decorator': 'Form',
      'x-component': 'Kanban.Card',
      'x-designer': 'Kanban.Card.Designer',
    },
    cardAdder: {
      type: 'void',
      name: 'cardAdder',
      'x-component': 'Kanban.CardAdder',
      'x-component-props': {
        block: true,
      },
      title: '添加卡片',
      properties: {
        modal: {
          'x-component': 'Action.Drawer',
          'x-decorator': 'Form',
          type: 'void',
          title: 'Drawer Title',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'GridFormItemInitializers',
            },
            footer: {
              'x-component': 'Action.Drawer.Footer',
              type: 'void',
              properties: {
                action1: {
                  title: '{{ t("Cancel") }}',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ useCancelAction }}',
                  },
                },
                action2: {
                  title: '{{ t("Submit") }}',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    useAction: '{{ useOkAction }}',
                  },
                },
              },
            },
          },
        },
      },
    },
    cardViewer: {
      type: 'void',
      name: 'cardViewer',
      'x-component': 'Kanban.CardViewer',
      properties: {
        modal: {
          'x-component': 'Action.Drawer',
          'x-decorator': 'Form',
          type: 'void',
          title: 'Drawer Title',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'GridFormItemInitializers',
            },
          },
        },
      },
    },
  },
};

const collection = {
  name: 'KanbanCollection',
  title: '看板',
  fields: [
    {
      type: 'string',
      name: 'id',
      interface: 'input',
      title: 'ID',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      title: '标题',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
      },
    },
    {
      type: 'string',
      name: 'description',
      interface: 'input',
      title: '描述',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
      },
    },
    {
      type: 'string',
      name: 'status',
      interface: 'select',
      title: '状态',
      uiSchema: {
        type: 'string',
        'x-component': 'Select',
        enum: [
          { label: '未开始', value: 'undo' },
          { label: '进行中', value: 'doing' },
          { label: '已完成', value: 'done' },
        ],
        'x-decorator': 'FormItem',
      },
    },
  ],
};

export default () => {
  const useDragEndHandler = () => {
    return {
      async run(card, fromColumn, toColumn) {
        for (const ds of dataSource) {
          if (ds.id === card.id) {
            ds.status = toColumn.toColumnId;
            break;
          }
        }
      },
    };
  };
  const useOkAction = () => {
    const form = useForm();
    const { setVisible } = useContext(ActionContext);
    return {
      async run() {
        console.log(form);
        dataSource.push(form.values);
        setVisible(false);
      },
    };
  };
  const useCancelAction = () => {
    const form = useForm();
    const { setVisible } = useContext(ActionContext);
    return {
      async run() {
        setVisible(false);
      },
    };
  };
  return (
    <CollectionManagerProvider>
      <CollectionProvider collection={collection}>
        <SchemaComponentProvider
          designable={true}
          components={{ CollectionField }}
          scope={{ useOkAction, useCancelAction, useDragEndHandler }}
        >
          <SchemaInitializerProvider>
            <AntdSchemaComponentProvider>
              <SchemaComponent schema={schema} />
            </AntdSchemaComponentProvider>
          </SchemaInitializerProvider>
        </SchemaComponentProvider>
      </CollectionProvider>
    </CollectionManagerProvider>
  );
};
