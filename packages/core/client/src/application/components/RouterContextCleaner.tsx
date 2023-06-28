import React, { FC, ReactNode } from 'react';
import { UNSAFE_LocationContext, UNSAFE_RouteContext } from 'react-router-dom';

export const RouterContextCleaner: FC<{ children?: ReactNode }> = React.memo((props) => {
  return (
    <UNSAFE_RouteContext.Provider
      value={{
        outlet: null,
        matches: [],
        isDataRoute: false,
      }}
    >
      <UNSAFE_LocationContext.Provider value={null}>{props.children}</UNSAFE_LocationContext.Provider>
    </UNSAFE_RouteContext.Provider>
  );
});
RouterContextCleaner.displayName = 'RouterContextCleaner';
