/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { AddFieldAction as AddCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useCreateAction } from '../action-hooks';
import { getPopupContainer } from '../utils';

const useCreateCollectionField = (record) => {
  const title = record.collectionName;
  const { run } = useCreateAction(title, record.key);
  return {
    async run() {
      await run();
    },
  };
};

export const AddFieldAction = ({ item: record, database }) => {
  return (
    <AddCollectionFieldAction
      trigger={['click']}
      align={{
        overflow: {
          adjustY: false, // 关闭溢出位置调整
        },
      }}
      item={record}
      database={database}
      scope={{
        useCancelAction,
        useCreateCollectionField: () => useCreateCollectionField(record),
      }}
      getContainer={getPopupContainer}
    >
      <PlusOutlined className="btn-add" id="graph_btn_add_field" />
    </AddCollectionFieldAction>
  );
};
