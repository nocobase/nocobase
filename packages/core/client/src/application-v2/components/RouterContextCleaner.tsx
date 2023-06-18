import React from 'react';
import { UNSAFE_LocationContext as LocationContext, UNSAFE_RouteContext as RouteContext } from 'react-router';

export const RouterContextCleaner = (props) => {
  return (
    <RouteContext.Provider
      value={{
        outlet: null,
        matches: [],
        isDataRoute: false,
      }}
    >
      <LocationContext.Provider value={null as any}>{props.children}</LocationContext.Provider>
    </RouteContext.Provider>
  );
};
