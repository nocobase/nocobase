/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TinyColor } from '@ctrl/tinycolor';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  const colorFillAlterSolid = new TinyColor(token.colorFillAlter)
    .onBackground(token.colorBgContainer)
    .toHexShortString();

  return {
    calendarheader: css`
      color: ${token.colorText};
      fill: ${colorFillAlterSolid};
      stroke-width: 1.4;
      background: ${colorFillAlterSolid};
      border-bottom: 1px solid ${token.colorBorderSecondary};
    `,
    calendarBottomText: css`
      font-size: 12px;
      font-weight: 400;
      fill: ${token.colorTextSecondary};
      text-anchor: middle;
      user-select: none;
      pointer-events: none;
    `,
    nbGanttCalendar: css`
      .calendarBottomText,
      .calendarbottomtext {
        font-size: 12px;
        font-weight: 400;
        fill: ${token.colorTextSecondary};
        text-anchor: middle;
        user-select: none;
        pointer-events: none;
      }
      .calendarTopTick,
      .calendartoptick {
        stroke: ${token.colorBorderSecondary};
        stroke-width: 0;
      }
      .calendarTopText,
      .calendartoptext {
        font-size: ${token.fontSize}px;
        font-weight: 600;
        fill: ${token.colorText};
        text-anchor: middle;
        user-select: none;
        pointer-events: none;
      }
    `,
  };
});

export default useStyles;
