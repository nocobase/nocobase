/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from 'antd-style';

export const useActionPageStyle = createStyles(({ css, token }: any) => {
  return {
    container: css`
      position: absolute !important;
      top: var(--nb-header-height);
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${token.colorBgLayout};
      overflow: auto;

      .ant-tabs-nav {
        background: ${token.colorBgContainer};
        padding: 0 ${token.paddingPageVertical}px;
        margin-bottom: 0;
      }
      .ant-tabs-content-holder {
        padding: ${token.paddingPageVertical}px;
      }
    `,
  };
});
