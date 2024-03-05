import { createStyles } from '@nocobase/client';

export const useStyles = createStyles(({ token, css }) => {
  return {
    nbKanban: css`
      overflow: hidden;
      height: 100%;
      overflow-y: auto;
      .ant-spin-container {
        height: 100%;
        .ant-formily-item-label: {
          color: #8c8c8c;
          fontweight: normal;
        }
        // 为了撑满固定区块时的高度
        & > * {
          height: 100%;
        }
      }
    `,
  };
});
