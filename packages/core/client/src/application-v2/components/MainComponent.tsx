import React, { useMemo } from 'react';
import { SchemaComponentOptions } from '../../schema-component';
import { useApp } from '../hooks';

export const MainComponent = React.memo(() => {
  const app = useApp();
  const Router = useMemo(() => app.router.createRouter(), [app]);
  const Providers = useMemo(() => app.renderProviders(), [app]);
  return (
    <SchemaComponentOptions components={app.components} scope={app.scopes}>
      <Providers>
        <Router />
      </Providers>
    </SchemaComponentOptions>
  );
});

MainComponent.displayName = 'MainComponent';
