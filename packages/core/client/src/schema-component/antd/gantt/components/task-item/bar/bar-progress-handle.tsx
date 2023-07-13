import React from 'react';

type BarProgressHandleProps = {
  progressPoint: string;
  onMouseDown: (event: React.MouseEvent<SVGPolygonElement, MouseEvent>) => void;
};
export const BarProgressHandle: React.FC<BarProgressHandleProps> = ({ progressPoint, onMouseDown }) => {
  return <polygon className={'barHandle'} points={progressPoint} onMouseDown={onMouseDown} />;
};
