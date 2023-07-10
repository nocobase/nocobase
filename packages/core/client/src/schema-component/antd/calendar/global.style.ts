import { createGlobalStyle } from 'antd-style';

const GlobalStyle = createGlobalStyle`
  .rbc-overlay {
    position: absolute;
    z-index: 50;
    margin-top: 5px;
    border-radius: 2px;
    // border: 1px solid #e5e5e5;
    background-color: #fff;
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    padding: 12px 16px;
  }
  .rbc-overlay > * + * {
    margin-top: 1px;
  }

  .rbc-overlay-header {
    font-weight: 500;
    min-height: 32px;
    border-bottom: 1px solid #f0f0f0;
    margin: -12px -16px 12px -16px;
    padding: 5px 16px 4px;
  }

  .rbc-event {
    border: none;
    box-sizing: border-box;
    box-shadow: none;
    margin: 0;
    padding: 2px 5px;
    background-color: rgba(240, 240, 240, 0.65);
    border-radius: 2px;
    // color: #1890ff;
    cursor: pointer;
    font-size: 12px;
    width: 100%;
    text-align: left;
    &:hover {
      background-color: #e6f7ff;
      color: #1890ff;
    }
  }
  .rbc-slot-selecting .rbc-event {
    cursor: inherit;
    pointer-events: none;
  }
  .rbc-event.rbc-selected {
    background-color: #e6f7ff;
    color: #1890ff;
  }
  .rbc-event:focus {
    // outline: 5px auto #3b99fc;
  }

  .rbc-event-label {
    font-size: 80%;
  }

  .rbc-event-overlaps {
    box-shadow: -1px 1px 5px 0px rgba(51, 51, 51, 0.5);
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
