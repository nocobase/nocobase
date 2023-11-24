import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  return {
    scrollWrapper: css`
      overflow: auto;
      position: absolute;
      bottom: -4px;
      max-width: 100%;
      scrollbarWidth: thin;
      height: 1.2rem;
      &::-webkit-scrollbar: { width: 8, height: 8 };
      &::-webkit-scrollbar-corner: { background: transparent };
      &::-webkit-scrollbar-track: { background: var(--colorBgScrollTrack) };
      &::-webkit-scrollbar-thumb: {
        background: var(--colorBgScrollBar);
        borderRadius: 4;
      };
      &::-webkit-scrollbar-thumb:hover: {
        background: var(--colorBgScrollBarHover);
      };
      &::-webkit-scrollbar-thumb:active: {
        background: var(--colorBgScrollBarActive)
      }
    `,
    tooltipDefaultContainer: css`
      padding: 12px;
      background-color: ${token.colorBgElevated};
      background-clip: padding-box;
      border-radius: ${token.borderRadius};
      box-shadow: ${token.boxShadow};
      b: {
        display: block;
        margin-bottom: ${token.marginXS};
      }
      .tooltipdefaultcontainerparagraph: {
        font-size: ${token.fontSizeSM};
        margin-bottom: ${token.marginXXS} + ${token.marginXS - token.marginXXS};
        color: ${token.colorText};
      }
    `,
    tooltipDetailsContainer: css`
      position: absolute;
      display: flex;
      flexshrink: 0;
      pointerevents: none;
      webkittouchcallout: none;
      webkituserselect: none;
      mozuserselect: none;
      msuserselect: none;
      userselect: none;
    `,
    tooltipDetailsContainerHidden: css`
      visibility: hidden;
      position: absolute;
      display: flex;
      pointerevents: none;
    `,
    nbGridOther: css`
       .horizontalScroll: {
        height: 1
        }
  
      .verticalScroll: {
        overflow: hidden auto;
        width: 1rem;
        flexShrink: 0;
        scrollbarWidth: thin;
        &::-webkit-scrollbar: { width: 8, height: 8 };
        &::-webkit-scrollbar-corner: { background: transparent};
        &::-webkit-scrollbar-track: { background: var(--colorBgScrollTrack) };
        &::-webkit-scrollbar-thumb: {
          background: var(--colorBgScrollBar);
          borderRadius: 4;
        }
        &::-webkit-scrollbar-thumb:hover': {
          background: var(--colorBgScrollBarHover)
        }
        &::-webkit-scrollbar-thumb:active': {
          background: var(--colorBgScrollBarActive)
        },
      }
    }
   `,
  };
});

export default useStyles;
