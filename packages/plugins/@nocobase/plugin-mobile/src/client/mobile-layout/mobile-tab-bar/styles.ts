/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useStyles = genStyleHook('nb-mobile-tab-bar', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      boxSizing: 'border-box',
      borderTop: '1px solid var(--adm-color-border)',
      backgroundColor: 'var(--adm-color-background)',

      '.mobile-tab-bar-content': {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1em',
        height: '100%',
        minHeight: 49,
      },

      '.mobile-tab-bar-list': {
        display: 'flex',
        justifyContent: 'space-around',
        flex: 1,
        alignItems: 'center',
        overflowX: 'auto',
        '.adm-tab-bar-item': {
          maxWidth: '100%',
          '.adm-tab-bar-item-title': {
            maxWidth: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          },
        },
        '&>div': {
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        '.ant-btn-icon': {
          marginInlineEnd: '0 !important',
        },
      },
    },
  };
});
