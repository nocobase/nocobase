import React from 'react';
import { css } from '@emotion/css';
import { List } from 'antd';

export const ListItem = (props) => {
  return (
    <List.Item>
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
    </List.Item>
  );
};
