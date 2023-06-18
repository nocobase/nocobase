import React, { useMemo } from 'react';
import { useRoutes } from 'react-router-dom';
import { compose } from '../compose';
import { RouterContextCleaner } from './RouterContextCleaner';

const Routes = (props) => {
  return useRoutes(props.routes);
};

export const InternalRouter = (props) => {
  const { type, Router, routes = [], providers = [], ...opts } = props;
  const Providers = useMemo(() => compose(...providers)((props) => <>{props.children}</>), [providers]);
  return (
    <RouterContextCleaner>
      <Router {...opts}>
        <Providers>
          <Routes routes={routes} />
        </Providers>
      </Router>
    </RouterContextCleaner>
  );
};
