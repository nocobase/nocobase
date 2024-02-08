import { ObjectField } from '@formily/core';
import { useField } from '@formily/react';
import classnames from 'classnames';
import React from 'react';

import { useParentRecordDataV2 } from '../../../data-source/record/RecordProvider';
import { RecordProvider } from '../../../record-provider';

export const ListItem = (props) => {
  const field = useField<ObjectField>();
  const parentRecordData = useParentRecordDataV2(false);
  return (
    <div className={classnames('itemCss', props.className)}>
      <RecordProvider record={field.value} parent={parentRecordData}>
        {props.children}
      </RecordProvider>
    </div>
  );
};
