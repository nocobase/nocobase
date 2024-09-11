/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from '@nocobase/client';

export const useStyles = createStyles(({ token, css }) => {
  return {
    nbMobile: css`
      display: initial;
      .ant-table-thead button[aria-label*='schema-initializer-TableV2-table:configureColumns'] > span:last-child {
        display: none !important;
      }
      .ant-table-thead button[aria-label*='schema-initializer-TableV2-table:configureColumns'] > .ant-btn-icon {
        margin: 0px;
      }
      .ant-table-tbody .nb-column-initializer {
        min-width: 40px !important;
      }
      // reset Select record popup
      .ant-table-thead
        button[aria-label*='schema-initializer-TableV2.Selector-table:configureColumns']
        > span:last-child {
        display: none !important;
      }
      .ant-table-thead
        button[aria-label*='schema-initializer-TableV2.Selector-table:configureColumns']
        > .ant-btn-icon {
        margin: 0px;
      }

      .ant-pagination .ant-pagination-total-text {
        display: none;
      }
      .ant-pagination .ant-pagination-options {
        display: none;
      }
      .ant-pagination .ant-pagination-item {
        display: none;
      }
      .ant-card-body .nb-action-bar .ant-btn {
        justify-content: space-between;
        display: flex;
        align-items: center;
        gap: 8px;

        span {
          display: contents;
        }
      }
      .ant-card-body .nb-action-bar .ant-btn-icon {
        margin-inline-end: 0px !important;
      }
      .ant-card-body .nb-table-container {
        margin-right: -20px;
        margin-left: -10px;
      }
      .nb-action-bar button[aria-label*='schema-initializer-ActionBar-table:configureActions'] > span:last-child {
        display: none !important;
      }
      .nb-action-bar button[aria-label*='schema-initializer-ActionBar-table:configureActions'] > .ant-btn-icon {
        margin: 0px;
      }
      .nb-card-list .ant-row > div {
        width: 100% !important;
        max-width: 100% !important;
      }
    `,
  };
});
