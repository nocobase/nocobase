/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useStyles = genStyleHook('nb-mobile-tabs-for-mobile-action-page', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',

      '.nb-mobile-page-tabs-list': {
        '.adm-tabs-header': {
          borderBottomWidth: 0,
        },

        '.adm-tabs-tab': {
          height: 49,
          padding: '10px 0 10px',
        },
      },

      '.nb-mobile-page-tabs-button': {
        cursor: 'pointer',
        textAlign: 'right',
        flex: 1,
        paddingRight: 'var(--nb-mobile-page-tabs-content-padding)',

        '.ant-btn': {
          width: 32,
          height: 32,
          padding: 0,
        },

        '.ant-btn > span': {
          display: 'none',
        },

        'span.ant-btn-icon': {
          display: 'inline-block',
          fontSize: 16,
          margin: '0 !important',
        },
      },

      '.nb-mobile-page-tabs-back-button': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        height: 50,
        width: 50,
      },
    },
  };
});
