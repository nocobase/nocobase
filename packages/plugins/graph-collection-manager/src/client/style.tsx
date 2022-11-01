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
  width: 250px;
  height: 100%;
  border-radius: 2px;
  background-color: #fff;
  border: 0;
  // box-shadow: 0 0 6px rgb(0 0 0 / 12%);
  &:hover {
    /* border: 1px solid #165dff; */
    /* box-shadow: 0 0 6px rgb(0 0 0 / 12%); */
    box-shadow: 0 1px 2px -2px rgb(0 0 0 / 16%), 0 3px 6px 0 rgb(0 0 0 / 12%), 0 5px 12px 4px rgb(0 0 0 / 9%);
  }
  .body {
    width: 100%;
    height: 100%;
    background-color: #fff;
    cursor: pointer;
    .morePorts {
      max-height: 300px;
      overflow: auto;
    }
    .body-item {
      display: inline-table;
      width: 100%;
      max-width: 250px;
      height: 40px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.85);
      height: 40px;
      border-top: 1px solid #f0f0f0;
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
          display: flex;
          flex-direction: row-reverse;
          height: 32px;
          line-height: 32px;
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
            width: 20px;
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
          .btn-edit {
            color: rgba(0, 0, 0, 0.85);
            display: flex;
          }
          .btn-edit:hover {
            background: rgb(229 230 235);
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
        margin-left: 8px;
      }

      .type {
        color: rgba(0, 0, 0, 0.45);
        margin-right: 8px;
      }
    }
  }
`;

export const headClass = css`
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
  color: rgb(29 33 41);
  padding: 0 8px;
  border-radius: 3px;
`;

export const tableNameClass = css`
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
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

export const collectionListClass = css`
  float: right;
  position: fixed;
  margin-top: 24px;
  right: 24px;
  z-index: 1000;
  .trigger {
    float: right;
    margin: 2px 4px;
    font-size: 16px;
  }
  .ant-input {
    margin: 4px;
  }
  .ant-menu-inline {
    border-top: 1px solid #f0f0f0;
  }
  .ant-layout-sider {
    margin-top: 24px;
  }
  .ant-menu-item {
    height: 32px;
  }
  .ant-btn {
    border: 0;
  }
`;

export const graphCollectionContainerClass = css`
  overflow: hidden;
  .x6-graph-scroller {
    height: calc(100vh) !important;
  }
`;
