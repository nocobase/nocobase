import { VoidField } from '@formily/core';
import { observer, Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { SchemaComponent } from '../..';
import { AsyncDataProvider, RecordProvider, useRequest } from '../../../';
import { Board } from '../../../board';
import { Action, ActionContext } from '../action';
import { CardContext, ColumnContext } from './context';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner } from './Kanban.Card.Designer';
import { KanbanCardViewer } from './Kanban.CardViewer';
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
  const field = useField<VoidField>();
  const fieldSchema = useFieldSchema();
  const [board, setBoard] = useState<IBoard>({ columns: [] });
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const { run: runDragEnd } = useDragEndAction?.() ?? {};
  const result = useDataSource(
    {
      uid: fieldSchema['x-uid'],
      refreshDeps: [props.dataSource],
      onSuccess({ data }) {
        const ds = toGroupDataSource(groupField, data);
        setBoard(ds);
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
    const updatedBoard = Board.removeCard(board, column, card);
    setBoard(updatedBoard);
  };
  const cardDragEndHandler = (card, fromColumn, toColumn) => {
    const updatedBoard = Board.moveCard(board, fromColumn, toColumn);
    setBoard(updatedBoard);
    runDragEnd?.(card, fromColumn, toColumn);
  };
  return (
    <AsyncDataProvider value={result}>
      {cardViewerSchema && (
        <ActionContext.Provider value={{ visible, setVisible }}>
          <RecordProvider record={record}>
            <SchemaComponent name={record.id} schema={cardViewerSchema as any} onlyRenderProperties />
          </RecordProvider>
        </ActionContext.Provider>
      )}
      <Board
        onCardRemove={cardRemoveHandler}
        onCardDragEnd={cardDragEndHandler}
        renderCard={(card, column, dragging) => {
          setRecord(card);
          return (
            <RecordProvider record={card}>
              <CardContext.Provider value={{ card, column, dragging }}>
                <span onClick={() => setVisible(true)}>
                  <SchemaComponent name={cardSchema.name} schema={cardSchema as any} />
                </span>
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
        {board}
      </Board>
    </AsyncDataProvider>
  );
});

Kanban.Card = KanbanCard;

Kanban.CardAdder = Action;

Kanban.CardViewer = KanbanCardViewer;

Kanban.Card.Designer = KanbanCardDesigner;

Kanban.Designer = KanbanDesigner;
