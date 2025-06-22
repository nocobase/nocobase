/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export const CommonAddButton: FC<{ icon?: React.ReactNode }> = ({ icon = <PlusOutlined />, children }) => {
  return (
    <Button
      type="dashed"
      icon={icon}
      style={{
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
      }}
    >
      {children}
    </Button>
  );
};
