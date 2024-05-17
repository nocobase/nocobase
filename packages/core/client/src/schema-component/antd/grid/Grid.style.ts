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
  return {
    container: css`
      .ColDivider {
        flex-shrink: 0;
        width: ${token.marginBlock}px;
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
        width: ${token.marginBlock}px;
        height: 100%;
        position: absolute;
        cursor: col-resize;
      }

      .RowDivider {
        height: ${token.marginBlock}px;
        width: 100%;
        position: absolute;
        margin-top: calc(-1 * ${token.marginBlock}px);
      }

      .CardRow {
        display: flex;
        position: relative;
      }

      .showDivider {
        margin: 0 calc(-1 * ${token.marginBlock}px);
      }
    `,
  };
});

export default useStyles;
