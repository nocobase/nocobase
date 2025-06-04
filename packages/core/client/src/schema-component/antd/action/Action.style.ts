/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../__builtins__';

const useStyles = genStyleHook('nb-action', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'relative',
      '&:hover': { '> .general-schema-designer': { display: 'block' } },
      '&.nb-action-link': {
        margin: '-12px',
        padding: '12px',
        '.nb-action-title': {
          marginInlineStart: '0px',
        },
      },
      '> .general-schema-designer': {
        position: 'absolute',
        zIndex: 999,
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'none',
        background: 'var(--colorBgSettingsHover)',
        border: '0',
        pointerEvents: 'none',
        '&.nb-in-template': {
          background: 'var(--colorTemplateBgSettingsHover)',
        },
        '> .general-schema-designer-icons': {
          position: 'absolute',
          right: '2px',
          top: '2px',
          lineHeight: '16px',
          pointerEvents: 'all',
          '.ant-space-item': {
            backgroundColor: token.colorSettings,
            color: '#fff',
            lineHeight: '16px',
            width: '16px',
            paddingLeft: '1px',
            alignSelf: 'stretch',
          },
        },
      },

      '.ant-btn-icon': {
        marginInlineEnd: '0px !important',
      },
      '.nb-action-title': {
        marginInlineStart: `${token.controlPaddingHorizontalSM}px`,
      },
    },
  };
});

export default useStyles;
