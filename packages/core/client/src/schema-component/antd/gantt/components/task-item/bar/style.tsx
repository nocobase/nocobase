import { css } from '@emotion/css';

export const barWrapper = css`
  cursor: pointer;
  outline: none;
  &:hover .barHandle {
    visibility: visible;
    opacity: 1;
  }
`;

export const barHandle = css`
  fill: #ddd;
  cursor: ew-resize;
  opacity: 0;
  visibility: hidden;
`;

export const barBackground = css`
  user-select: none;
  stroke-width: 0;
`;
