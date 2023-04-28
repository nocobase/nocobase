import React from 'react';
import { FormV2 } from '../form-v2';
import { css, cx } from '@emotion/css';
import { Card } from 'antd';

export const CardListItem = (props) => {
  const { className } = props;
  return (
    <Card bordered hoverable {...props}>
      <FormV2
        {...props}
        className={cx(
          css`
            width: 100%;
          `,
          className,
        )}
      ></FormV2>
    </Card>
  );
};
