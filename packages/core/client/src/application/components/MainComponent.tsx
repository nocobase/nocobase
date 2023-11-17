import React, { useMemo } from 'react';
import { useApp } from '../hooks';

export const MainComponent = React.memo(() => {
  const app = useApp();
  const Router = useMemo(() => app.router.getRouterComponent(), [app]);
  const Providers = useMemo(() => app.getComposeProviders(), [app]);
  return <Router BaseLayout={Providers} />;
});

MainComponent.displayName = 'MainComponent';
