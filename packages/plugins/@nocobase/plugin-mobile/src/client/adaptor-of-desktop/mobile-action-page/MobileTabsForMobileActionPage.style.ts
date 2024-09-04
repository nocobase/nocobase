/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from '@nocobase/client';

export const useMobileTabsForMobileActionPageStyle = createStyles(({ css, token }: any) => {
  return {
    container: css`
      cursor: pointer;
      text-align: right;
      flex: 1;
      padding-right: var(--nb-mobile-page-tabs-content-padding);

      .ant-btn {
        width: 32px;
        height: 32px;
        padding: 0;
      }

      .ant-btn > span {
        display: none;
      }

      span.ant-btn-icon {
        display: inline-block;
        font-size: 16px;
        margin: 0 !important;
      }
    `,

    backButton: css`
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      height: 50px;
      width: 50px;
    `,
  };
});
