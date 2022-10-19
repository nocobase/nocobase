import { PlusOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { AddFieldAction as AddCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useCreateAction } from '../action-hooks';

const useCreateCollectionField = (record) => {
  const form = useForm();
  const title = record.collectionName;
  const { run } = useCreateAction(title, record.key);
  return {
    async run() {
      await run();
    },
  };
};

export const AddFieldAction = ({ item: record }) => {
  return (
    <AddCollectionFieldAction
      item={record}
      scope={{
        useCancelAction,
        useCreateCollectionField: () => useCreateCollectionField(record),
      }}
      getContainer={() => document.getElementById('graph_container')}
    >
      <PlusOutlined className="btn-add" />
    </AddCollectionFieldAction>
  );
};
