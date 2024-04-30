/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

export const OverrideFieldAction = ({ item: record, parentItem: parentRecord }) => {
  return (
    <OverridingCollectionFieldAction
      item={{ ...record }}
      parentItem={parentRecord}
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
