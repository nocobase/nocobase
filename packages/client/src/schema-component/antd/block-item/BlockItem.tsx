import React from 'react';
import { SortableItem } from '../../common';
import { useDesigner } from '../../hooks';

export const BlockItem: React.FC<any> = (props) => {
  const Designer = useDesigner();
  return (
    <SortableItem className={'nb-block-item'} style={{ position: 'relative' }}>
      <Designer />
      {props.children}
    </SortableItem>
  );
};
