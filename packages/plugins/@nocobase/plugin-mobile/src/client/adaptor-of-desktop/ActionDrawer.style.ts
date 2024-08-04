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
    footer: css`
      height: var(--nb-mobile-page-header-height);
      padding-right: var(--nb-mobile-page-tabs-content-padding);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: ${token.colorBgLayout};
      z-index: 1000;
      border-top: 1px solid ${token.colorSplit};
    `,
  };
});
