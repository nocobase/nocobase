import React from 'react';
import { ApplicationContext } from '../context';
import { useApp, useLoad } from '../hooks';

const Internal = React.memo(() => {
  const app = useApp();
  const loading = useLoad();
  if (loading) {
    return app.renderComponent('App.Spin');
  }
  return app.renderComponent('App.Main', {
    app,
    providers: app.providers,
  });
});

export const AppComponent = (props) => {
  const { app } = props;
  return (
    <ApplicationContext.Provider value={app}>
      <Internal />
    </ApplicationContext.Provider>
  );
};
