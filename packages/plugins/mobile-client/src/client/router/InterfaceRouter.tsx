import { Router, useApp } from '@nocobase/client';
import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import MApplication from './Application';
import { InterfaceProvider } from './InterfaceProvider';

export const InterfaceRouter: React.FC = () => {
  const app = useApp();
  const MobileRouter = useMemo(() => {
    const router = new Router({ type: 'hash' }, app);
    router.add('root', {
      path: '/',
      element: <Navigate replace to="/mobile" />,
    });
    router.add('mobile', {
      path: '/mobile',
      element: <MApplication />,
    });
    router.add('mobile.page', {
      path: '/mobile/:id',
      element: 'RouteSchemaComponent',
    });

    return router.createRouter();
  }, [app]);

  return (
    <InterfaceProvider>
      <MobileRouter />
    </InterfaceProvider>
  );
};
