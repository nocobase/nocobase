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

const COMPONENT_CLS = 'nb-markdown-vditor';

export default function useStyle() {
  const { theme: antdTheme, token, hashId } = theme.useToken();

  const wrapSSR = useStyleRegister(
    {
      theme: antdTheme as any,
      token,
      hashId,
      path: ['flow-markdown', COMPONENT_CLS],
    },
    () => ({
      [`.${COMPONENT_CLS}`]: {
        '.vditor-reset': { fontSize: `${token.fontSize}px !important`, color: 'unset' },
        '.vditor': {
          borderRadius: 8,
        },
        '.vditor .vditor-content': { borderRadius: '0 0 8px 8px', overflow: 'hidden' },
        '.vditor .vditor-toolbar': { paddingLeft: ' 16px !important', borderRadius: '8px 8px 0 0' },
        '.vditor .vditor-content .vditor-ir .vditor-reset': { padding: '10px !important' },
        '.vditor-ir pre.vditor-reset': {
          backgroundColor: `${token.colorBgContainer}!important`,
        },
        '.vditor-preview': { display: 'none !important' },
        '.vditor-preview__action': {
          display: 'none',
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
