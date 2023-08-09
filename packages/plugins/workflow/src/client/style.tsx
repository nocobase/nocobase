import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ css, token }) => {
  return {
    workflowPageClass: css`
      flex-grow: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .workflow-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        padding: 0.5rem 1rem;
        background: ${token.colorBgContainer};
        border-bottom: 1px solid ${token.colorBorder};

        header {
          display: flex;
          align-items: center;
          min-height: 2rem;
        }

        aside {
          display: flex;
          align-items: center;
          gap: 0.5em;
        }

        .workflow-versions {
          label {
            margin-right: 0.5em;
          }
        }
      }

      .workflow-canvas {
        flex-grow: 1;
        overflow: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2em;

        .end {
          cursor: default;

          &:hover {
            box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.1);
          }
        }
      }
    `,

    workflowVersionDropdownClass: css`
      .ant-dropdown-menu-item {
        justify-content: flex-end;
        .ant-dropdown-menu-title-content {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          text-align: right;

          time {
            width: 14em;
            color: ${token.colorText};
            font-size: 80%;
          }

          strong {
            font-weight: normal;
          }

          > .enabled {
            strong {
              font-weight: bold;
            }
          }

          > .unexecuted {
            strong {
              font-style: italic;
            }
          }
        }
      }
    `,

    executionsDropdownRowClass: css`
      .row {
        display: flex;
        align-items: baseline;

        &.current {
          font-weight: bold;
        }

        .id {
          flex-grow: 1;
          text-align: right;
        }

        time {
          width: 12em;
          color: ${token.colorText};
          font-size: 80%;
        }
      }
    `,

    branchBlockClass: css`
      display: flex;
      position: relative;

      :before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(50% - 0.5px);
        width: 1px;
        background-color: ${token.colorBgLayout};
      }
    `,

    branchClass: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      min-width: 20em;
      padding: 0 2em;

      .workflow-node-list {
        flex-grow: 1;
      }

      .workflow-branch-lines {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background-color: ${token.colorBorder};
      }

      :before,
      :after {
        content: '';
        position: absolute;
        height: 1px;
        background-color: ${token.colorBorder};
      }

      :before {
        top: 0;
      }

      :after {
        bottom: 0;
      }

      :not(:first-child):not(:last-child) {
        :before,
        :after {
          left: 0;
          width: 100%;
        }
      }

      :last-child:not(:first-child) {
        :before,
        :after {
          right: 50%;
          width: 50%;
        }
      }

      :first-child:not(:last-child) {
        :before,
        :after {
          left: 50%;
          width: 50%;
        }
      }
    `,

    nodeBlockClass: css`
      flex-grow: 1;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    `,

    nodeClass: css`
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    `,

    nodeCardClass: css`
      position: relative;
      width: 20em;
      background: ${token.colorBgContainer};
      padding: 1em;
      box-shadow: ${token.boxShadowTertiary};
      border-radius: ${token.borderRadiusLG}px;
      cursor: pointer;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: ${token.boxShadow};

        .workflow-node-remove-button {
          opacity: 1;
        }
      }

      &.configuring {
        box-shadow: ${token.boxShadow};
      }

      .workflow-node-remove-button {
        position: absolute;
        right: 0.5em;
        top: 0.5em;
        color: ${token.colorText};
        opacity: 0;
        transition: opacity 0.3s ease;

        &[disabled] {
          display: none;
        }

        &:hover {
          color: ${token.colorErrorHover};
        }
      }

      .ant-input {
        font-weight: bold;

        &:not(:focus) {
          transition:
            background-color 0.3s ease,
            border-color 0.3s ease;
          border-color: ${token.colorBorderBg};
          background-color: ${token.colorBgContainerDisabled};

          &:not(:disabled):hover {
            border-color: ${token.colorPrimaryBorderHover};
          }

          &:disabled:hover {
            border-color: ${token.colorBorderBg};
          }
        }
      }

      .workflow-node-config-button {
        padding: 0;
      }

      &:hover {
        box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.25);

        .workflow-node-remove-button {
          opacity: 1;
        }
      }
    `,

    nodeJobButtonClass: css`
      display: flex;
      position: absolute;
      top: calc(1em - 1px);
      right: 1em;
      justify-content: center;
      align-items: center;
      color: ${token.colorTextLightSolid};

      &[type='button'] {
        border: none;
      }
    `,

    nodeHeaderClass: css`
      position: relative;
    `,

    nodeMetaClass: css`
      margin-bottom: 0.5em;

      .workflow-node-id {
        color: ${token.colorTextDescription};

        &:before {
          content: '#';
        }
      }
    `,

    nodeTitleClass: css`
      display: flex;
      align-items: center;
      font-weight: normal;
      .workflow-node-id {
        color: ${token.colorTextDescription};
      }
    `,

    nodeSubtreeClass: css`
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
    `,

    addButtonClass: css`
      flex-shrink: 0;
      padding: 2em 0;

      > .ant-btn {
        &:disabled {
          visibility: hidden;
        }
      }
    `,

    conditionClass: css`
      position: relative;
      height: 2em;
      overflow: visible;

      > span {
        position: absolute;
        top: calc(1.5em - 1px);
        line-height: 1em;
        color: ${token.colorTextSecondary};
        background-color: ${token.colorBgLayout};
        padding: 1px;
      }
    `,

    loopLineClass: css`
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2em;
      height: 6em;
    `,
  };
});

export default useStyles;
