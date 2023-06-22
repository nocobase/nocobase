import { useRequest } from 'ahooks';
import React, { FC, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../../schema-component/antd/error-fallback';
import { Application } from '../Application';
import { ApplicationContext } from '../context';

interface AppComponentProps {
  app: Application;
}

export const AppComponent: FC<AppComponentProps> = (props) => {
  const { app } = props;
  const { error, loading } = useRequest(() => app.load(), { refreshDeps: [app] });
  const handleErrors = useCallback((error: Error, info: { componentStack: string }) => {
    console.log(error, info);
  }, []);
  if (loading) return app.renderComponent('AppSpin');
  if (error) return app.renderComponent('AppError', { error });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleErrors}>
      <ApplicationContext.Provider value={app}>{app.renderComponent('AppMain')}</ApplicationContext.Provider>
    </ErrorBoundary>
  );
};
