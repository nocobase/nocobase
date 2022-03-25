import { ArrayField } from '@formily/core';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Spin, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import { SchemaComponentOptions } from '../..';
import { RecordProvider } from '../../../';
import { Board } from '../../../board';
import '../../../board/style.less';
import { KanbanCardContext, KanbanColumnContext } from './context';

export const toColumns = (groupField: any, dataSource: Array<any> = []) => {
  if (!dataSource?.length) {
    return [];
  }
  const columns = {
    __unknown__: {
      id: '__unknown__',
      title: 'Unknown',
      color: 'default',
      cards: [],
    },
  };
  groupField.uiSchema.enum.forEach((item) => {
    columns[item.value] = {
      id: item.value,
      title: item.label,
      color: item.color,
      cards: [],
    };
  });
  dataSource.forEach((ds) => {
    const value = ds[groupField.name];
    if (value && columns[value]) {
      columns[value].cards.push(ds);
    } else {
      columns.__unknown__.cards.push(ds);
    }
  });
  if (columns.__unknown__.cards.length === 0) {
    delete columns.__unknown__;
  }
  return Object.values(columns);
};

export const Kanban: ComposedKanban = observer((props: any) => {
  const { useProps, ...restProps } = props;
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const { groupField: gField, onCardDragEnd } = useProps?.() ?? {};
  const [disableCardDrag, setDisableCardDrag] = useState(false);
  const groupField = gField || props.groupField;
  const schemas = useMemo(
    () =>
      fieldSchema.reduceProperties(
        (buf, current) => {
          if (current['x-component'].endsWith('.Card')) {
            buf.card = current;
          } else if (current['x-component'].endsWith('.CardAdder')) {
            buf.cardAdder = current;
          } else if (current['x-component'].endsWith('.CardViewer')) {
            buf.cardViewer = current;
          }
          return buf;
        },
        { card: null, cardAdder: null, cardViewer: null },
      ),
    [],
  );
  const handleCardRemove = (card, column) => {
    const updatedBoard = Board.removeCard({ columns: field.value }, column, card);
    field.value = updatedBoard.columns;
  };
  const handleCardDragEnd = (card, fromColumn, toColumn) => {
    onCardDragEnd?.({ columns: field.value, groupField }, fromColumn, toColumn);
    const updatedBoard = Board.moveCard({ columns: field.value }, fromColumn, toColumn);
    field.value = updatedBoard.columns;
  };
  return (
    <Spin spinning={field.loading}>
      <Board
        disableCardDrag={disableCardDrag}
        onCardRemove={handleCardRemove}
        onCardDragEnd={handleCardDragEnd}
        renderColumnHeader={({ title, color }) => (
          <div className={'react-kanban-column-header'}>
            <Tag color={color}>{title}</Tag>
          </div>
        )}
        renderCard={(card, { column, dragging }) => {
          const columnIndex = field.value?.indexOf(column);
          const cardIndex = column?.cards?.indexOf(card);
          return (
            schemas.card && (
              <RecordProvider record={card}>
                <KanbanCardContext.Provider
                  value={{
                    setDisableCardDrag,
                    cardViewerSchema: schemas.cardViewer,
                    cardField: field,
                    card,
                    column,
                    dragging,
                    columnIndex,
                    cardIndex,
                  }}
                >
                  <RecursionField name={schemas.card.name} schema={schemas.card} />
                </KanbanCardContext.Provider>
              </RecordProvider>
            )
          );
        }}
        renderCardAdder={({ column }) => {
          return (
            <KanbanColumnContext.Provider value={{ column, groupField }}>
              <SchemaComponentOptions scope={{}}>
                <RecursionField name={schemas.cardAdder.name} schema={schemas.cardAdder} />
              </SchemaComponentOptions>
            </KanbanColumnContext.Provider>
          );
        }}
        {...restProps}
      >
        {{
          columns: field.value?.slice() || [],
        }}
      </Board>
    </Spin>
  );
});
