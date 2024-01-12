import { EditOutlined } from '@ant-design/icons';
import { EditFieldAction as EditCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useUpdateFieldAction } from '../action-hooks';
import { getPopupContainer } from '../utils';

const useUpdateCollectionField = (record) => {
  const collectionName = record.collectionName;
  const { run } = useUpdateFieldAction({ collectionName, name: record.name, key: record.id });
  return {
    async run() {
      await run();
    },
  };
};

export const EditFieldAction = ({ item: record }) => {
  return (
    <EditCollectionFieldAction
      item={record}
      scope={{
        useCancelAction,
        useUpdateCollectionField: () => useUpdateCollectionField(record),
      }}
      getContainer={getPopupContainer}
    >
      <EditOutlined className="btn-edit" />
    </EditCollectionFieldAction>
  );
};
