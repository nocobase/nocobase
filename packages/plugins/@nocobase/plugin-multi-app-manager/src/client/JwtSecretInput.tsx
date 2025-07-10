/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Checkbox } from 'antd';
import { usePluginUtils } from './utils';
import { uid } from '@formily/shared';

export const JwtSecretInput = ({ value, onChange }) => {
  const { t } = usePluginUtils();
  const checked = !!value;
  const onCheck = (e: any) => {
    if (e.target.checked) {
      onChange(`${uid()}${uid()}${uid()}${uid()}`);
    } else {
      onChange('');
    }
  };
  return (
    <Checkbox onChange={onCheck} checked={checked}>
      {t(
        'Automatically generate a JWT secret (An independent JWT secret ensures data and session isolation from other applications)',
      )}
    </Checkbox>
  );
};
