import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd';
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
        bordered={false}
        hoverable
        style={{ cursor: 'pointer', overflow: 'hidden' }}
        // bodyStyle={{ paddingBottom: 0 }}
        className={css`
          .ant-card-body {
            padding: 16px;
          }
          .nb-row-divider {
            height: 16px;
            margin-top: -16px;
            &:last-child {
              margin-top: 0;
            }
          }
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
          .ant-formily-item {
            margin-bottom: 12px;
          }
          .nb-grid-row:last-of-type {
            .nb-grid-col {
              .nb-form-item:last-of-type {
                .ant-formily-item {
                  margin-bottom: 0;
                }
              }
            }
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
            <RecursionField
              basePath={cardField.address.concat(`${columnIndex}.cardViewer.${cardIndex}`)}
              schema={cardViewerSchema}
              onlyRenderProperties
            />
          </RecordProvider>
        </ActionContext.Provider>
      )}
    </>
  );
});
