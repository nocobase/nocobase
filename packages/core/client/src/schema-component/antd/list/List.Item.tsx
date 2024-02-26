import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';
import React from 'react';
import { css, cx } from '@emotion/css';
import { useDesignable } from '../../hooks';

import { useParentRecordData } from '../../../data-source/record/RecordProvider';
import { RecordProvider_deprecated } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  const { designable } = useDesignable();
  const parentRecordData = useParentRecordData();
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
      <RecordProvider_deprecated record={field.value} parent={parentRecordData}>
        {props.children}
      </RecordProvider_deprecated>
    </div>
  );
};
