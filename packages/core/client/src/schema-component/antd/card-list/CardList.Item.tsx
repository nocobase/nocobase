import React from 'react';
import { Card } from 'antd';
import { css } from '@emotion/css';

export const CardListItem = (props) => {
  return (
    <Card bordered hoverable {...props}>
      <div
        className={css`
          display: flex;
          width: 100%;
          flex-direction: column;
          gap: 8px;
        `}
      >
        {props.children}
      </div>
    </Card>
  );
};
