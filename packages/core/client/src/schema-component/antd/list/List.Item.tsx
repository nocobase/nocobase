import { css, cx } from '@emotion/css';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';
import React from 'react';
import { useDesignable } from '../../hooks';

import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';
import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { RecordProvider } from '../../../record-provider';

export const ListItem = withDynamicSchemaProps((props) => {
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
        {props.children}
      </RecordProvider>
    </div>
  );
});
