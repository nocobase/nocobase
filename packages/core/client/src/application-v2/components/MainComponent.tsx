import React from 'react';
import { Application } from '../Application';

export const MainComponent = React.memo((props: { app: Application; providers: any[] }) => {
  const { app, providers } = props;
  return app.router.render({ providers });
});
