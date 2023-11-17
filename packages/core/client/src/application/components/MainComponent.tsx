import React, { useMemo } from 'react';
import { useApp } from '../hooks';
import { SchemaComponentProvider } from '../../schema-component';
import { CSSVariableProvider } from '../../css-variable';

export const MainComponent = React.memo(() => {
  const app = useApp();
  const Router = useMemo(() => app.router.getRouterComponent(), [app]);
  const Providers = useMemo(() => app.getComposeProviders(), [app]);
  return (
    <SchemaComponentProvider components={app.components} scope={app.scopes}>
      <CSSVariableProvider>
        <Router BaseLayout={Providers} />
      </CSSVariableProvider>
    </SchemaComponentProvider>
  );
});

MainComponent.displayName = 'MainComponent';
