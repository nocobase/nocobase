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
import { RecursionField, useFieldSchema } from '@formily/react';
import {
  DndContext,
  FormProvider,
  getCardItemSchema,
  PopupContextProvider,
  useCollection,
  useCollectionRecordData,
  usePopupSettings,
  usePopupUtils,
  VariablePopupRecordProvider,
} from '@nocobase/client';
import { Schema } from '@nocobase/utils';
import { Card } from 'antd';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { KanbanCardContext } from './context';

const cardCss = css`
  text-wrap: wrap;
  word-break: break-all;
  word-wrap: break-word;

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

export const KanbanCard: any = () => {
  const collection = useCollection();
  const { setDisableCardDrag } = useContext(KanbanCardContext) || {};
  const fieldSchema = useFieldSchema();
  const { openPopup, getPopupSchemaFromSchema } = usePopupUtils();
  const recordData = useCollectionRecordData();
  const popupSchema = getPopupSchemaFromSchema(fieldSchema) || getPopupSchemaFromParent(fieldSchema);
  const [visible, setVisible] = useState(false);
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      const targetElement = e.target as Element; // 将事件目标转换为Element类型
      const currentTargetElement = e.currentTarget as Element;
      if (currentTargetElement.contains(targetElement)) {
        if (!isPopupVisibleControlledByURL()) {
          setVisible(true);
        } else {
          openPopup({
            popupUidUsedInURL: popupSchema?.['x-uid'],
          });
        }
        e.stopPropagation();
      } else {
        e.stopPropagation();
      }
    },
    [openPopup, popupSchema],
  );
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

  // if not wrapped, only Tab component's content will be rendered, Drawer component's content will not be rendered
  const wrappedPopupSchema = useMemo(() => {
    return {
      type: 'void',
      properties: {
        drawer: popupSchema,
      },
    };
  }, [popupSchema]);
  const cardItemSchema = getCardItemSchema?.(fieldSchema);
  const {
    layout = 'vertical',
    labelAlign = 'left',
    labelWidth = 120,
    labelWrap = true,
  } = cardItemSchema?.['x-component-props'] || {};

  return (
    <>
      <Card onClick={handleCardClick} bordered={false} hoverable style={cardStyle} className={cardCss}>
        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <FormLayout
            layout={layout}
            labelAlign={labelAlign}
            labelWidth={layout === 'horizontal' ? labelWidth : null}
            labelWrap={labelWrap}
          >
            <FormProvider form={form}>
              <MemorizedRecursionField schema={fieldSchema} onlyRenderProperties />
            </FormProvider>
          </FormLayout>
        </DndContext>
      </Card>
      <PopupContextProvider visible={visible} setVisible={setVisible}>
        <VariablePopupRecordProvider recordData={recordData} collection={collection}>
          <MemorizedRecursionField schema={wrappedPopupSchema} />
        </VariablePopupRecordProvider>
      </PopupContextProvider>
    </>
  );
};

function getPopupSchemaFromParent(fieldSchema: Schema) {
  if (fieldSchema.parent?.properties?.cardViewer?.properties?.drawer) {
    return fieldSchema.parent.properties.cardViewer.properties.drawer;
  }

  const cardSchema = findSchemaByUid(fieldSchema['x-uid'], fieldSchema.root);
  return cardSchema.parent.properties.cardViewer.properties.drawer;
}

function findSchemaByUid(uid: string, rootSchema: Schema, resultRef: { value: Schema } = { value: null }) {
  resultRef = resultRef || {
    value: null,
  };
  rootSchema.mapProperties((schema) => {
    if (schema['x-uid'] === uid) {
      resultRef.value = schema;
    } else {
      findSchemaByUid(uid, schema, resultRef);
    }
  });
  return resultRef.value;
}
