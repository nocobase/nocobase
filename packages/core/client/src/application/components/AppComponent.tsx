/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import React, { FC, useCallback, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { Application } from '../Application';
import { ApplicationContext } from '../context';

export interface AppComponentProps {
  app: Application;
}

export const AppComponent: FC<AppComponentProps> = observer(
  ({ children, ...props }) => {
    const { app } = props;
    const handleErrors = useCallback((error: Error, info: { componentStack: string }) => {
      console.error(error);
      const err = new Error();
      err.stack = info.componentStack.trim();
      console.error(err);
    }, []);
    useEffect(() => {
      app.load();
    }, [app]);
    const AppError = app.getComponent('AppError');
    if (app.loading) return app.renderComponent('AppSpin', { app });
    if (!app.maintained && app.maintaining) return app.renderComponent('AppMaintaining', { app });
    if (app.error?.code && !(app.maintained && app.maintaining)) {
      return <AppError app={app} error={app.error} />;
    }
    return (
      <ErrorBoundary
        FallbackComponent={(props) => <AppError app={app} error={app.error} {...props} />}
        onError={handleErrors}
      >
        <ApplicationContext.Provider value={app}>
          {app.maintained && app.maintaining && app.renderComponent('AppMaintainingDialog', { app })}
          {app.renderComponent('AppMain', undefined, children)}
        </ApplicationContext.Provider>
      </ErrorBoundary>
    );
  },
  { displayName: 'AppComponent' },
);
