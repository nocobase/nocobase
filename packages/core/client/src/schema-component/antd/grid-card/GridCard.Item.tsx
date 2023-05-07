import React from 'react';
import { Card } from 'antd';
import { css } from '@emotion/css';

const itemCss = css`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
`;

export const GridCardItem = (props) => {
  return (
    <Card bordered hoverable {...props}>
      <div className={itemCss}>{props.children}</div>
    </Card>
  );
};
