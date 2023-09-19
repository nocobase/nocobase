import { EditOutlined } from '@ant-design/icons';
import { EditCollection } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useUpdateCollectionActionAndRefreshCM } from '../action-hooks';
import { getPopupContainer } from '../utils';

export const EditCollectionAction = ({ item: record, className }) => {
  return (
    <EditCollection
      item={record}
      scope={{
        useCancelAction,
        useUpdateCollectionActionAndRefreshCM,
        createOnly: false,
      }}
      getContainer={getPopupContainer}
    >
      <EditOutlined className={className} />
    </EditCollection>
  );
};
