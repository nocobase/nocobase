import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ token, css }) => {
  return {
    ganttverticalcontainer: css`
      overflow: hidden;
      font-size: 0;
      margin: 0;
      padding: 0;
      width: 100%;
      border-left: 2px solid ${token.colorBorderSecondary};
      .ganttheader: {
        border-bottom: 1px solid ${token.colorBorderSecondary};
        font-weight: 700;
      }
      .ganttbody: {
        border-bottom: 1px solid ${token.colorBorderSecondary};
      }
    `,
    horizontalcontainer: css`
      margin: 0;
      padding: 0;
      overflow: hidden;
    `,
    wrapper: css`
      display: flex;
      padding: 0;
      margin: 0;
      liststyle: none;
      outline: none;
      position: relative;
      .gantt-horizontal-scoll: {
        display: none;
      }
      &:hover: {
        .gantt-horizontal-scoll: {
          display: block;
        }
      }
    `,
  };
});

export default useStyles;
