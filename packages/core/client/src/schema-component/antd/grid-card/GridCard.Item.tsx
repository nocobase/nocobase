import React from 'react';
import { Card } from 'antd';
import { css } from '@emotion/css';
import { useField } from '@formily/react';
import { ObjectField } from '@formily/core';
import { RecordSimpleProvider } from '../../../record-provider';

const itemCss = css`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
`;

export const GridCardItem = (props) => {
  const field = useField<ObjectField>();
  return (
    <Card
      className={css`
        &,
        & .ant-card-body {
          height: 100%;
        }
      `}
    >
      <div className={itemCss}>
        <RecordSimpleProvider value={field.value}>{props.children}</RecordSimpleProvider>
      </div>
    </Card>
  );
};
