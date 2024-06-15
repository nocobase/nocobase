/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';

export const MenuInitializerComponent: React.FC<any> = (props) => {
  return (
    <Button
      size={'mini'}
      {...props}
      style={{
        height: 24,
        padding: '0 5px',
        border: '1px dashed #F18B62',
        color: '#F18B62',
        top: '-0.8em',
      }}
    >
      <AddOutline style={{ verticalAlign: 'middle' }} />
    </Button>
  );
};
