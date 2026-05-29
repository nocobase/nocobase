/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  return {
    gridBackground: css`
      fill: ${token.colorBgContainer};
    `,
    gridColumnShade: css`
      fill: ${token.colorFillAlter};
      opacity: 0.8;
    `,
    gridSelectedRow: css`
      fill: ${token.colorPrimaryBg};
    `,
    gridRowLine: css`
      stroke: ${token.colorBorderSecondary};
      stroke-width: 1;
    `,
  };
});

export default useStyles;
