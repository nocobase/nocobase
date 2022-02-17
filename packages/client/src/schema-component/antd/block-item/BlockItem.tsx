import React from 'react';
import { useDesignable } from '../..';
import { SortableItem } from '../../common';

export const BlockItem: React.FC<any> = (props) => {
  const { remove } = useDesignable();
  return (
    <SortableItem className={'nb-block-item'} style={{ position: 'relative' }}>
      <a
        onClick={() => {
          remove();
        }}
      >
        删除
      </a>
      {props.children}
    </SortableItem>
  );
};
