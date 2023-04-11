import { css } from '@emotion/css';

export const calendarBottomText = css`
  text-anchor: middle;
  fill: rgba(0, 0, 0, 0.85);
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
  font-size: 11px;
`;

export const calendarTopTick = css`
  stroke: #f0f0f0;
  stroke-width: 0;
`;

export const calendarTopText = css`
  text-anchor: middle;
  fill: #555;
  font-size: 12px;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
`;

export const calendarHeader = css`
  fill: #fafafa;
  // stroke: #e0e0e0;
  stroke-width: 1.4;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;
