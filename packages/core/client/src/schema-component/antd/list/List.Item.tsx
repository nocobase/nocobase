import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import React from 'react';
import { RecordSimpleProvider } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  return (
    <div className={'itemCss'}>
      <RecordSimpleProvider value={field.value}>{props.children}</RecordSimpleProvider>
    </div>
  );
};
