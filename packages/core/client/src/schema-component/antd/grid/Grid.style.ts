/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css, cx }: any) => {
  // 如果相等，说明当前是在 Form 区块中，会加上 !important，否则会导致字段间距收到影响
  const important = token.marginBlock === token.marginLG ? ' !important' : '';

  return {
    container: css`
      .ColDivider {
        flex-shrink: 0;
        width: ${token.marginBlock}px${important};
      }

      .DraggableNode {
        &::before {
          content: ' ';
          width: 100%;
          height: 100%;
          position: absolute;
          cursor: col-resize;
        }
        &:hover {
          &::before {
            background: var(--colorBgSettingsHover) !important;
          }
        }
        width: ${token.marginBlock}px${important};
        height: 100%;
        position: absolute;
        cursor: col-resize;
      }

      .RowDivider {
        height: ${token.marginBlock}px${important};
        width: 100%;
        position: absolute;
        margin-top: calc(-1 * ${token.marginBlock}px) ${important};
      }

      .CardRow {
        display: flex;
        position: relative;
      }

      .showDivider {
        margin: 0 calc(-1 * ${token.marginBlock}px) ${important};
      }
    `,
  };
});

export default useStyles;
