import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ token, css }) => {
  return {
    // 右下角的小画布
    graphMinimap: css`
      .x6-widget-minimap {
        background-color: ${token.colorBgContainer};
      }
    `,

    addButtonClass: css`
      flex-shrink: 0;
      padding: 2em 0;
    `,

    entityContainer: css`
      .btn-del {
        border-color: transparent;
        background-color: ${token.colorErrorBg};
        color: ${token.colorErrorText};
        height: 20px;
        width: 20px;
        &:hover {
          background-color: ${token.colorErrorBgHover};
        }
      }
      .btn-add {
        background: ${token.colorSuccessBg};
        border-color: transparent;
        color: ${token.colorSuccessText};
        width: 20px;
        &:hover {
          background-color: ${token.colorSuccessBgHover};
        }
      }
      .btn-edit {
        color: ${token.colorText};
        display: flex;
        &:hover {
          background: ${token.colorBgTextHover};
        }
      }
      .btn-edit-in-head {
        border-color: transparent;
        color: ${token.colorText};
        height: 20px;
        width: 22px;
        margin: 0px 5px 4px;
        line-height: 25px;
        &:hover {
          background: ${token.colorBgTextHover};
        }
      }
      .btn-inheriedParent {
        background: ${token.colorInfoBg};
        border-color: transparent;
        color: ${token.colorInfo};
        width: 20px;
        height: 20px;
        line-height: 25px;
        &:hover {
          background-color: ${token.colorInfoBgHover};
        }
      }
      .btn-inheriedChild {
        background: ${token.colorInfoBg};
        border-color: transparent;
        color: ${token.colorInfo};
        width: 20px;
        height: 20px;
        margin: 0px 5px 4px;
        &:hover {
          background-color: ${token.colorInfoBgHover};
        }
      }
      width: 250px;
      height: 100%;
      border-radius: ${token.borderRadiusLG}px;
      background-color: ${token.colorBgContainer};
      border: 0;
      overflow: hidden;
      &:hover {
        box-shadow: ${token.boxShadowTertiary};
      }
      .body {
        width: 100%;
        height: 100%;
        background-color: ${token.colorBgContainer};
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
          color: ${token.colorText};
          border-top: 1px solid ${token.colorBorderSecondary};
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
              background: ${token.colorBgContainer};
              padding-right: 3px;
              span {
                margin: 3px;
                margin-left: 4px;
                padding: 3px;
                height: 20px;
                width: 20px;
              }
              .btn-override {
                border-color: transparent;
                width: 20px;
                color: ${token.colorText};
                &:hover {
                  background-color: ${token.colorBgTextHover};
                }
              }
              .btn-view {
                border-color: transparent;
                color: ${token.colorText};
                width: 20px;
              }
              .btn-view:hover {
                background: ${token.colorBgTextHover};
              }
              .btn-assocition {
                border-color: transparent;
                color: ${token.colorPrimary};
                width: 20px;
              }
              .btn-assocition:hover {
                background: ${token.colorBgTextHover};
              }
            }
            .field_type {
              display: none;
            }
          }

          .name {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            margin-left: 8px;
            min-width: 50%;
            .ant-badge {
              padding-right: 5px;
            }
          }

          .type {
            color: ${token.colorTextTertiary};
            margin-right: 8px;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
          }
        }
      }
    `,

    headClass: css`
      height: 50px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      background: ${token.colorFillAlter};
      color: ${token.colorTextHeading};
      padding: 0 8px;
    `,

    tableNameClass: css`
      max-width: 80%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    `,

    tableBtnClass: css`
      display: flex;
      span {
        cursor: pointer;
      }
    `,

    collectionPopoverClass: css`
      div.field-content {
        font-size: 14px;
        color: ${token.colorTextSecondary};
        opacity: 0.8;
        display: block;
        .field-type {
          color: ${token.colorText};
          float: right;
        }
      }
    `,

    collectionListClass: css`
      .nb-action-bar {
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
          border-top: 1px solid ${token.colorBorderSecondary};
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
      }
    `,

    graphCollectionContainerClass: css`
      overflow: hidden;
      #container {
        height: 100% !important;
      }
      .x6-graph-scroller {
        height: calc(100vh) !important;
        width: calc(100vw) !important;
      }
    `,
  };
});

export default useStyles;
