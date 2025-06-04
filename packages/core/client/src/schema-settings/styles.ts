/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../schema-component/antd/__builtins__/style';

export const useStyles = genStyleHook('nb-schema-toolbar', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'absolute',
      zIndex: 999,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      border: '2px solid var(--colorBorderSettingsHover)',
      background: 'var(--colorBgSettingsHover)',
      pointerEvents: 'none',
      '&.nb-in-template': {
        background: 'var(--colorTemplateBgSettingsHover)',
      },
      '&.hidden': {
        // Visually hide the element while keeping it in document flow to prevent reflow/repaint
        transform: 'scale(0)',
        // Prevent element from receiving any pointer events (clicks, hovers etc) to avoid interfering with other elements
        pointerEvents: 'none',
      },

      '&.hidden-e2e': {
        display: 'none',
      },

      '.ant-space-item .anticon': {
        margin: 0,
      },

      '.toolbar-title': {
        pointerEvents: 'none',
        position: 'absolute',
        fontSize: 12,
        padding: 0,
        lineHeight: '16px',
        height: '16px',
        borderBottomRightRadius: 2,
        borderRadius: 2,
        top: 2,
        left: 2,
      },
      '.toolbar-title-tag': {
        padding: '0 3px',
        borderRadius: 2,
        background: 'var(--colorSettings)',
        color: '#fff',
        display: 'block',
      },
      '.toolbar-icons': {
        position: 'absolute',
        right: '2px',
        top: '2px',
        lineHeight: '16px',
        pointerEvents: 'all',
        '.ant-space-item': {
          backgroundColor: 'var(--colorSettings)',
          color: '#fff',
          lineHeight: '16px',
          width: '16px',
          paddingLeft: '1px',
          alignSelf: 'stretch',
        },
      },
    },
  };
});
