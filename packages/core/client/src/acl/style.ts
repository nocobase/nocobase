import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css }) => {
  return css`
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
});
