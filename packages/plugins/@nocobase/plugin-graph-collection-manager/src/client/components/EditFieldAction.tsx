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

export const EditFieldAction = ({ item: record, parentItem: ParentRecord }) => {
  return (
    <EditCollectionFieldAction
      item={record}
      parentItem={ParentRecord}
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
