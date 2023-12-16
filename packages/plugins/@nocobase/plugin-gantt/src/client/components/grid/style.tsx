import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  return {
    gridRow: css`
      fill: ${token.colorBgContainer};
    `,
    gridHeightRow: css`
      fill: #e6f7ff;
      border-color: ${token.colorBorder};
    `,
    nbGridbody: css`
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
