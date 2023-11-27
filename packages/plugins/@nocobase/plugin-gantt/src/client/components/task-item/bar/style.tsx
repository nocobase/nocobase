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
