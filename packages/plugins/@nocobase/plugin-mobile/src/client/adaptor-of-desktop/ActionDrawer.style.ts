/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from '@nocobase/client';

export const useMobileActionDrawerStyle = createStyles(({ css, token }: any) => {
  return {
    header: css`
      height: var(--nb-mobile-page-header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid ${token.colorSplit};
      position: sticky;
      top: 0;
      background-color: white;
      z-index: 1000;

      // to match the button named 'Add block'
      & + .nb-grid-container > .nb-grid > .nb-grid-warp > .ant-btn {
        // 18px is the token marginBlock value
        margin: 12px 12px calc(12px + 18px);
      }
    `,

    placeholder: css`
      display: inline-block;
      padding: 12px;
      visibility: hidden;
    `,

    closeIcon: css`
      display: inline-block;
      padding: 12px;
      cursor: pointer;
    `,

    body: css`
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      max-height: calc(100% - var(--nb-mobile-page-header-height));
      overflow-y: auto;
      overflow-x: hidden;
      background-color: ${token.colorBgLayout};
    `,

    footer: css`
      padding: 8px var(--nb-mobile-page-tabs-content-padding);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      border-top: 1px solid ${token.colorSplit};
      background-color: ${token.colorBgLayout};
    `,
  };
});
