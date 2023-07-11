import { usePlugin } from '@nocobase/client';
import React from 'react';
import { MobileClientPlugin } from '../index';
import { InterfaceProvider } from './InterfaceProvider';

export const InterfaceRouter: React.FC = React.memo(() => {
  const plugin = usePlugin(MobileClientPlugin);
  const MobileRouter = plugin.getMobileRouterComponent();

  return (
    <InterfaceProvider>
      <MobileRouter />
    </InterfaceProvider>
  );
});
InterfaceRouter.displayName = 'InterfaceRouter';
