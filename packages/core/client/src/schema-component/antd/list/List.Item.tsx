import { css } from '@emotion/css';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import React from 'react';
import { RecordSimpleProvider } from '../../../record-provider';

const itemCss = css`
  display: flex;
  width: 100%;
  flex-direction: column;
  // gap: 8px;
  padding: 4px 5px 0;
  border-bottom: 1px solid #f0f0f0;
`;

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  return (
    <div className={itemCss}>
      <RecordSimpleProvider value={field.value}>{props.children}</RecordSimpleProvider>
    </div>
  );
};
