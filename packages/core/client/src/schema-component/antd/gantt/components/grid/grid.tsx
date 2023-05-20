import React from 'react';
import type { GridBodyProps } from './grid-body';
import { GridBody } from './grid-body';

export type GridProps = GridBodyProps;
export const Grid: React.FC<GridProps> = (props) => {
  return (
    <g className="grid">
      <GridBody {...props} />
    </g>
  );
};
