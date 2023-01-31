import React from "react";
import { cx } from '@emotion/css';
import { barHandle } from './style';

type BarProgressHandleProps = {
  progressPoint: string;
  onMouseDown: (event: React.MouseEvent<SVGPolygonElement, MouseEvent>) => void;
};
export const BarProgressHandle: React.FC<BarProgressHandleProps> = ({
  progressPoint,
  onMouseDown,
}) => {
  return (
    <polygon
      className={cx(barHandle)}
      points={progressPoint}
      onMouseDown={onMouseDown}
    />
  );
};
