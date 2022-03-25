import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Card } from 'antd';
import React, { useContext, useState } from 'react';
import { DndContext, SchemaComponentOptions } from '../..';
import { RecordProvider } from '../../../';
import { ActionContext } from '../action';
import { KanbanCardContext } from './context';

export const KanbanCard = observer(() => {
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
        bordered={false}
        hoverable
        style={{ cursor: 'pointer', overflow: 'hidden' }}
        bodyStyle={{ paddingBottom: 0 }}
        className={css`
          .ant-description-input {
            text-overflow: ellipsis;
            width: 100%;
            overflow: hidden;
          }
          .ant-description-textarea {
            text-overflow: ellipsis;
            width: 100%;
            overflow: hidden;
          }
        `}
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
            <FormLayout layout={'vertical'}>
              <RecursionField
                basePath={cardField.address.concat(`${columnIndex}.cards.${cardIndex}`)}
                schema={fieldSchema}
                onlyRenderProperties
              />
            </FormLayout>
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
