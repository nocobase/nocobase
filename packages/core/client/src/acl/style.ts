import { css } from '@emotion/css';

export const tableContainer = css`
  .ant-table-cell {
    > .ant-space-horizontal {
      .ant-space-item:empty:not(:last-child) + .ant-space-item-split {
        display: none;
      }
      .ant-space-item-split:has(+ .ant-space-item:last-child:empty) {
        display: none;
      }
    }
  }
`;
