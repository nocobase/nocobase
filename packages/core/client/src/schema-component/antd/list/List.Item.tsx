import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import React from 'react';
import { RecordProvider } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  return (
    <div className={'itemCss'}>
      <RecordProvider record={field.value}>{props.children}</RecordProvider>
    </div>
  );
};
