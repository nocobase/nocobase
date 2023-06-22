import React from 'react';
import { MainComponent } from './MainComponent';

export * from './AppComponent';
export * from './MainComponent';
export * from './RouterProvider';

export const defaultAppComponents = {
  App: {
    Main: MainComponent,
    Spin: () => React.createElement('div', 'loading'),
  },
};
