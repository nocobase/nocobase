/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Spin } from 'antd';
import { useT } from '../../../locale';
import { useToken } from '@nocobase/client';

export const Generating: React.FC = () => {
  const t = useT();
  const { token } = useToken();
  return (
    <>
      <Spin />
      <span
        style={{
          color: token.colorTextDescription,
          fontStyle: 'italic',
          marginLeft: '8px',
        }}
      >
        {t('Generating')}
      </span>
    </>
  );
};
