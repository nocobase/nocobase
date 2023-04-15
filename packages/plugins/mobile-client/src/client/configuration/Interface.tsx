import React from 'react';
import { InterfaceRouter } from '../routes/InterfaceRouter';
import { MobileDevice } from '../devices';

export const InterfaceConfiguration = () => {
  return (
    <MobileDevice>
      <InterfaceRouter></InterfaceRouter>
    </MobileDevice>
  );
};
