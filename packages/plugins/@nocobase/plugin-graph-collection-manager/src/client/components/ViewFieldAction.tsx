/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined } from '@ant-design/icons';
import { ViewFieldAction as ViewCollectionFieldAction } from '@nocobase/client';
import React from 'react';
import { getPopupContainer } from '../utils';

export const ViewFieldAction = ({ item: record, parentItem: parentRecord }) => {
  return (
    <ViewCollectionFieldAction item={{ ...record }} parentItem={parentRecord} getContainer={getPopupContainer}>
      <EyeOutlined className="btn-view" />
    </ViewCollectionFieldAction>
  );
};
