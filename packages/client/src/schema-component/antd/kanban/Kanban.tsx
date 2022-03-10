import { ArrayField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Spin, Tag } from 'antd';
import React, { useContext, useState } from 'react';
import { SchemaComponentOptions } from '../..';
import { AsyncDataProvider, RecordProvider, useRequest } from '../../../';
import { Board } from '../../../board';
import '../../../board/style.less';
import { Action } from '../action';
import { KanbanCardContext, KanbanColumnContext } from './context';
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

const useCreateKanbanCardValues = (options) => {
  const { column, groupField } = useContext(KanbanColumnContext);
  return useRequest(
    () =>
      Promise.resolve({
        data: {
          [groupField.name]: column.id,
        },
      }),
    {
      ...options,
      refreshDeps: [column.id],
    },
  );
};

export const Kanban: ComposedKanban = observer((props: any) => {
  const { useDataSource = useDefDataSource, groupField, useEvents, ...restProps } = props;
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const [board, setBoard] = useState<any>({ columns: [] });
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const { onCardDragEnd } = useEvents?.() ?? {};
  const [disableCardDrag, setDisableCardDrag] = useState(false);
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
    onCardDragEnd?.({ columns: field.value, groupField }, fromColumn, toColumn);
    const updatedBoard = Board.moveCard({ columns: field.value }, fromColumn, toColumn);
    field.value = updatedBoard.columns;
  };
  return (
    <Spin spinning={result.loading}>
      <AsyncDataProvider value={result}>
        <Board
          disableCardDrag={disableCardDrag}
          onCardRemove={cardRemoveHandler}
          onCardDragEnd={cardDragEndHandler}
          renderColumnHeader={({ title, color }) => (
            <div className={'react-kanban-column-header'}>
              <Tag color={color}>{title}</Tag>
            </div>
          )}
          renderCard={(card, { column, dragging }) => {
            const columnIndex = field.value?.indexOf(column);
            const cardIndex = column?.cards?.indexOf(card);
            return (
              cardSchema && (
                <RecordProvider record={card}>
                  <KanbanCardContext.Provider
                    value={{
                      setDisableCardDrag,
                      cardViewerSchema,
                      cardField: field,
                      card,
                      column,
                      dragging,
                      columnIndex,
                      cardIndex,
                    }}
                  >
                    <RecursionField name={cardSchema.name} schema={cardSchema} />
                  </KanbanCardContext.Provider>
                </RecordProvider>
              )
            );
          }}
          renderCardAdder={({ column }) => {
            return (
              <KanbanColumnContext.Provider value={{ column, groupField }}>
                <SchemaComponentOptions scope={{ useCreateKanbanCardValues }}>
                  <RecursionField name={cardAdderSchema.name} schema={cardAdderSchema} />
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
      </AsyncDataProvider>
    </Spin>
  );
});

Kanban.Card = KanbanCard;
Kanban.CardAdder = Action;
Kanban.CardViewer = KanbanCardViewer;
Kanban.Card.Designer = KanbanCardDesigner;
Kanban.Designer = KanbanDesigner;
