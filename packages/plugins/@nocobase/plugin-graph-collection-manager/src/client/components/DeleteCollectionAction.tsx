import { DeleteOutlined } from '@ant-design/icons';
import { DeleteCollection } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useUpdateCollectionActionAndRefreshCM } from '../action-hooks';
import { getPopupContainer } from '../utils';

export const DeleteCollectionAction = ({ item: record, className, ...other }) => {
  return (
    <DeleteCollection
      item={record}
      scope={{
        useCancelAction,
        useUpdateCollectionActionAndRefreshCM,
        createOnly: false,
      }}
      getContainer={getPopupContainer}
      {...other}
    >
      <DeleteOutlined className={className} />
    </DeleteCollection>
  );
};
