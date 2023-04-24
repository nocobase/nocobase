import React from 'react';
import { FormV2 } from '../form-v2';
import { css, cx } from '@emotion/css';
import { List } from 'antd';

export const ListItem = (props) => {
  const { className, style } = props;
  return (
    <List.Item>
      <FormV2
        {...props}
        className={cx(
          css`
            width: 100%;
          `,
          className,
        )}
      ></FormV2>
    </List.Item>
  );
};
