/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import {
  ActionContextProvider,
  DndContext,
  FormProvider,
  useCollection,
  useCollectionRecordData,
  VariablePopupRecordProvider,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { KanbanCardContext } from './context';
import { useKanbanTranslation } from './locale';

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
  // .ant-formily-item-label {
  //   color: #8c8c8c;
  //   fontweight: normal;
  // }
`;

const MemorizedRecursionField = React.memo(RecursionField);
MemorizedRecursionField.displayName = 'MemorizedRecursionField';

export const KanbanCard: any = observer(
  () => {
    const { t } = useKanbanTranslation();
    const collection = useCollection();
    const { setDisableCardDrag } = useContext(KanbanCardContext) || {};
    const fieldSchema = useFieldSchema();
    const [visible, setVisible] = useState(false);
    const recordData = useCollectionRecordData();
    const handleCardClick = useCallback((e: React.MouseEvent) => {
      const targetElement = e.target as Element; // 将事件目标转换为Element类型
      const currentTargetElement = e.currentTarget as Element;
      if (currentTargetElement.contains(targetElement)) {
        setVisible(true);
        e.stopPropagation();
      } else {
        e.stopPropagation();
      }
    }, []);
    const cardStyle = useMemo(() => {
      return {
        cursor: 'pointer',
        overflow: 'hidden',
      };
    }, []);

    const form = useMemo(() => {
      return createForm({
        values: recordData,
      });
    }, [recordData]);

    const onDragStart = useCallback(() => {
      setDisableCardDrag?.(true);
    }, [setDisableCardDrag]);
    const onDragEnd = useCallback(() => {
      setDisableCardDrag?.(false);
    }, [setDisableCardDrag]);

    const actionContextValue = useMemo(() => {
      return {
        openMode: fieldSchema['x-component-props']?.['openMode'] || 'drawer',
        openSize: fieldSchema['x-component-props']?.['openSize'],
        visible,
        setVisible,
      };
    }, [fieldSchema, visible]);

    const popupSchema = fieldSchema.parent.properties.cardViewer;

    return (
      <>
        <Card onClick={handleCardClick} bordered={false} hoverable style={cardStyle} className={cardCss}>
          <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <FormLayout layout={'vertical'}>
              <FormProvider form={form}>
                <MemorizedRecursionField schema={fieldSchema} onlyRenderProperties />
              </FormProvider>
            </FormLayout>
          </DndContext>
        </Card>
        <ActionContextProvider value={actionContextValue}>
          <VariablePopupRecordProvider recordData={recordData} collection={collection}>
            <MemorizedRecursionField schema={popupSchema} />
          </VariablePopupRecordProvider>
        </ActionContextProvider>
      </>
    );
  },
  { displayName: 'KanbanCard' },
);
