import React, { useMemo } from 'react';
import { useApp } from '../hooks';

export const MainComponent = React.memo(({ children }) => {
  const app = useApp();
  const Router = useMemo(() => app.router.getRouterComponent(children), [app]);
  const Providers = useMemo(() => app.getComposeProviders(), [app]);
  return <Router BaseLayout={Providers} />;
});

MainComponent.displayName = 'MainComponent';
