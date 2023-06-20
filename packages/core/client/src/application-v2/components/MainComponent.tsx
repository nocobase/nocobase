import React, { useMemo } from 'react';
import { Application } from '../Application';
import { RouterProvider } from './RouterProvider';

export const MainComponent = React.memo((props: { app: Application; providers: any[] }) => {
  const { app, providers } = props;
  const router = useMemo(() => app.router.createRouter(), []);
  return <RouterProvider router={router} providers={providers} />;
});
