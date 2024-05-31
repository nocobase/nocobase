/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { sleep } from '../web';

export * from './utils';
export { renderHook } from '@testing-library/react-hooks';

function customRender(ui: React.ReactElement, options = {}) {
  return render(ui, {
    // wrap provider(s) here if needed
    wrapper: ({ children }) => children,
    ...options,
  });
}

export async function waitForApp() {
  return waitFor(() => {
    // @ts-ignore
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
}

export async function renderApp(element: React.JSX.Element) {
  const res = render(element);
  await waitForApp();
  return res;
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
// override render export
export { customRender as render, sleep };

export * from './renderAppOptions';
export * from './renderHookWithApp';
export * from './renderSettings';
export * from './renderSingleSettings';
export * from './settingsChecker';
export * from './commonSettingsChecker';
