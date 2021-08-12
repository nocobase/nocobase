import React from 'react';
import { observer, RecursionField, Schema, useField } from '@formily/react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './style.less';
import { useState } from 'react';
import { groupBy } from 'lodash';
import cls from 'classnames';
import { Button, Card, Drawer } from 'antd';
import {
  SchemaRenderer,
  useDesignable,
} from '../../components/schema-renderer';
import { createContext } from 'react';
import { useContext } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';

export function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: props.id,
    data: {
      type: props.type,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={cls({ isDragging }, props.className)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {props.children}
    </div>
  );
}

const useColumns = () => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const values = field.value;
  const [groups, setGroups] = useState(['A', 'B', 'C']);
  const columns = groups.map((name) => {
    return {
      id: name,
      title: name,
      items: values?.filter((item) => item.type === name) || [],
    };
  });
  return { values, groups, columns, setGroups };
};

interface KanbanCardContextProps {
  index: number;
  record?: any;
  viewSchema: Schema;
}

const KanbanCardContext = createContext<KanbanCardContextProps>(null);

export const Kanban: any = observer(() => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const { values, columns } = useColumns();
  const { schema } = useDesignable();
  const cardSchema = schema.reduceProperties((prev, current) => {
    if (current['x-component'] === 'Kanban.Card') {
      return current;
    }
    return prev;
  }, null);
  const cardViewSchema = schema.reduceProperties((prev, current) => {
    if (current['x-component'] === 'Kanban.Card.View') {
      return current;
    }
    return prev;
  }, null);
  return (
    <div className={'kanban'}>
      <DndContext
        // collisionDetection={closestCorners}
        onDragEnd={({ active, over }) => {
          const source = values.find((item) => item.id === active?.id);
          const target = values.find((item) => item.id === over?.id);
          if (source && target) {
            const fromIndex = values.findIndex(
              (item) => item.id === active?.id,
            );
            const toIndex = values.findIndex((item) => item.id === over?.id);
            // setValues((items) => {
            //   const fromIndex = items.findIndex(
            //     (item) => item.id === active?.id,
            //   );
            //   const toIndex = items.findIndex(
            //     (item) => item.id === over?.id,
            //   );
            //   return arrayMove(items, fromIndex, toIndex);
            // });
            field.move(fromIndex, toIndex);
          }
        }}
        onDragOver={({ active, over }) => {
          if (!over) {
            return;
          }
          if (active?.id === over?.id) {
            return;
          }
          const source = values.find((item) => item.id === active?.id);
          if (source && over?.data?.current?.type === 'column') {
            source.type = over.id;
            return;
          }
          console.log('active.id', active.id, over?.data?.current);
          const target = values.find((item) => item.id === over?.id);
          if (source && target) {
            if (source.type !== target.type) {
              source.type = target.type;
            }
          }
        }}
      >
        <DragOverlay style={{ pointerEvents: 'none' }}>aaa</DragOverlay>

        <SortableContext
          strategy={horizontalListSortingStrategy}
          items={columns}
        >
          {columns.map((column) => (
            <SortableItem
              key={column.id}
              type={'column'}
              className={'column'}
              id={column.id}
            >
              <div className={'column-title'}>{column.title}</div>
              <SortableContext
                strategy={verticalListSortingStrategy}
                items={column.items}
              >
                {column.items.map((item) => {
                  const index = values.findIndex(
                    (value) => value.id === item.id,
                  );
                  return (
                    <SortableItem
                      key={item.id}
                      className={'item'}
                      id={item.id}
                      type={'item'}
                    >
                      <KanbanCardContext.Provider
                        value={{
                          index: index,
                          record: item,
                          viewSchema: cardViewSchema,
                        }}
                      >
                        <RecursionField name={index} schema={cardSchema} />
                      </KanbanCardContext.Provider>
                    </SortableItem>
                  );
                })}
              </SortableContext>
              <Button
                type={'text'}
                icon={<PlusOutlined />}
                onClick={() => {
                  field.push({
                    id: uid(),
                    type: column.id,
                    title: uid(),
                  });
                }}
              >
                添加卡片
              </Button>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
});

Kanban.Card = observer((props) => {
  const [visible, setVisible] = useState(false);
  const { index, viewSchema } = useContext(KanbanCardContext);
  return (
    <>
      <Card
        onClick={(e) => {
          setVisible(true);
        }}
        bordered={false}
      >
        {props.children}
      </Card>
      <Drawer
        width={'50%'}
        title={'查看数据'}
        visible={visible}
        onClose={() => {
          setVisible(false);
        }}
      >
        <RecursionField name={index} schema={viewSchema} />
      </Drawer>
    </>
  );
});

Kanban.Card.View = observer((props) => {
  return <div>{props.children}</div>;
});
