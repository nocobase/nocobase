import { CopyOutlined } from '@ant-design/icons';
import { OverridingFieldAction as OverridingCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useCreateAction } from '../action-hooks';
import { getPopupContainer } from '../utils';

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
      getContainer={getPopupContainer}
    >
      <CopyOutlined className="btn-override" />
    </OverridingCollectionFieldAction>
  );
};
