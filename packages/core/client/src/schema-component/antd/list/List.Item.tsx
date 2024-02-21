import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';
import React from 'react';

import { useParentRecordData } from '../../../data-source/record/RecordProvider';
import { RecordProvider_deprecated } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  const parentRecordData = useParentRecordData();
  return (
    <div className={classnames('itemCss', props.className)}>
      <RecordProvider_deprecated record={field.value} parent={parentRecordData}>
        {props.children}
      </RecordProvider_deprecated>
    </div>
  );
};
