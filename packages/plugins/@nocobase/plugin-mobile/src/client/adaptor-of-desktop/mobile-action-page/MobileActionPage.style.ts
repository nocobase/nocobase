/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useMobileActionPageStyle = genStyleHook('nb-mobile-action-page', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'absolute !important',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: token.colorBgLayout,

      '.nb-mobile-action-page-footer': {
        height: 'var(--nb-mobile-page-header-height)',
        paddingRight: 'var(--nb-mobile-page-tabs-content-padding)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        zIndex: 1000,
      },
    },
  } as any;
});
