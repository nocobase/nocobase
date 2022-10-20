import { EditOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { EditFieldAction as EditCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useUpdateFieldAction } from '../action-hooks';

const useUpdateCollectionField = (record) => {
  const form = useForm();
  const collectionName = record.collectionName;
  const { run } = useUpdateFieldAction({collectionName, name:record.name});
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
      getContainer={() => document.getElementById('graph_container')}
    >
      <EditOutlined className="btn-edit" />
    </EditCollectionFieldAction>
  );
};
