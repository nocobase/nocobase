import React from 'react';
import { render } from '@testing-library/react';

export * from './utils';
export { renderHook } from '@testing-library/react-hooks';

function customRender(ui: React.ReactElement, options = {}) {
  return render(ui, {
    // wrap provider(s) here if needed
    wrapper: ({ children }) => children,
    ...options,
  });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
// override render export
export { customRender as render };

export * from './renderApp';
export * from './renderHookWithApp';
export * from './renderSettings';
export * from './renderSingleSettings';
export * from './settingsChecker';
