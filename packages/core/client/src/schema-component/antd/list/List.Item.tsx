import React from 'react';
import { css } from '@emotion/css';

const itemCss = css`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
`;

export const ListItem = (props) => {
  return <div className={itemCss}>{props.children}</div>;
};
