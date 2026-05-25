/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  return {
    scrollWrapper: css`
      overflow: auto;
      position: absolute;
      bottom: 0;
      max-width: 100%;
      height: 16px;
      background: ${token.colorSplit};
      scrollbar-color: ${token.colorTextPlaceholder} ${token.colorSplit};
      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      &::-webkit-scrollbar-corner {
        background: ${token.colorSplit};
      }
      &::-webkit-scrollbar-track {
        background: ${token.colorSplit};
      }
      &::-webkit-scrollbar-thumb {
        background: ${token.colorTextPlaceholder};
        border-radius: 100px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: ${token.colorTextHeading};
      }
    `,
    tooltipDefaultContainer: css`
      padding: 12px;
      background-color: ${token.colorBgElevated};
      background-clip: padding-box;
      border-radius: ${token.borderRadius};
      box-shadow: ${token.boxShadow};
      b {
        display: block;
        margin-bottom: ${token.marginXS};
      }
      .tooltipdefaultcontainerparagraph {
        font-size: ${token.fontSizeSM};
        margin-bottom: ${token.marginXS}px;
        color: ${token.colorText};
      }
    `,
    tooltipDetailsContainer: css`
      position: absolute;
      display: flex;
      flex-shrink: 0;
      pointer-events: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    `,
    tooltipDetailsContainerHidden: css`
      visibility: hidden;
      position: absolute;
      display: flex;
      pointer-events: none;
    `,
    nbGridOther: css`
      .horizontalScroll {
        height: 1px;
      }

      .verticalScroll {
        overflow: hidden auto;
        width: 1rem;
        flex-shrink: 0;
        scrollbar-color: ${token.colorTextPlaceholder} ${token.colorSplit};
        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        &::-webkit-scrollbar-corner {
          background: ${token.colorSplit};
        }
        &::-webkit-scrollbar-track {
          background: ${token.colorSplit};
        }
        &::-webkit-scrollbar-thumb {
          background: ${token.colorTextPlaceholder};
          border-radius: 100px;
        }
        &::-webkit-scrollbar-thumb:hover {
          background: ${token.colorTextHeading};
        }
      }
    `,
  };
});

export default useStyles;
