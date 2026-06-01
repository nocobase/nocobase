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
      overflow-x: auto;
      overflow-y: hidden;
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      max-width: 100%;
      height: 17px;
      scrollbar-color: ${token.colorTextPlaceholder} ${token.colorSplit};
      border-left: 2px solid ${token.colorSplit};
      &::-webkit-scrollbar {
        width: 16px;
        height: 16px;
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
      .tooltipDefaultContainerParagraph {
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

      &.verticalScroll {
        overflow: hidden auto;
        width: 1rem;
        flex-shrink: 0;
        &::before {
          content: '';
          position: absolute;
          top: -17px;
          left: 0;
          right: 0;
          height: 17px;
          background: ${token.colorSplit};
          pointer-events: none;
        }
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
