/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from '@nocobase/client';

export const useMobileActionPageStyle = createStyles(({ css, token }: any) => {
  return {
    header: css`
      display: flex;
      align-items: center;
      height: var(--mobile-action-page-header-height);
      background-color: ${token.colorBgContainer};
      padding: 0 12px;
    `,
    container: css`
      position: absolute !important;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${token.colorBgLayout};

      .ant-tabs-nav {
        background: ${token.colorBgContainer};
        padding: 0 12px;
        margin-bottom: 0;
        height: var(--mobile-action-page-tab-height);
        .ant-tabs-tab {
          font-size: 17px;
        }
      }
      .ant-tabs-content-holder {
        padding: 0;
        position: absolute;
        left: 0;
        right: 0;
        top: calc(var(--mobile-action-page-tab-height) + var(--mobile-action-page-header-height));
        bottom: 0;
        overflow-y: auto;
        overflow-x: hidden;

        .ant-card {
          border-radius: 0;
        }
        .ant-tabs-tabpane > .nb-grid-container > .nb-grid > .nb-grid-warp > .ant-btn {
          margin: 20px;
        }
      }
    `,
  };
});
