/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useStyleRegister } from '@ant-design/cssinjs';
import { theme } from 'antd';
import { useMemo } from 'react';

const COMPONENT_CLS = 'nb-field-markdown-vditor';

export default function useStyle() {
  const { theme: antdTheme, token, hashId } = theme.useToken();

  const wrapSSR = useStyleRegister(
    {
      theme: antdTheme as any,
      token,
      hashId,
      path: ['field-markdown-vditor', COMPONENT_CLS],
    },
    () => ({
      [`.${COMPONENT_CLS}`]: {
        position: 'relative',
        overflow: 'visible',
        '&:hover, &:focus-within': {
          zIndex: 1000,
        },
        '.vditor-reset': { fontSize: `${token.fontSize}px !important`, color: 'unset', padding: '10px !important' },
        '.vditor': { borderRadius: 8, overflow: 'visible' },
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
        '.vditor .vditor-content .vditor-ir .vditor-reset': { paddingLeft: ' 16px !important' },
        '.vditor-ir pre.vditor-reset': {
          backgroundColor: `${token.colorBgContainer}!important`,
        },
      },
    }),
  );

  const memoizedWrapSSR = useMemo(() => wrapSSR, [wrapSSR, antdTheme, token, hashId]);

  return {
    wrapSSR: memoizedWrapSSR,
    hashId,
    componentCls: COMPONENT_CLS,
  };
}
