/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useStyles = genStyleHook('nb-mobile-page-navigation-bar', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      '.adm-nav-bar': {
        maxWidth: '100%',
        height: 49,
        overflow: 'hidden',

        '.adm-nav-bar-left': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        },
        '.adm-nav-bar-right': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        },
      },
    },
  };
});
