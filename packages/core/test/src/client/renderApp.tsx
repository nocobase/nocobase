import React from 'react';
import { render } from '@testing-library/react';
import { GetAppComponentOptions, getAppComponent } from '../web';
import { WaitApp } from './utils';

export const renderApp = async (options: GetAppComponentOptions) => {
  const App = getAppComponent(options);

  const res = render(<App />);

  await WaitApp();

  return res;
};

export const renderReadPrettyApp = (options: GetAppComponentOptions) => {
  return renderApp({ ...options, schema: { ...(options.schema || {}), 'x-read-pretty': true } });
};
