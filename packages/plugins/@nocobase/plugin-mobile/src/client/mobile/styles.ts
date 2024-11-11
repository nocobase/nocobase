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
      -webkit-overflow-scrolling: touch;
      display: initial;

      & ::-webkit-scrollbar {
        display: none;
      }
      .nb-details .ant-formily-item-feedback-layout-loose {
        margin-bottom: 5px;
      }
      .nb-details .ant-formily-item-layout-vertical .ant-formily-item-label {
        margin-bottom: -8px;
      }
      .ant-card .ant-card-body {
        padding-bottom: 10px;
        padding-top: 10px;
      }
      .ant-pagination-simple {
        margin-top: 0px !important;
      }
      .nb-action-penal-container {
        margin-top: -10px;
        margin-bottom: -10px;
      }
      .nb-action-penal-container
        button[aria-label*='schema-initializer-WorkbenchBlock.ActionBar-workbench:configureActions'] {
        margin-bottom: 10px;
      }
      .nb-action-panel {
        padding-top: 10px;
      }
      .nb-action-panel .ant-avatar-circle {
        width: 48px !important;
        height: 48px !important;
        line-height: 48px !important;
      }
      .nb-chart-block .ant-card .ant-card-body {
        padding-bottom: 0px;
        padding-top: 0px;
      }
      .nb-chart-block .noco-card-item {
        margin-bottom: -13px;
      }
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
      .mobile-page-header .adm-tabs-tab {
        font-size: 14px;
      }
    `,
  };
});
