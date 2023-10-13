import React, { FC } from 'react';
import { SchemaInitializerOptions } from '../types';

export const InitializerListItem: FC<SchemaInitializerOptions> = (props) => {
  const { style, children, ...others } = props;
  return (
    <div style={{ paddingLeft: 24, ...style }} {...others}>
      {children}
    </div>
  );
};
