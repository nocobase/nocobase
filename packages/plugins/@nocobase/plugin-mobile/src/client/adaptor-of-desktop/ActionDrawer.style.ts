/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useMobileActionDrawerStyle = genStyleHook('nb-mobile-action-drawer', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      '.nb-mobile-action-drawer-header': {
        height: 'var(--nb-mobile-page-header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${token.colorSplit}`,
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1000,

        // to match the button named 'Add block'
        '& + .nb-grid-container > .nb-grid > .nb-grid-warp > .ant-btn': {
          margin: 12,
        },
      },

      '.nb-mobile-action-drawer-placeholder': {
        display: 'inline-block',
        padding: 12,
        visibility: 'hidden',
      },

      '.nb-mobile-action-drawer-close-icon': {
        display: 'inline-block',
        padding: 12,
        cursor: 'pointer',
      },

      '.nb-mobile-action-drawer-body': {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        maxHeight: 'calc(100% - var(--nb-mobile-page-header-height))',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: token.colorBgLayout,

        // 不带 tab 页的半窗
        '& > .nb-grid-container': {
          padding: `${token.paddingPageVertical}px ${token.paddingPageHorizontal}px`,
        },

        // 带有 tab 页的半窗
        '.ant-tabs-nav': {
          marginBottom: '0px !important',
          padding: `0 ${token.paddingPageHorizontal + token.borderRadiusBlock / 2}px`,
          backgroundColor: token.colorBgContainer,
        },

        // 带有 tab 页的半窗
        '.ant-tabs-content-holder': {
          padding: `${token.paddingPageVertical}px ${token.paddingPageHorizontal}px`,
        },

        // clear the margin-bottom of the last block
        '& > .nb-grid-container > .nb-grid > .nb-grid-warp > .nb-grid-row:nth-last-child(2) .noco-card-item': {
          marginBottom: 0,

          '& > .ant-card': {
            marginBottom: '0 !important',
          },
        },
      },

      '.nb-mobile-action-drawer-footer': {
        padding: '8px var(--nb-mobile-page-tabs-content-padding)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: `1px solid ${token.colorSplit}`,
        backgroundColor: token.colorBgLayout,

        '.ant-btn': {
          marginLeft: 8,
        },
      },
    },
  };
});
