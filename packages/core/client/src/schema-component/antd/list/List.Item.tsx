import React from 'react';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';

import { RecordProvider } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  return (
    <div className={classnames('itemCss', props.className)}>
      <RecordProvider record={field.value}>{props.children}</RecordProvider>
    </div>
  );
};
