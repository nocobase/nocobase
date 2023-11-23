import React from 'react';

type BarDateHandleProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  barCornerRadius: number;
  onMouseDown: (event: React.MouseEvent<SVGRectElement, MouseEvent>) => void;
  key: string;
};
export const BarDateHandle: React.FC<BarDateHandleProps> = ({
  x,
  y,
  width,
  height,
  barCornerRadius,
  onMouseDown,
  key,
}) => {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      className={'barHandle'}
      aria-label={`barHandle-${key}`}
      role="button"
      ry={barCornerRadius}
      rx={barCornerRadius}
      onMouseDown={onMouseDown}
    />
  );
};
