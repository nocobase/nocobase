/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';
import React from 'react';
import { useDesignable } from '../../hooks';

import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
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
