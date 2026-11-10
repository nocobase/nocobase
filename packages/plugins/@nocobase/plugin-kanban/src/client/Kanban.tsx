/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField } from '@formily/core';
import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import {
  RecordProvider,
  SchemaComponentOptions,
  useCreateActionProps as useCAP,
  useCollectionParentRecordData,
  useProps,
  withDynamicSchemaProps,
  withSkeletonComponent,
} from '@nocobase/client';
import { Card, Skeleton, Spin, Tag } from 'antd';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { kanbanRecord, toColumns as buildColumns, isCardMoveDisabled } from './board/kanbanRecord';
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
  return buildColumns(groupField, dataSource, primaryKey, groupField.uiSchema.enum);
};

const MemorizedRecursionField = React.memo(RecursionField);
MemorizedRecursionField.displayName = 'MemorizedRecursionField';

export const Kanban: any = withDynamicSchemaProps(
  withSkeletonComponent(
    observer((props: any) => {
      const { styles } = useStyles();

      // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
      const { groupField, onCardDragEnd, dataSource, setDataSource, ...restProps } = useProps(props);

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
        [fieldSchema],
      );
      const handleCardRemove = useCallback(
        (card, column) => {
          const updatedBoard = Board.removeCard({ columns: field.value }, column, card);
          field.value = updatedBoard.columns;
          setDataSource(updatedBoard.columns);
        },
        [field, setDataSource],
      );
      const lastDraggedCard = useRef(null);
      const handleCardDragEnd = useCallback(
        (card, fromColumn, toColumn) => {
          const target = field.value.find((column) => column.id === toColumn.toColumnId)?.cards[toColumn.toPosition];
          if (isCardMoveDisabled(card) || isCardMoveDisabled(target)) return;
          lastDraggedCard.current = card.id;
          onCardDragEnd?.({ columns: field.value, groupField }, fromColumn, toColumn);
          const updatedBoard = Board.moveCard({ columns: field.value }, fromColumn, toColumn);
          field.value = updatedBoard.columns;
          setDataSource(updatedBoard.columns);
        },
        [field, onCardDragEnd, groupField, setDataSource],
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
            renderCard={(card, { column }) => {
              const columnIndex = dataSource?.indexOf(column);
              const cardIndex = column?.cards?.indexOf(card);
              const { ref, inView } = useInView({
                threshold: 0,
                triggerOnce: true,
                initialInView: lastDraggedCard.current && lastDraggedCard.current === card.id,
              });

              return (
                schemas.card && (
                  <RecordProvider record={card[kanbanRecord] ?? card} parent={parentRecordData}>
                    <KanbanCardContext.Provider
                      value={{
                        setDisableCardDrag,
                      }}
                    >
                      <div ref={ref}>
                        {inView ? (
                          <MemorizedRecursionField name={'card'} schema={fieldSchema.properties.card} />
                        ) : (
                          <Card bordered={false}>
                            <Skeleton paragraph={{ rows: 4 }} />
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
    }),
  ),
  { displayName: 'Kanban' },
);
