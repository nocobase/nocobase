/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useStyles = genStyleHook('nb-mobile-navigation-bar-action', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      '.nb-navigation-bar-action': {
        maxWidth: '10em',
        '.adm-space': {
          maxWidth: '100%',
          overflow: 'hidden',
        },
      },
      '.nb-navigation-bar-action-icon': {
        width: 24,
        height: 24,
        lineHeight: '24px',
        fontSize: 24,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '& > span': {
          position: 'relative',
        },
      },
      '.nb-navigation-bar-action-title': {
        fontSize: 17,
        padding: 0,
      },
      '.nb-navigation-bar-action-icon-and-title': {
        height: '32px !important',
        fontSize: '17px !important',
        padding: '0 6px !important',
      },
    },
  };
});
