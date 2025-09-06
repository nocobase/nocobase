/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';

export const variableContainerStyle = (disabled?: boolean) => css`
  position: relative;
  line-height: 0;
  flex: 1;

  &:hover {
    .clear-button {
      display: inline-block;
    }
  }

  .ant-input {
    overflow: auto;
    white-space: nowrap;
    ${disabled ? '' : 'padding-right: 28px;'}

    .ant-tag {
      display: inline;
      line-height: 19px;
      margin: 0;
      padding: 2px 7px;
      border-radius: 10px;
    }
  }

  .variable-input-container {
    &:hover {
      border-color: #4096ff !important;
    }

    &:focus-within {
      border-color: #4096ff !important;
      outline: 0;
      box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
    }
  }

  .clear-button {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    color: #bfbfbf;
    cursor: pointer;
    display: none;
    z-index: 1;

    &:hover {
      color: #999;
    }
  }
`;

export const variableTagContainerStyle = (disabled?: boolean) => ({
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  minHeight: '32px',
  padding: 0,
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
  width: '100%',
  ...(disabled
    ? {
        backgroundColor: '#f5f5f5',
        borderColor: '#d9d9d9',
        cursor: 'not-allowed',
      }
    : {}),
});
