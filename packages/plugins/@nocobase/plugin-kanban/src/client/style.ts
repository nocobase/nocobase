import { createStyles } from '@nocobase/client';

export const useStyles = createStyles(({ token, css }) => {
  return {
    nbKanban: css`
      overflow: hidden,
      height: 100%,
       .ant-spin-container: { height: 100% },
      .react-kanban-board: {
        .nb-block-item: {
          .ant-formily-item-control .ant-space-item: {
            whiteSpace: normal,
            wordBreak: break-all,
            wordWrap: break-word,
          },
          .ant-formily-item-label: { color: #8c8c8c, fontWeight: normal },
        },
        .kanban-no-label: { .ant-formily-item-label: { display: none } },
      }
    },
  `,
  };
});
