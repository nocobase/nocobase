import { ArrayField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Card } from 'antd';
import React, { useState } from 'react';
import { SchemaComponent } from '../..';
import { AsyncDataProvider, RecordProvider, useRequest } from '../../../';
import { Board } from '../../../board';
import { Action } from '../action';
import { CardContext, ColumnContext } from './context';
import { KanbanCardDesigner } from './Kanban.Card.Designer';
import { KanbanDesigner } from './Kanban.Designer';
import { toGroupDataSource } from './utils';

const useRequestProps = (props) => {
  const { request, dataSource } = props;
  if (request) {
    return request;
  }
  return (params: any = {}) => {
    return Promise.resolve({
      data: dataSource,
    });
  };
};

const useDefDataSource = (options, props) => {
  return useRequest(useRequestProps(props), options);
};

export const Kanban: ComposedKanban = observer((props: any) => {
  const { useDataSource = useDefDataSource, groupField, useDragEndAction, ...restProps } = props;
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const [board, setBoard] = useState<any>({ columns: [] });
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const { run: runDragEnd } = useDragEndAction?.() ?? {};
  const result = useDataSource(
    {
      uid: fieldSchema['x-uid'],
      // refreshDeps: [props.dataSource],
      onSuccess({ data }) {
        const ds = toGroupDataSource(groupField, data);
        setBoard(ds);
        field.value = ds.columns;
      },
    },
    props,
  );
  const cardSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Kanban.Card') {
      return current;
    }
    return buf;
  }, null);
  console.log('board', board);
  const cardAdderSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Kanban.CardAdder') {
      return current;
    }
    return buf;
  }, null);
  const cardViewerSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Kanban.CardViewer') {
      return current;
    }
    return buf;
  }, null);

  const cardRemoveHandler = (card, column) => {
    const updatedBoard = Board.removeCard({ columns: field.value }, column, card);
    field.value = updatedBoard.columns;
  };
  const cardDragEndHandler = (card, fromColumn, toColumn) => {
    const updatedBoard = Board.moveCard({ columns: field.value }, fromColumn, toColumn);
    field.value = updatedBoard.columns;
    runDragEnd?.(card, fromColumn, toColumn);
  };
  return (
    <AsyncDataProvider value={result}>
      <Board
        onCardRemove={cardRemoveHandler}
        onCardDragEnd={cardDragEndHandler}
        renderCard={(card, { column, dragging }) => {
          const columnIndex = field.value?.indexOf(column);
          const cardIndex = column?.cards?.indexOf(card);
          return (
            <RecordProvider record={card}>
              <CardContext.Provider value={{ card, column, dragging }}>
                <Card style={{ width: 220, marginBottom: 15, cursor: 'pointer' }}>
                  <RecursionField name={`${columnIndex}.cards.${cardIndex}`} schema={cardSchema} onlyRenderProperties />
                </Card>
              </CardContext.Provider>
            </RecordProvider>
          );
        }}
        renderCardAdder={({ column }) => {
          return (
            <ColumnContext.Provider value={{ column }}>
              <SchemaComponent memoized name={uid()} schema={cardAdderSchema as any} />
            </ColumnContext.Provider>
          );
        }}
        {...restProps}
      >
        {{
          columns: field.value?.slice() || [],
        }}
      </Board>
    </AsyncDataProvider>
  );
});

Kanban.Card = () => null;

Kanban.CardAdder = Action;

Kanban.CardViewer = Action;

Kanban.Card.Designer = KanbanCardDesigner;

Kanban.Designer = KanbanDesigner;
