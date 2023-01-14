import { PlusOutlined } from '@ant-design/icons';
import { AddFieldAction as AddCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useCreateAction } from '../action-hooks';

const useCreateCollectionField = (record) => {
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
      trigger={['click']}
      align={{
        overflow: {
          adjustY: false, // 关闭溢出位置调整
        },
      }}
      item={record}
      scope={{
        useCancelAction,
        useCreateCollectionField: () => useCreateCollectionField(record),
      }}
      getContainer={() => document.getElementById('graph_container')}
    >
      <PlusOutlined className="btn-add" id='graph_btn_add_field'/>
    </AddCollectionFieldAction>
  );
};
