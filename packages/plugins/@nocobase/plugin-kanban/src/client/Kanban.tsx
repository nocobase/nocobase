import { ArrayField } from '@formily/core';
import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import {
  RecordProvider,
  SchemaComponentOptions,
  useCreateActionProps as useCAP,
  useCollection,
  useCollectionParentRecordData,
  useProps,
} from '@nocobase/client';
import { Spin, Tag, Card, Skeleton } from 'antd';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Board } from './board';
import { KanbanCardContext, KanbanColumnContext } from './context';
import { useStyles } from './style';

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

export const toColumns = (groupField: any, dataSource: Array<any> = [], primaryKey) => {
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
      columns[value].cards.push({ ...ds, id: ds[primaryKey] });
    } else {
      columns.__unknown__.cards.push(ds);
    }
  });
  if (columns.__unknown__.cards.length === 0) {
    delete columns.__unknown__;
  }
  return Object.values(columns);
};

const MemorizedRecursionField = React.memo(RecursionField);
MemorizedRecursionField.displayName = 'MemorizedRecursionField';

export const Kanban: any = observer(
  (props: any) => {
    const { styles } = useStyles();
    const { groupField, onCardDragEnd, dataSource, setDataSource, ...restProps } = useProps(props);
    const collection = useCollection();
    const primaryKey = collection.getPrimaryKey();
    const parentRecordData = useCollectionParentRecordData();
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
    const handleCardRemove = useCallback(
      (card, column) => {
        const updatedBoard = Board.removeCard({ columns: field.value }, column, card);
        field.value = updatedBoard.columns;
        setDataSource(updatedBoard.columns);
      },
      [field],
    );
    const lastDraggedCard = useRef(null);
    const handleCardDragEnd = useCallback(
      (card, fromColumn, toColumn) => {
        lastDraggedCard.current = card[primaryKey];
        onCardDragEnd?.({ columns: field.value, groupField }, fromColumn, toColumn);
        const updatedBoard = Board.moveCard({ columns: field.value }, fromColumn, toColumn);
        field.value = updatedBoard.columns;
        setDataSource(updatedBoard.columns);
      },
      [field],
    );

    return (
      <Spin wrapperClassName={styles.nbKanban} spinning={field.loading || false}>
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
            const columnIndex = dataSource?.indexOf(column);
            const cardIndex = column?.cards?.indexOf(card);
            const { ref, inView } = useInView({
              threshold: 0.8,
              triggerOnce: true,
              initialInView: lastDraggedCard.current && lastDraggedCard.current === card[primaryKey],
            });
            return (
              schemas.card && (
                <RecordProvider record={card} parent={parentRecordData}>
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
                    <div ref={ref}>
                      {inView ? (
                        <MemorizedRecursionField name={schemas.card.name} schema={schemas.card} />
                      ) : (
                        <Card bordered={false}>
                          <Skeleton active paragraph={{ rows: 4 }} />
                        </Card>
                      )}
                    </div>
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
                  <MemorizedRecursionField name={schemas.cardAdder.name} schema={schemas.cardAdder} />
                </SchemaComponentOptions>
              </KanbanColumnContext.Provider>
            );
          }}
        >
          {{
            columns: dataSource || [],
          }}
        </Board>
      </Spin>
    );
  },
  { displayName: 'Kanban' },
);
