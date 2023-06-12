import React from 'react';
import { InterfaceRouter } from '../router';
import { MobileDevice } from '../devices';

export const InterfaceConfiguration = () => {
  return (
    <MobileDevice>
      <InterfaceRouter></InterfaceRouter>
    </MobileDevice>
  );
};
