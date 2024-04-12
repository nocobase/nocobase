import { expect } from 'vitest';
import React, { FC, Fragment } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { GetAppComponentOptions, GetAppOptions, getApp, getAppComponent } from '../web';

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

export const sleep = async (timeout = 0) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export const WaitApp = async () => {
  await waitFor(() => {
    // @ts-ignore
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
};

interface RenderHookOptions extends Omit<GetAppOptions, 'value' | 'onChange'> {
  hook: () => any;
  props?: any;
  Wrapper?: FC<{ children: React.ReactNode }>;
}

export const renderHookWithApp = async (options: RenderHookOptions) => {
  const { hook: useHook, props, Wrapper = Fragment, ...otherOptions } = options;
  const { App } = getApp(otherOptions);
  const WrapperValue: FC<{ children: React.ReactNode }> = ({ children }) => (
    <App>
      <Wrapper>{children}</Wrapper>
    </App>
  );

  const res = renderHook(() => useHook(), { wrapper: WrapperValue, initialProps: props });

  await WaitApp();

  return res;
};

export const renderApp = async (options: GetAppComponentOptions) => {
  const App = getAppComponent(options);

  const res = render(<App />);

  await WaitApp();

  return res;
};

export const renderReadPrettyApp = (options: GetAppComponentOptions) => {
  return renderApp({ ...options, schema: { ...(options.schema || {}), 'x-read-pretty': true } });
};
