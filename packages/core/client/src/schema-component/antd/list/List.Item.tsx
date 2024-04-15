import { css, cx } from '@emotion/css';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';
import React from 'react';
import { useDesignable } from '../../hooks';

import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';
import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { DeclareVariable } from '../../../modules/variable/DeclareVariable';
import { RecordProvider } from '../../../record-provider';

export const ListItem = withDynamicSchemaProps((props) => {
  const { t } = useTranslation();
  const collection = useCollection();
  const field = useField<ObjectField>();
  const { designable } = useDesignable();
  const parentRecordData = useCollectionParentRecordData();
  return (
    <div
      className={cx(classnames(props.className), [
        'itemCss',
        css`
          .nb-action-bar {
            gap: 20px !important;
            margin-top: ${designable ? '20px' : '0px'};
          }
        `,
      ])}
    >
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
  );
});
