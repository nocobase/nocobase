import React from 'react';
import { DragHandler } from '../../common';
import { useDesignable } from '../../hooks';

export const TestDesigner = () => {
  const { remove } = useDesignable();
  return (
    <div>
      <a
        onClick={() => {
          remove();
        }}
      >
        删除
      </a>
      <DragHandler />
    </div>
  );
};
