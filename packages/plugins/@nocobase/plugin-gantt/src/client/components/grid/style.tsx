import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ token, css }) => {
  return {
    gridRow: css`
      fill: ${token.colorBgContainer};
    `,
    nbGridbody: css`
      .gridheightrow: {
        fill: #e6f7ff;
        border-color: ${token.colorBorder};
      }
      .gridrowline: {
        stroke: ${token.colorBorderSecondary};
        stroke-width: 0;
        border-bottom: 1px solid ${token.colorBorderSecondary};
      }
      .gridtick: {
        stroke: ${token.colorBorderSecondary};
      }
    `,
  };
});

export default useStyles;
