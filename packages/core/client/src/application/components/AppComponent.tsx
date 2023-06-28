import React, { FC, useCallback } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import type { Application } from '../Application';
import { ApplicationContext } from '../context';
import { useAppPluginLoad } from '../hooks';

export interface AppComponentProps {
  app: Application;
}

export const AppComponent: FC<AppComponentProps> = (props) => {
  const { app } = props;
  const { loading, error } = useAppPluginLoad(app);
  const handleErrors = useCallback((error: Error, info: { componentStack: string }) => {
    console.error(error, info);
  }, []);
  if (loading) return app.renderComponent('AppSpin');
  if (error) return app.renderComponent('AppError', { error });

  return (
    <ErrorBoundary FallbackComponent={app.getComponent<FallbackProps>('ErrorFallback')} onError={handleErrors}>
      <ApplicationContext.Provider value={app}>{app.renderComponent('AppMain')}</ApplicationContext.Provider>
    </ErrorBoundary>
  );
};
