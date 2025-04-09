/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../__builtins__';

export const useActionPageStyle = genStyleHook('nb-action-page', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'absolute !important' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: token.colorBgLayout,
      overflowX: 'hidden',
      overflowY: 'auto',

      '.ant-tabs-nav': {
        background: token.colorBgContainer,
        padding: `0 ${token.paddingPageVertical}px`,
        marginBottom: 0,
      },
      '.ant-tabs-content-holder': {
        padding: `${token.paddingPageVertical}px`,
        paddingBottom: '0px',
      },
    },
  };
});
