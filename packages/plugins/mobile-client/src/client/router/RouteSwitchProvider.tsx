import { RouteSwitchProvider, useRouteSwitchContext } from '@nocobase/client';
import React, { useEffect } from 'react';
import MApplication from './MApplication';

export const RouterSwitchProvider = (props) => {
  const { routes, components } = useRouteSwitchContext();
  return (
    <RouteSwitchProvider
      routes={routes}
      components={{
        ...components,
        MApplication,
      }}
    >
      {props.children}
    </RouteSwitchProvider>
  );
};
