import { css } from '@emotion/css';

export const workflowPageClass = css`
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
    background: #fff;
    border-bottom: 1px solid #e7e7e7;

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
`;

export const workflowVersionDropdownClass = css`
  .ant-dropdown-menu-item {
    .ant-dropdown-menu-title-content {
      text-align: right;

      time {
        margin-left: 0.5rem;
        color: #999;
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
`;

export const branchBlockClass = css`
  display: flex;
  position: relative;

  :before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(50% - 0.5px);
    width: 1px;
    background-color: #f0f2f5;
  }
`;

export const branchClass = css`
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
    background-color: #ddd;
  }

  :before,
  :after {
    content: '';
    position: absolute;
    height: 1px;
    background-color: #ddd;
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
`;

export const nodeBlockClass = css`
  flex-grow: 1;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

export const nodeClass = css`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const nodeCardClass = css`
  position: relative;
  width: 20em;
  background: #fff;
  padding: 1em;
  box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.1);
  border-radius: 0.5em;
  cursor: pointer;
  transition: box-shadow 0.3s ease;

  &.configuring {
    box-shadow: 0 0.25em 1em rgba(0, 100, 200, 0.25);
  }

  .workflow-node-remove-button {
    position: absolute;
    right: 0.5em;
    top: 0.5em;
    color: #999;
    opacity: 0;
    transition: opacity 0.3s ease;

    &[disabled] {
      display: none;
    }

    &:hover {
      color: red;
    }
  }

  .ant-input {
    font-weight: bold;

    &:not(:focus) {
      transition: background-color 0.3s ease, border-color 0.3s ease;
      border-color: #f7f7f7;
      background-color: #f7f7f7;

      &:not(:disabled):hover {
        border-color: #eee;
        background-color: #eee;
      }

      &:disabled:hover {
        border-color: #f7f7f7;
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
`;

export const nodeJobButtonClass = css`
  display: flex;
  position: absolute;
  top: 1.25em;
  right: 1.25em;
  width: 1.25rem;
  height: 1.25rem;
  min-width: 1.25rem;
  justify-content: center;
  align-items: center;
  font-size: 0.8em;
  color: #fff;

  &[type='button'] {
    border: none;
  }

  .ant-tag {
    padding: 0;
    width: 100%;
    line-height: 18px;
    margin-right: 0;
    border-radius: 50%;
    text-align: center;
  }
`;

export const nodeHeaderClass = css`
  position: relative;
`;

export const nodeMetaClass = css`
  margin-bottom: 0.5em;

  .workflow-node-id {
    color: #999;

    &:before {
      content: '#';
    }
  }
`;

export const nodeTitleClass = css`
  display: flex;
  align-items: center;
  font-weight: normal;
  .workflow-node-id {
    color: #999;
  }
`;

export const nodeSubtreeClass = css`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
`;

export const addButtonClass = css`
  flex-shrink: 0;
  padding: 2em 0;

  > .ant-btn {
    &:disabled {
      visibility: hidden;
    }
  }
`;
