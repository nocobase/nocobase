import { observer } from '@formily/reactive-react';
import React, { FC, useCallback, useEffect } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import type { Application } from '../Application';
import { ApplicationContext } from '../context';

export interface AppComponentProps {
  app: Application;
}

export const AppComponent: FC<AppComponentProps> = observer((props) => {
  const { app } = props;
  const handleErrors = useCallback((error: Error, info: { componentStack: string }) => {
    console.error(error, info);
  }, []);

  useEffect(() => {
    app.load();
  }, [app]);

  if (app.loading) return app.renderComponent('AppSpin', { app });
  if (app.error) return app.renderComponent('AppError', { app, error: app.error });

  return (
    <ErrorBoundary FallbackComponent={app.getComponent<FallbackProps>('ErrorFallback')} onError={handleErrors}>
      <ApplicationContext.Provider value={app}>{app.renderComponent('AppMain')}</ApplicationContext.Provider>
    </ErrorBoundary>
  );
});
