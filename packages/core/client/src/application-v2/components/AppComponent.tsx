import { useRequest } from 'ahooks';
import React, { FC, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../../schema-component/antd/error-fallback';
import { Application } from '../Application';
import { ApplicationContext } from '../context';
import { MainComponent } from './MainComponent';

interface AppComponentProps {
  app: Application;
}

export const AppComponent: FC<AppComponentProps> = (props) => {
  const { app } = props;
  const { error, loading } = useRequest(() => app.load(), { refreshDeps: [app] });
  const handleErrors = useCallback((error: Error, info: { componentStack: string }) => {
    console.log(error, info);
  }, []);
  if (loading) return app.renderComponent('App.Spin');
  if (error) return app.renderComponent('App.Spin', { error });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleErrors}>
      <ApplicationContext.Provider value={app}>
        <MainComponent />
      </ApplicationContext.Provider>
    </ErrorBoundary>
  );
};
