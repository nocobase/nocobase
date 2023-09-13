import { css, usePlugin } from '@nocobase/client';
import React from 'react';
import { MobileClientPlugin } from '../index';
import { InterfaceProvider } from './InterfaceProvider';

export const InterfaceRouter: React.FC = React.memo(() => {
  const plugin = usePlugin(MobileClientPlugin);
  const MobileRouter = plugin.getMobileRouterComponent();

  return (
    <InterfaceProvider>
      <div
        className={css`
          display: flex;
          width: 100%;
          height: 100%;
          position: relative;
        `}
      >
        <MobileRouter />
      </div>
    </InterfaceProvider>
  );
});
InterfaceRouter.displayName = 'InterfaceRouter';
