/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createGlobalStyle } from 'antd-style';

const GlobalStyle = createGlobalStyle`
  .rbc-overlay {
    position: absolute;
    z-index: 50;
    max-height: ${({ theme }) => `min(360px, calc(100vh - ${theme.marginXL * 2}px))`};
    overflow-y: auto;
    margin-top: ${({ theme }) => `${theme.marginXXS}px`};
    border-radius: ${({ theme }) => `${theme.borderRadius}px`};
    background-color: ${({ theme }) => theme.colorBgElevated};
    box-shadow: ${({ theme }) => theme.boxShadow};
    padding: ${({ theme }) => `${theme.paddingContentVertical}px ${theme.paddingContentHorizontalSM}px`};
  }
  .rbc-overlay > * + * {
    margin-top: ${({ theme }) => `${theme.lineWidth}px`};
  }
  .rbc-overlay .rbc-event {
    cursor: pointer;
  }
  .rbc-overlay-header {
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    font-size: ${({ theme }) => `${theme.fontSize}px`};
    color: ${({ theme }) => theme.colorTextSecondary};
    min-height: ${({ theme }) => `${theme.sizeXL}px`};
    border-bottom: ${({ theme }) => `${theme.lineWidth}px ${theme.lineType} ${theme.colorBorderSecondary}`};
    margin: ${({ theme }) =>
      `-${theme.paddingContentVertical}px -${theme.paddingContentHorizontalSM}px ${theme.paddingContentVertical}px -${theme.paddingContentHorizontalSM}px`};
    padding: ${({ theme }) => `${theme.paddingXXS}px ${theme.paddingContentHorizontalSM}px`};
  }
`;

GlobalStyle.displayName = 'GlobalStyle';

export default GlobalStyle;
