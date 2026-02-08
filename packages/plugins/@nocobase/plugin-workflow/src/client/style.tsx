/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ css, token }) => {
  return {
    workflowPageClass: css`
      flex-grow: 1;
      height: 100%;
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
        border-bottom: 1px solid ${token.colorBorderSecondary};

        header {
          display: flex;
          align-items: center;
          gap: 1em;
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

      .workflow-canvas-wrapper {
        flex-grow: 1;
        overflow: hidden;
        position: relative;
      }

      .workflow-canvas-zoomer {
        display: flex;
        align-items: center;
        position: absolute;
        top: 2em;
        right: 2em;
        height: 10em;
        padding: 1em 0;
        border-radius: 0.5em;
        background: ${token.colorBgContainer};
      }

      .workflow-canvas {
        overflow: auto;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2em;

        > .ant-alert {
          margin-bottom: 2em;
          font-size: 85%;
        }
      }
    `,

    dropdownClass: css`
      .ant-dropdown-menu-item {
        justify-content: flex-end;
        .ant-dropdown-menu-title-content {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          text-align: right;

          time {
            width: 14em;
            font-size: 80%;
          }
        }
      }
    `,

    workflowVersionDropdownClass: css`
      max-height: 80vh;
      overflow-y: auto;

      .ant-dropdown-menu-item {
        .ant-dropdown-menu-title-content {
          strong {
            font-weight: normal;
          }
        }

        &.enabled {
          strong {
            font-weight: bold;
          }
        }

        &.unexecuted {
          strong {
            font-style: italic;
            opacity: 0.75;
          }
        }
      }
    `,

    executionsDropdownRowClass: css`
      .ant-dropdown-menu-item {
        .id {
          flex-grow: 1;
          text-align: right;
        }
      }
    `,

    branchBlockClass: css`
      display: flex;
      position: relative;
      margin: 2em auto auto auto;

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
      min-width: 16em;
      padding: 0 2em;

      .workflow-node-list {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;

        > :last-child {
          > .workflow-add-node-button {
            &:after {
              display: none;
            }
          }
        }
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

      .end-sign {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 0;
        height: 4em;
        border-left: 1px dashed ${token.colorBgLayout};

        .anticon {
          font-size: 1.5em;
          line-height: 100%;
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
      width: 16em;
      background: ${token.colorBgContainer};
      padding: 0.75em;
      box-shadow: ${token.boxShadowTertiary};
      border-radius: ${token.borderRadiusLG}px;
      cursor: pointer;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: ${token.boxShadow};

        .workflow-node-action-button,
        .workflow-node-remove-button {
          opacity: 1;
        }
      }

      &.configuring {
        box-shadow: ${token.boxShadow};
      }

      &.dragging {
        opacity: 0.75;
      }

      &.active {
        outline: 2px dashed ${token.colorPrimaryBorder};
      }

      .workflow-node-action-button,
      .workflow-node-remove-button {
        opacity: 0;
        color: ${token.colorText};
        font-size: ${token.fontSizeIcon}px;
        line-height: 1em;

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

        .workflow-node-action-button,
        .workflow-node-remove-button {
          display: block;
        }
      }
    `,

    nodeJobButtonClass: css`
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${token.colorTextLightSolid};
    `,

    nodeHeaderClass: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5em;

      .workflow-node-actions {
      }
    `,

    nodeMetaClass: css`
      flex-grow: 1;
      display: flex;
      align-items: center;

      .ant-tag {
        max-width: 14em;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-flex;
        align-items: center;
      }

      .workflow-node-id {
        display: none;
      }
    `,

    nodeTitleClass: css`
      display: flex;
      align-items: center;
      font-weight: normal;
      .workflow-node-id {
        display: none;
      }
    `,

    nodeSubtreeClass: css`
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      margin: auto;
    `,

    nodeJobResultClass: css`
      background-color: #f3f3f3;
    `,

    addButtonClass: css`
      position: relative;
      flex-shrink: 0;
      padding: 1em 0;

      > .ant-btn {
        line-height: 1em;
        &:disabled {
          visibility: hidden;
        }
        &.anchoring {
          box-shadow: ${token.boxShadow};
          border-color: ${token.colorPrimaryBorder};
          color: ${token.colorPrimaryText};
        }
      }

      > .ant-btn-placeholder {
        display: block;
        width: 1.5em;
        height: 1.5em;
      }

      &:after {
        content: '';
        display: block;
        position: absolute;
        bottom: 0.1em;
        left: calc(50% - 0.25em);
        width: 0.5em;
        height: 0.5em;
        border: 1px solid ${token.colorBorder};
        border-width: 0 1px 1px 0;
        transform: rotate(45deg);
      }

      &:first-child:last-child:after {
        display: none;
      }
    `,

    dropZoneClass: css`
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      height: calc(2em + 1px);
      width: 12em;
      margin: -0.25em 0;
      border-radius: 0.5em;
      border: 1px dashed ${token.colorBorder};
      background: ${token.colorBgContainer};
      color: ${token.colorTextSecondary};
      opacity: 0.5;
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        box-shadow 0.2s ease,
        color 0.2s ease,
        opacity 0.2s ease;

      &:before {
        content: '';
        position: absolute;
        top: -1em;
        bottom: -1em;
        left: -1em;
        right: -1em;
      }

      &:hover {
        border-style: solid;
        opacity: 0.75;
      }

      &.drop-active {
        border-style: solid;
        opacity: 0.75;
      }

      &.drop-safe {
        border-color: ${token.colorSuccess};
        background: ${token.colorSuccessBg};
        color: ${token.colorSuccessText};
      }

      &.drop-warning {
        border-color: ${token.colorWarning};
        background: ${token.colorWarningBg};
        color: ${token.colorWarningText};
      }

      &.drop-disabled {
        visibility: hidden;
        width: 1.5em;
      }
    `,

    pasteButtonClass: css`
      &.ant-btn-variant-outlined:not(:disabled):not(.ant-btn-disabled):hover {
        &.paste-safe {
          color: ${token.colorSuccess};
          border-color: ${token.colorSuccessBorder};
        }

        &.paste-warning {
          color: ${token.colorWarning};
          border-color: ${token.colorWarningBorder};
        }
      }
    `,

    dragPreviewClass: css`
      position: fixed;
      pointer-events: none;
      width: 12em;
      padding: 0.5em 0.75em;
      border-radius: ${token.borderRadiusLG}px;
      background: ${token.colorBgContainer};
      box-shadow: ${token.boxShadow};
      opacity: 0.9;
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      overflow: visible;

      .workflow-drag-preview-type {
        font-size: 0.8em;
        color: ${token.colorTextSecondary};
        position: relative;
      }

      .workflow-drag-preview-title {
        font-weight: 600;
        color: ${token.colorText};
        position: relative;
      }

      &.drag-preview-group {
        position: fixed;

        .workflow-drag-preview-stack {
          position: absolute;
          inset: 0;
          border-radius: ${token.borderRadiusLG}px;
          background: ${token.colorBgContainer};
          box-shadow: ${token.boxShadowTertiary};
        }

        .workflow-drag-preview-stack.stack-1 {
          transform: translate(6px, 6px) rotate(2deg);
          opacity: 0.8;
        }

        .workflow-drag-preview-stack.stack-2 {
          transform: translate(12px, 12px) rotate(4deg);
          opacity: 0.6;
        }
      }
    `,

    clipboardPreviewClass: css`
      position: absolute;
      top: 2em;
      left: 2em;
      display: flex;
      flex-direction: column;
      gap: 0.5em;

      .workflow-clipboard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.85em;
        color: ${token.colorTextTertiary};
      }

      .workflow-clipboard-card {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
        padding: 0.5em;
        width: 14em;
        border-radius: ${token.borderRadiusSM}px;
        background: ${token.colorBgContainer};
        box-shadow: ${token.boxShadowTertiary};
        opacity: 0.75;

        &.dragging {
          opacity: 0.75;
          outline: 2px dashed ${token.colorPrimaryBorder};
        }
      }

      .workflow-clipboard-type {
        font-size: 0.8em;
        color: ${token.colorTextSecondary};
      }

      .workflow-clipboard-title {
        font-weight: 600;
        color: ${token.colorText};
      }
    `,

    conditionClass: css`
      position: relative;
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
      flex-shrink: 0;
      padding: 2em 0;
      font-size: 14px;
    `,

    terminalClass: css`
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 4em;
      height: 4em;
      border-radius: 50%;
      background-color: ${token.colorText};
      color: ${token.colorBgContainer};
    `,
  };
});

export default useStyles;
