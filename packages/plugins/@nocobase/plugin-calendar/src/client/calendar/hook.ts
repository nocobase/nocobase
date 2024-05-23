/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDataBlockHeight } from '@nocobase/client';
import { theme } from 'antd';

export const useCalenderHeight = () => {
  const height = useDataBlockHeight();
  const { token } = theme.useToken();
  if (!height) {
    return;
  }
  const actionBarHeight = 2 * token.marginLG;
  return height - actionBarHeight;
};
