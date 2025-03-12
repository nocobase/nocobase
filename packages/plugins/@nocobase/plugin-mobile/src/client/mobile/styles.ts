/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useStyles = genStyleHook('nb-mobile', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      // 调整移动端 Grid card 区块顶部按钮和卡片之间的间距
      '--nb-spacing': '12px',

      WebkitOverflowScrolling: 'touch',
      display: 'initial',

      '& ::-webkit-scrollbar': {
        display: 'none',
      },
      '.nb-details .ant-formily-item-feedback-layout-loose': {
        marginBottom: '5px',
      },
      '.nb-details .ant-formily-item-layout-vertical .ant-formily-item-label': {
        marginBottom: '-8px',
      },
      '.ant-pagination-simple': {
        marginTop: '0px !important',
      },
      '.ant-list-item': {
        paddingTop: '8px',
        paddingBottom: '8px',
      },
      // '.nb-action-panel .ant-avatar-circle': {
      //   width: '48px !important',
      //   height: '48px !important',
      //   lineHeight: '48px !important',
      // },
      '.nb-chart-block .ant-card .ant-card-body': {
        paddingBottom: '0px',
        paddingTop: '0px',
      },
      '.ant-table-thead button[aria-label*="schema-initializer-TableV2-table:configureColumns"] > span:last-child': {
        display: 'none !important',
      },
      '.ant-table-thead button[aria-label*="schema-initializer-TableV2-table:configureColumns"] > .ant-btn-icon': {
        margin: '0px',
      },
      '.ant-table-tbody .nb-column-initializer': {
        minWidth: '40px !important',
      },
      '.ant-table-thead button[aria-label*="schema-initializer-TableV2.Selector-table:configureColumns"] > span:last-child':
        {
          display: 'none !important',
        },
      '.ant-table-thead button[aria-label*="schema-initializer-TableV2.Selector-table:configureColumns"] > .ant-btn-icon':
        {
          margin: '0px',
        },
      '.ant-pagination .ant-pagination-total-text': {
        // display: 'none',
      },
      '.ant-pagination .ant-pagination-options': {
        display: 'none',
      },
      '.ant-pagination .ant-pagination-item': {
        display: 'none',
      },
      '.ant-pagination .ant-pagination-item-active': {
        display: 'inline-block',
      },
      '.nb-action-bar button[aria-label*="schema-initializer-ActionBar-table:configureActions"] > span:last-child': {
        display: 'none !important',
      },
      '.nb-action-bar button[aria-label*="schema-initializer-ActionBar-table:configureActions"] > .ant-btn-icon': {
        margin: '0px',
      },
      '.nb-card-list .ant-row > div': {
        width: '100% !important',
        maxWidth: '100% !important',
      },
      '.mobile-page-header .adm-tabs-tab': {
        fontSize: '14px',
        height: '100%',
      },
      '.nb-mobile-setting': {
        '[data-menu-id$="-theme"]': {
          display: 'none',
        },

        '& > .ant-menu > .ant-menu-item': {
          marginInline: 8,
          width: `calc(100% - 16px)`,
        },
      },
    },
  };
});
