import React from 'react';
import { useDesignable } from '../..';

export const BlockItem: React.FC<any> = (props) => {
  const { DesignableBar } = useDesignable();
  return (
    <div className="nb-block-item">
      {props.children}
      <DesignableBar />
    </div>
  );
};
