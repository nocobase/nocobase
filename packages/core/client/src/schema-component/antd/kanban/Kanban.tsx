import { ArrayField } from '@formily/core';
import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import { Spin, Tag } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { SchemaComponentOptions } from '../..';
import { RecordProvider } from '../../../';
import { useCreateActionProps as useCAP } from '../../../block-provider/hooks';
import { Board } from '../../../board';
import '../../../board/style.less';
import { useProps } from '../../hooks/useProps';
import { KanbanCardContext, KanbanColumnContext } from './context';
import './index.less';

const useCreateActionProps = () => {
  const form = useForm();
  const { column, groupField } = useContext(KanbanColumnContext);
  const { onClick } = useCAP();
  return {
    async onClick() {
      form.setValuesIn(groupField.name, column.id);
      await onClick();
    },
  };
};

export const toColumns = (groupField: any, dataSource: Array<any> = []) => {
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

export const Kanban: any = observer((props: any) => {
  const { groupField, onCardDragEnd, ...restProps } = useProps(props);
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const [disableCardDrag, setDisableCardDrag] = useState(false);
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
    <Spin spinning={field.loading || false}>
      <Board
        {...restProps}
        allowAddCard={!!schemas.cardAdder}
        disableColumnDrag
        cardAdderPosition={'bottom'}
        disableCardDrag={restProps.disableCardDrag || disableCardDrag}
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
          if (!schemas.cardAdder) {
            return null;
          }
          return (
            <KanbanColumnContext.Provider value={{ column, groupField }}>
              <SchemaComponentOptions scope={{ useCreateActionProps }}>
                <RecursionField name={schemas.cardAdder.name} schema={schemas.cardAdder} />
              </SchemaComponentOptions>
            </KanbanColumnContext.Provider>
          );
        }}
      >
        {{
          columns: field.value || [],
        }}
      </Board>
    </Spin>
  );
});
