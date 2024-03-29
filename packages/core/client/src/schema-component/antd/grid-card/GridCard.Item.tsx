import { css } from '@emotion/css';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import { Card } from 'antd';
import React from 'react';
import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { RecordProvider } from '../../../record-provider';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

const itemCss = css`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
`;

export const GridCardItem = withDynamicSchemaProps((props) => {
  const field = useField<ObjectField>();
  const parentRecordData = useCollectionParentRecordData();
  return (
    <Card
      role="button"
      aria-label="grid-card-item"
      className={css`
        height: 100%;
        > .ant-card-body {
          padding: 24px 24px 0px;
          height: 100%;
        }
        .nb-action-bar {
          padding: 5px 0;
        }
      `}
    >
      <div className={itemCss}>
        <RecordProvider record={field.value} parent={parentRecordData}>
          {props.children}
        </RecordProvider>
      </div>
    </Card>
  );
});
