/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined } from '@ant-design/icons';
import { DeleteCollection } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useUpdateCollectionActionAndRefreshCM } from '../action-hooks';
import { getPopupContainer } from '../utils';

export const DeleteCollectionAction = ({ item: record, className, ...other }) => {
  return (
    <DeleteCollection
      item={record}
      scope={{
        useCancelAction,
        useUpdateCollectionActionAndRefreshCM,
        createOnly: false,
      }}
      getContainer={getPopupContainer}
      {...other}
    >
      <DeleteOutlined className={className} />
    </DeleteCollection>
  );
};
