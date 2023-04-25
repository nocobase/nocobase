import React, { forwardRef } from 'react';
import { Button, ButtonProps } from 'antd';
import { css } from '@emotion/css';

export const XButton = forwardRef((props: ButtonProps, ref: any) => (
  <Button
    ref={ref}
    className={css`
      font-style: italic;
      font-family: 'New York', 'Times New Roman', Times, serif;
    `}
    {...props}
  >
    x
  </Button>
));
