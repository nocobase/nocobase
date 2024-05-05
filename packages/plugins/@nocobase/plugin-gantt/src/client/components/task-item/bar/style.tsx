/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';

export const barWrapper = css`
  cursor: pointer;
  outline: none;
  .barHandle {
    fill: #ddd;
    cursor: ew-resize;
    opacity: 0;
    // visibility: hidden;
  }
  &:hover .barHandle {
    visibility: visible;
    opacity: 1;
  }
`;

export const barBackground = css`
  user-select: none;
  stroke-width: 0;
  opacity: 0.6;
`;
