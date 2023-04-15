import { RouteSwitchProvider, useRouteSwitchContext } from '@nocobase/client';
import React from 'react';
import MobileApplication from './MobileApplication';

export const MobileRouteSwitchProvider = (props) => {
  const { routes, components } = useRouteSwitchContext();
  return (
    <RouteSwitchProvider
      routes={routes}
      components={{
        ...components,
        MobileApplication,
      }}
    >
      {props.children}
    </RouteSwitchProvider>
  );
};
