/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import { Card } from 'antd';
import React from 'react';
import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { RecordProvider } from '../../../record-provider';

const itemCss = css`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
`;

const gridCardCss = css`
  height: 100%;
  > .ant-card-body {
    padding: 24px 24px 0px;
    height: 100%;
  }
  .nb-action-bar {
    padding: 5px 0;
  }
`;

export const GridCardItem = withDynamicSchemaProps(
  (props) => {
    const field = useField<ObjectField>();
    const parentRecordData = useCollectionParentRecordData();
    return (
      <Card role="button" aria-label="grid-card-item" className={gridCardCss}>
        <div className={itemCss}>
          <RecordProvider record={field.value} parent={parentRecordData}>
            {props.children}
          </RecordProvider>
        </div>
      </Card>
    );
  },
  { displayName: 'GridCardItem' },
);
