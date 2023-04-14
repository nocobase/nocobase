import { css } from '@emotion/css';

export const ganttVerticalContainer = css`
  overflow: hidden;
  font-size: 0;
  margin: 0;
  padding: 0;
  width:100%;
  border-left: 2px solid #f4f2f2;
`;

export const horizontalContainer = css`
  margin: 0;
  padding: 0;
  overflow: hidden;
`;

export const wrapper = css`
  display: flex;
  padding: 0;
  margin: 0;
  list-style: none;
  outline: none;
  position: relative;
  .gantt-horizontal-scoll {
    display: none;
  }
  &:hover {
    .gantt-horizontal-scoll {
      display: block;
    }
  }
`;
