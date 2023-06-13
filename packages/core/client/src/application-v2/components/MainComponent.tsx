import React, { useMemo } from 'react';
import { Application } from '../Application';
import { RouteCleaner, RouterProvider } from './RouterProvider';

export const MainComponent = React.memo((props: { app: Application; providers: any[] }) => {
  const { app, providers } = props;
  const router = useMemo(() => app.router.createRouter(), []);
  return (
    <RouteCleaner>
      <RouterProvider router={router} providers={providers} />
    </RouteCleaner>
  );
});
