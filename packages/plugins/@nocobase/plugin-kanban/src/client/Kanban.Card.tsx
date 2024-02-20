import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Card } from 'antd';
import cls from 'classnames';
import React, { useContext, useState } from 'react';
import { ActionContextProvider, DndContext, RecordProvider, SchemaComponentOptions } from '@nocobase/client';
import { KanbanCardContext } from './context';

export const KanbanCard: any = observer(
  (props: any) => {
    const { setDisableCardDrag, cardViewerSchema, card, cardField, columnIndex, cardIndex } =
      useContext(KanbanCardContext);
    const fieldSchema = useFieldSchema();
    const [visible, setVisible] = useState(false);
    return (
      <SchemaComponentOptions components={{}} scope={{}}>
        <Card
          onClick={(e) => {
            setVisible(true);
          }}
          bordered={false}
          hoverable
          style={{ cursor: 'pointer', overflow: 'hidden' }}
          // bodyStyle={{ paddingBottom: 0 }}
          className={cls(css`
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
            .ant-formily-item-control .ant-space-item: {
              whitespace: normal;
              wordbreak: break-all;
              wordwrap: break-word;
            }
            .ant-formily-item-label {
              color: #8c8c8c;
              fontweight: normal;
            }
          `)}
        >
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
        </Card>
        {cardViewerSchema && (
          <ActionContextProvider
            value={{
              openMode: fieldSchema['x-component-props']?.['openMode'] || 'drawer',
              openSize: fieldSchema['x-component-props']?.['openSize'],
              visible,
              setVisible,
            }}
          >
            <RecordProvider record={card}>
              <RecursionField
                basePath={cardField.address.concat(`${columnIndex}.cardViewer.${cardIndex}`)}
                schema={cardViewerSchema}
                onlyRenderProperties
              />
            </RecordProvider>
          </ActionContextProvider>
        )}
      </SchemaComponentOptions>
    );
  },
  { displayName: 'KanbanCard' },
);
