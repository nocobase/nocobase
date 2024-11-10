/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tag } from 'antd';
import React from 'react';

export const TreeNode = (props) => {
  const { tag, type, displayType = true } = props;
  const text = {
    reference: 'Reference',
    duplicate: 'Duplicate',
    preloading: 'Preloading',
  };
  const colors = {
    reference: 'blue',
    duplicate: 'green',
    preloading: 'cyan',
  };
  return (
    <div>
      <Tag color={colors[type]}>
        <span>{tag}</span> {displayType ? `(${text[type]})` : ''}
      </Tag>
    </div>
  );
};
