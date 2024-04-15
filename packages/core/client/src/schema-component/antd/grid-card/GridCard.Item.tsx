import { css } from '@emotion/css';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import { Card } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';
import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { DeclareVariable } from '../../../modules/variable/DeclareVariable';
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
    const { t } = useTranslation();
    const collection = useCollection();
    const field = useField<ObjectField>();
    const parentRecordData = useCollectionParentRecordData();
    return (
      <Card role="button" aria-label="grid-card-item" className={gridCardCss}>
        <div className={itemCss}>
          <RecordProvider record={field.value} parent={parentRecordData}>
            <DeclareVariable
              name="$nPopupRecord"
              title={t('Current popup record')}
              value={field.value}
              collection={collection}
            >
              {props.children}
            </DeclareVariable>
          </RecordProvider>
        </div>
      </Card>
    );
  },
  { displayName: 'GridCardItem' },
);
