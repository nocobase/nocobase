/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';

export const ConnectAssociationAction = (props) => {
  const { targetGraph, item } = props;
  return (
    <BranchesOutlined
      className="btn-assocition"
      onClick={() => {
        targetGraph.onConnectionAssociation(item);
      }}
    />
  );
};
