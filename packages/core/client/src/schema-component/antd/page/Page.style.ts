/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../__builtins__';

export const useStyles = genStyleHook('nb-page', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      '&:hover': { '> .general-schema-designer': { display: 'block' } },
      '.ant-page-header': { zIndex: 1, position: 'relative' },
      '> .general-schema-designer': {
        position: 'absolute',
        zIndex: 999,
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'none',
        border: '0',
        pointerEvents: 'none',
        '> .general-schema-designer-icons': {
          zIndex: 9999,
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
          },
        },
      },

      '.pageHeaderCss': {
        backgroundColor: token.colorBgContainer,
        paddingInline: token.paddingLG,
        '&.ant-page-header-has-footer': {
          paddingTop: token.paddingSM,
          paddingBottom: '0',
          '.ant-page-header-heading-left': {},
          '.ant-page-header-footer': { marginBlockStart: '0' },
        },
        '.ant-tabs-nav': { marginBottom: '0' },
        '.ant-page-header-heading-title': {
          color: token.colorText,
        },
      },

      '.height0': {
        fontSize: 0,
        height: 0,
      },

      '.addTabBtn': {
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
      },

      '.designerCss': {
        position: 'relative',
        '&:hover': { '> .general-schema-designer': { display: 'block' } },
        '&.nb-action-link': {
          '> .general-schema-designer': {
            top: '-10px',
            bottom: '-10px',
            left: '-10px',
            right: '-10px',
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
          '> .general-schema-designer-icons': {
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
            },
          },
        },
      },

      '.nb-page-wrapper': {
        padding: `${token.paddingPageVertical}px`,
        paddingBottom: 0,
        flex: 1,
      },
    },
  } as any;
});
