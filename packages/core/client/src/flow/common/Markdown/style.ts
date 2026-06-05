/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../../../schema-component/antd/__builtins__';

export default genStyleHook('nb-markdown-vditor', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'relative',
      overflow: 'visible',
      '&:hover, &:focus-within': {
        zIndex: 1000,
      },
      '.vditor-reset': { fontSize: `${token.fontSize}px !important`, color: 'unset' },
      '.vditor': {
        borderRadius: 8,
        overflow: 'visible',
      },
      '.vditor .vditor-content': { borderRadius: '0 0 8px 8px', overflow: 'hidden' },
      '.vditor .vditor-toolbar': {
        position: 'relative',
        overflow: 'visible',
        paddingLeft: ' 16px !important',
        borderRadius: '8px 8px 0 0',
      },
      '.vditor .vditor-tooltipped:hover, .vditor .vditor-tooltipped:focus, .vditor .vditor-tooltipped:active': {
        zIndex: 1000,
      },
      '.vditor .vditor-toolbar .vditor-tooltipped__n::after, .vditor .vditor-toolbar .vditor-tooltipped__ne::after, .vditor .vditor-toolbar .vditor-tooltipped__nw::after':
        {
          top: '100%',
          bottom: 'auto',
          marginTop: 5,
          marginBottom: 0,
        },
      '.vditor .vditor-toolbar .vditor-tooltipped__n::before, .vditor .vditor-toolbar .vditor-tooltipped__ne::before, .vditor .vditor-toolbar .vditor-tooltipped__nw::before':
        {
          top: 'auto',
          bottom: -5,
          borderTopColor: 'transparent',
          borderBottomColor: '#3b3e43',
        },
      '.vditor .vditor-content .vditor-ir .vditor-reset': { padding: '10px !important' },
      '.vditor-ir pre.vditor-reset': {
        backgroundColor: `${token.colorBgContainer}!important`,
      },
      '.vditor-preview': { display: 'none !important' },
      '.vditor-preview__action': {
        display: 'none',
      },
    },
  };
});
