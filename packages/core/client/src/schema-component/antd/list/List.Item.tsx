import React from 'react';
import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';

import { RecordProvider_deprecated } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  return (
    <div className={classnames('itemCss', props.className)}>
      <RecordProvider_deprecated record={field.value}>{props.children}</RecordProvider_deprecated>
    </div>
  );
};
