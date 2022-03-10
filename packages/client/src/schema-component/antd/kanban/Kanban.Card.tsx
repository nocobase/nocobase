import { css } from '@emotion/css';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Card } from 'antd';
import React, { useContext, useState } from 'react';
import { ActionContext, BlockItem } from '..';
import { DndContext } from '../..';
import { RecordProvider } from '../../../record-provider';
import { SchemaComponentOptions } from '../../core/SchemaComponentOptions';
import { KanbanCardContext } from './context';

const FormItem = observer((props) => {
  return <BlockItem {...props} />;
});

export const KanbanCard: any = observer((props: any) => {
  const { setDisableCardDrag, cardViewerSchema, card, cardField, columnIndex, cardIndex } =
    useContext(KanbanCardContext);
  const fieldSchema = useFieldSchema();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Card
        onClick={(e) => {
          setVisible(true);
        }}
        className={css`
          /* .ant-description-input {
            line-height: 1.15;
          } */
          .ant-formily-item-label {
            display: none;
          }
          .ant-formily-item-feedback-layout-loose {
            margin-bottom: 12px;
          }
          .nb-block-item:last-child {
            .ant-formily-item {
              margin-bottom: 0;
            }
          }
        `}
        bordered={false}
        hoverable
        style={{ cursor: 'pointer', overflow: 'hidden' }}
      >
        <SchemaComponentOptions components={{}}>
          <DndContext
            onDragStart={() => {
              setDisableCardDrag(true);
            }}
            onDragEnd={() => {
              setDisableCardDrag(false);
            }}
          >
            <RecursionField
              basePath={cardField.address.concat(`${columnIndex}.cards.${cardIndex}`)}
              schema={fieldSchema}
              onlyRenderProperties
            />
          </DndContext>
        </SchemaComponentOptions>
      </Card>
      {cardViewerSchema && (
        <ActionContext.Provider value={{ openMode: 'drawer', visible, setVisible }}>
          <RecordProvider record={card}>
            <RecursionField name={cardViewerSchema.name} schema={cardViewerSchema} onlyRenderProperties />
          </RecordProvider>
        </ActionContext.Provider>
      )}
    </>
  );
});
