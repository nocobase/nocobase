import React from 'react';
import { useDesignable } from '../..';
import { SortableItem } from '../../common';

export const BlockItem: React.FC<any> = (props) => {
  const { DesignableBar } = useDesignable();
  return (
    <SortableItem>
      {props.children}
      <DesignableBar />
    </SortableItem>
  );
};
