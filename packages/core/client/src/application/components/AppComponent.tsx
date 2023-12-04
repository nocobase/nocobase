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
  const AppError = app.getComponent('AppError');
  if (app.loading) return app.renderComponent('AppSpin', { app });
  if (!app.maintained && app.maintaining) return app.renderComponent('AppMaintaining', { app });
  if (app.error?.code === 'LOAD_ERROR') return <AppError app={app} error={app.error} />;
  return (
    <ErrorBoundary FallbackComponent={(props) => <AppError {...props} app={app} />} onError={handleErrors}>
      <ApplicationContext.Provider value={app}>
        {app.maintained && app.maintaining && app.renderComponent('AppMaintainingDialog', { app })}
        {app.renderComponent('AppMain')}
      </ApplicationContext.Provider>
    </ErrorBoundary>
  );
});
