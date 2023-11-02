import React from 'react';

import { Input } from '../input';
import { RawTextArea } from './RawTextArea';
import { css } from '@emotion/css';

export function JSONInput(props) {
  return (
    <RawTextArea
      buttonClass={css`
        &:not(:hover) {
          border-right-color: transparent;
          border-top-color: transparent;
        }
        background-color: transparent;
      `}
      {...props}
      component={Input.JSON}
    />
  );
}
