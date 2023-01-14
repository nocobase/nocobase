import { CopyOutlined } from '@ant-design/icons';
import { OverridingFieldAction as OverridingCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useCreateAction } from '../action-hooks';

const useOverridingCollectionField = (record) => {
  const collectionName = record.targetCollection;
  const { run } = useCreateAction(collectionName);
  return {
    async run() {
      await run();
    },
  };
};

export const OverrideFieldAction = ({ item: record }) => {
  return (
    <OverridingCollectionFieldAction
      item={{ ...record }}
      scope={{
        useCancelAction,
        useOverridingCollectionField: () => useOverridingCollectionField(record),
      }}
      getContainer={() => document.getElementById('graph_container')}
    >
      <CopyOutlined className="btn-override" />
    </OverridingCollectionFieldAction>
  );
};
