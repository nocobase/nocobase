/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export default genStyleHook('nb-calendar-v2', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.rbc-month-view': {
        height: '100%',
        minHeight: '0',
        overflow: 'hidden',
      },
    },
  };
});
