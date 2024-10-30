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
      WebkitOverflowScrolling: 'touch',
      display: 'initial',

      '& ::-webkit-scrollbar': {
        display: 'none',
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
      // reset Select record popup
      '.ant-table-thead button[aria-label*="schema-initializer-TableV2.Selector-table:configureColumns"] > span:last-child':
        {
          display: 'none !important',
        },
      '.ant-table-thead button[aria-label*="schema-initializer-TableV2.Selector-table:configureColumns"] > .ant-btn-icon':
        {
          margin: '0px',
        },

      '.ant-pagination .ant-pagination-total-text': {
        display: 'none',
      },
      '.ant-pagination .ant-pagination-options': {
        display: 'none',
      },
      '.ant-pagination .ant-pagination-item': {
        display: 'none',
      },
      '.ant-card-body .nb-action-bar .ant-btn': {
        justifyContent: 'space-between',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',

        span: {
          display: 'contents',
        },
      },
      '.ant-card-body .nb-action-bar .ant-btn-icon': {
        marginInlineEnd: '0px !important',
      },
      '.ant-card-body .nb-table-container': {
        marginRight: '-20px',
        marginLeft: '-10px',
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
    },
  };
});
