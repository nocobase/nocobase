import React, { useMemo } from 'react';
import { SchemaComponentOptions } from '../../schema-component/core/SchemaComponentOptions';
import { useApp } from '../hooks';

export const MainComponent = React.memo(() => {
  const app = useApp();
  const Router = useMemo(() => app.router.createRouter(), [app]);
  const Providers = useMemo(() => app.renderProviders(), [app]);
  return (
    <SchemaComponentOptions components={app.components} scope={app.scopes}>
      <Router BaseLayout={Providers} />
    </SchemaComponentOptions>
  );
});

MainComponent.displayName = 'MainComponent';
