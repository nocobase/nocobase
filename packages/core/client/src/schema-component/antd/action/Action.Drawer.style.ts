/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../__builtins__';

export const useStyles = genStyleHook('nb-action-drawer', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      overflow: 'hidden',
      '&.reset': {
        '&.nb-action-popup': {
          '.ant-drawer-header': { display: 'none' },
          '.ant-drawer-body': {
            paddingTop: token.paddingContentVerticalLG,
            backgroundColor: token.colorBgLayout,
            paddingBottom: 0,
          },
        },
        '&.nb-record-picker-selector': {
          '.ant-drawer-content': {
            backgroundColor: token.colorBgLayout,
          },
          '.nb-block-item': {
            marginBottom: token.marginBlock,
            '.general-schema-designer': {
              top: -token.sizeXS,
              bottom: -token.sizeXS,
              left: -token.sizeXS,
              right: -token.sizeXS,
            },
          },
        },
      },

      '.footer': {
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
        '.ant-btn': { marginRight: token.marginXS },
      },

      '.ant-drawer-content-wrapper': {
        borderLeft: `1px solid rgba(255, 255, 255, 0.1)`,
      },

      // 这里的样式是为了保证页面 tabs 标签下面的分割线和页面内容对齐（页面内边距可以通过主题编辑器调节）
      '.ant-tabs-nav': {
        paddingLeft: token.paddingLG - token.paddingPageHorizontal,
        paddingRight: token.paddingLG - token.paddingPageHorizontal,
        marginLeft: token.paddingPageHorizontal - token.paddingLG,
        marginRight: token.paddingPageHorizontal - token.paddingLG,
      },

      // '.ant-tabs-content-holder': {
      //   padding: `${token.paddingPopupVertical}px ${token.paddingPopupHorizontal}px 0`,
      //   margin: `-${token.paddingPopupVertical}px -${token.paddingPopupHorizontal}px`,
      // },
    },
  } as any;
});
