import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ token, css }) => {
  return {
    globalActionCSS: css`
      #nb-position-container > & {
        height: ${token.sizeXXL}px;
        border-top: 1px solid var(--nb-box-bg);
        margin-bottom: 0px !important;
        padding: 0 var(--nb-spacing);
        align-items: center;
        overflow-x: auto;
        background: ${token.colorBgContainer};
        z-index: 100;
      }
    `,

    mobilePage: css`
      background: var(--nb-box-bg);
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      padding-bottom: var(--nb-spacing);
    `,

    mobilePageHeader: css`
      & > .ant-tabs > .ant-tabs-nav {
        .ant-tabs-tab {
          margin: 0 !important;
          padding: 0 ${token.paddingContentHorizontal}px !important;
        }
        background: ${token.colorBgContainer};
      }
      display: flex;
      flex-direction: column;
    `,
  };
});

export default useStyles;
