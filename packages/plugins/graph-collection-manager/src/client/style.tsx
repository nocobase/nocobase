import { css } from '@emotion/css';

export const nodeSubtreeClass = css`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
`;

export const addButtonClass = css`
  flex-shrink: 0;
  padding: 2em 0;
`;

export const entityContainer = css`
  width: 210px;
  height: 100%;
  border-radius: 3px;
  background-color: #fff;
  border: 1px solid rgb(237 237 237);
  box-shadow: 0 0 6px rgb(0 0 0 / 12%);
  &:hover {
    border: 1px solid #165dff;
    box-shadow: 0 0 6px rgb(0 0 0 / 12%);
  }
  .body {
    width: 100%;
    height: 100%;
    background-color: #fff;
    overflow: auto;
    cursor: pointer;
    display: inline-table;
    // border: 1px solid #5F95FF;
    .body-item {
      width: 100%;
      max-width: 208px;
      height: 28px;
      font-size: 12px;
      color: #595959;
      height: 32px;
      border-top: 1px solid rgb(229 230 235);
      text-overflow: ellipsis;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;

      .field-operator {
        display: none;
      }
      &:hover {
        .field-operator {
          display: inline-block;
          flex-direction: row-reverse;
          position: absolute;
          height: 32px;
          line-height: 32px;
          right: 1px;
          z-index: 999;
          cursor: pointer;
          text-align: right;
          background: #fff;
          padding-right: 3px;
          span {
            margin: 3px;
            margin-left: 4px;
            padding: 3px;
            height: 20px;
          }
          .btn-del {
            border-color: transparent;
            color: rgb(78 89 105);
            height: 20px;
            width: 20px;
            &:hover {
              background-color: rgb(229 230 235);
            }
          }
          .btn-add {
            background: rgb(232 255 234);
            border-color: transparent;
            color: rgb(0, 180, 42);
            width: 20px;
          }
          .btn-add:hover {
            background: rgb(175 240 181);
          }
        }
        .type {
          display: none;
        }
      }

      .name {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        margin-left: 5px;
      }

      .type {
        color: #bfbfbf;
        margin-right: 5px;
      }
    }
  }
`;

export const headClass = css`
  height: 30px;
  font-size: 12px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: rgb(242 243 245);
  color: rgb(29 33 41);
  padding: 0 5px;
  border-radius: 3px;
`;

export const tableNameClass = css`
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
`;

export const tableBtnClass = css`
  display: flex;
  span {
    cursor: pointer;
  }
`;

export const collectiionPopoverClass = css`
  div.field-content {
    font-size: 14px;
    color: rgb(134 144 156);
    opacity: 0.8;
    display: block;
    .field-type {
      color: #333;
      float: right;
    }
  }
`;
