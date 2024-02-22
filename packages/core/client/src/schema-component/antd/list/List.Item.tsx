import React from 'react';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';
import { css, cx } from '@emotion/css';
import { useDesignable } from '../../hooks';

import { RecordProvider } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  const { designable } = useDesignable();
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
      <RecordProvider record={field.value}>{props.children}</RecordProvider>
    </div>
  );
};
