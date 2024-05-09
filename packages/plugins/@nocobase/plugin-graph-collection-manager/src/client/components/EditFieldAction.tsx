/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
