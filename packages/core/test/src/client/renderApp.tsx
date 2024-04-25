import React from 'react';
import { render } from '@testing-library/react';
import { GetAppComponentOptions, addXReadPrettyToEachLayer, getAppComponent } from '../web';
import { WaitApp } from './utils';

export const renderApp = async (options: GetAppComponentOptions) => {
  const App = getAppComponent(options);

  const res = render(<App />);

  await WaitApp();

  return res;
};

export const renderReadPrettyApp = (options: GetAppComponentOptions) => {
  return renderApp({ ...options, schema: addXReadPrettyToEachLayer(options.schema) });
};
