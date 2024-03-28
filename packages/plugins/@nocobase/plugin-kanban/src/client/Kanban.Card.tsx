import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { ActionContextProvider, DndContext, RecordProvider, useCollectionParentRecordData } from '@nocobase/client';
import { Card } from 'antd';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { KanbanCardContext } from './context';

const cardCss = css`
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
`;

const MemorizedRecursionField = React.memo(RecursionField);
MemorizedRecursionField.displayName = 'MemorizedRecursionField';

export const KanbanCard: any = observer(
  () => {
    const { setDisableCardDrag, cardViewerSchema, card, cardField, columnIndex, cardIndex } =
      useContext(KanbanCardContext);
    const parentRecordData = useCollectionParentRecordData();
    const fieldSchema = useFieldSchema();
    const [visible, setVisible] = useState(false);
    const handleCardClick = useCallback((e: React.MouseEvent) => {
      cardViewerSchema && setVisible(true);
    }, []);
    const cardStyle = useMemo(() => {
      return {
        cursor: 'pointer',
        overflow: 'hidden',
      };
    }, []);

    const onDragStart = useCallback(() => {
      setDisableCardDrag(true);
    }, []);
    const onDragEnd = useCallback(() => {
      setDisableCardDrag(false);
    }, []);

    const actionContextValue = useMemo(() => {
      return {
        openMode: fieldSchema['x-component-props']?.['openMode'] || 'drawer',
        openSize: fieldSchema['x-component-props']?.['openSize'],
        visible,
        setVisible,
      };
    }, [fieldSchema, visible]);

    const basePath = useMemo(
      () => cardField.address.concat(`${columnIndex}.cards.${cardIndex}`),
      [cardField, columnIndex, cardIndex],
    );
    const cardViewerBasePath = useMemo(
      () => cardField.address.concat(`${columnIndex}.cardViewer.${cardIndex}`),
      [cardField, columnIndex, cardIndex],
    );

    return (
      <>
        <Card onClick={handleCardClick} bordered={false} hoverable style={cardStyle} className={cardCss}>
          <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <FormLayout layout={'vertical'}>
              <MemorizedRecursionField basePath={basePath} schema={fieldSchema} onlyRenderProperties />
            </FormLayout>
          </DndContext>
        </Card>
        {cardViewerSchema && (
          <ActionContextProvider value={actionContextValue}>
            <RecordProvider record={card} parent={parentRecordData}>
              <MemorizedRecursionField basePath={cardViewerBasePath} schema={cardViewerSchema} onlyRenderProperties />
            </RecordProvider>
          </ActionContextProvider>
        )}
      </>
    );
  },
  { displayName: 'KanbanCard' },
);
