import React from 'react';
import { SortableItem } from '../../common';

export const BlockItem: React.FC<any> = (props) => {
  return (
    <SortableItem className={'nb-block-item'} style={{ position: 'relative' }}>
      {props.children}
    </SortableItem>
  );
};
