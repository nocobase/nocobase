import { createGlobalStyle } from 'antd-style';

const GlobalStyle = createGlobalStyle`
  .rbc-overlay {
    position: absolute;
    z-index: 50;
    margin-top: 5px;
    border-radius: ${({ theme }) => `${theme.borderRadius}px`};
    background-color: ${({ theme }) => theme.colorBgElevated};
    box-shadow: ${({ theme }) => theme.boxShadow};
    padding: ${({ theme }) => `${theme.paddingContentVertical}px ${theme.paddingContentHorizontalSM}px`};
  }
  .rbc-overlay > * + * {
    margin-top: 1px;
  }

  .rbc-overlay-header {
    font-weight: 500;
    font-size: ${({ theme }) => `${theme.fontSize}px`};
    color: ${({ theme }) => theme.colorTextSecondary};
    min-height: ${({ theme }) => `${theme.sizeXL}px`};
    border-bottom: ${({ theme }) => `1px solid ${theme.colorBorderSecondary}`};
    margin: ${({ theme }) =>
      `-${theme.paddingContentVertical}px -${theme.paddingContentHorizontalSM}px ${theme.paddingContentVertical}px -${theme.paddingContentHorizontalSM}px`};
    padding: ${({ theme }) => `${theme.paddingXXS}px ${theme.paddingContentHorizontalSM}px`};
  }

  .rbc-event {
    border: none;
    box-sizing: border-box;
    box-shadow: none;
    margin: 0;
    padding: 2px 5px;
    background-color: ${({ theme }) => theme.colorBorderSecondary};
    border-radius: ${({ theme }) => `${theme.borderRadiusXS}px`};
    color: ${({ theme }) => theme.colorTextSecondary};
    cursor: pointer;
    font-size: ${({ theme }) => `${theme.fontSizeSM}px`};
    width: 100%;
    text-align: left;
    &:hover {
      background-color: ${({ theme }) => theme.colorPrimaryBg};
      color: ${({ theme }) => theme.colorPrimaryText};
    }
  }
  .rbc-slot-selecting .rbc-event {
    cursor: inherit;
    pointer-events: none;
  }
  .rbc-event.rbc-selected {
    background-color: ${({ theme }) => theme.colorPrimaryBg};
    color: ${({ theme }) => theme.colorPrimaryText};
  }
  .rbc-event:focus {
    // outline: 5px auto #3b99fc;
  }

  .rbc-event-label {
    font-size: 80%;
  }

  .rbc-event-overlaps {
    box-shadow: ${({ theme }) => theme.boxShadow};
  }

  .rbc-event-continues-prior {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .rbc-event-continues-after {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .rbc-event-continues-earlier {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .rbc-event-continues-later {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`;

GlobalStyle.displayName = 'GlobalStyle';

export default GlobalStyle;
