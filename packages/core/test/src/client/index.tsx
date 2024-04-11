import { expect } from 'vitest';
import React, { ComponentType, Fragment } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import MockAdapter from 'axios-mock-adapter';
import { AxiosInstance } from 'axios';
// @ts-ignore
import { Application, ApplicationOptions, FormItem, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';

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

type URL = string;
type ResponseData = any;

type MockApis = Record<URL, ResponseData>;
type AppOrOptions = Application | ApplicationOptions;

export const mockApi = (axiosInstance: AxiosInstance, apis: MockApis = {}) => {
  const mock = new MockAdapter(axiosInstance);
  Object.keys(apis).forEach((key) => {
    mock.onAny(key).reply(200, apis[key]);
  });

  return (apis: MockApis = {}) => {
    Object.keys(apis).forEach((key) => {
      mock.onAny(key).reply(200, apis[key]);
    });
  };
};

export const mockAppApi = (app: Application, apis: MockApis = {}) => {
  const mock = mockApi(app.apiClient.axios, apis);
  return mock;
};

export const getApp = (appOrAppOptions: AppOrOptions, ProviderComponent?: ComponentType, apis?: MockApis) => {
  const app = appOrAppOptions instanceof Application ? appOrAppOptions : new Application(appOrAppOptions);
  if (ProviderComponent) {
    app.addProvider(ProviderComponent);
  }

  mockAppApi(app, apis);

  const App = app.getRootComponent();
  return {
    App,
    app,
  };
};

export const WaitApp = async () => {
  await waitFor(() => {
    // @ts-ignore
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
};

export const renderApp = async (appOrAppOptions: AppOrOptions, apis?: MockApis) => {
  const { App, app } = getApp(appOrAppOptions, undefined, apis);
  render(<App />);

  await WaitApp();

  return app;
};

export const renderComponentWithApp = async (
  Component: ComponentType<any>,
  apis?: MockApis,
  appOrAppOptions?: AppOrOptions,
) => {
  const { App, app } = getApp(appOrAppOptions, Component, apis);
  render(<App />);

  await WaitApp();

  return app;
};

export const renderHookWithApp = async (
  hook: () => any,
  Wrapper: ComponentType<any> = Fragment,
  apis?: MockApis,
  appOrAppOptions?: AppOrOptions,
) => {
  const { App } = getApp(appOrAppOptions, undefined, apis);
  const WrapperValue = ({ children }) => (
    <App>
      <Wrapper>{children}</Wrapper>
    </App>
  );

  const res = renderHook(hook, { wrapper: WrapperValue });

  await WaitApp();

  return res;
};

interface RenderSchemaOptions {
  Component: ComponentType<any>;
  value?: any;
  props?: any;
  CheckerComponent?: ComponentType;
  schema?: any;
  onChange?: (value: any) => void;
}

export const renderSchema = (options: RenderSchemaOptions) => {
  const { Component, value, props, onChange, schema: optionsSchema = {}, CheckerComponent = Fragment } = options;
  const schema = {
    type: 'object',
    name: 'test',
    default: value,
    'x-component': Component,
    'x-component-props': {
      onChange,
      ...props,
    },
    ...optionsSchema,
  };
  return render(
    <SchemaComponentProvider components={{ FormItem }}>
      <SchemaComponent schema={schema} />
      <CheckerComponent />
    </SchemaComponentProvider>,
  );
};

export const renderReadPrettySchema = (options: RenderSchemaOptions) => {
  return renderSchema({ ...options, schema: { ...(options.schema || {}), 'x-read-pretty': true } });
};

export const renderSchemaWithApp = async (Component: ComponentType<any>, props: any = {}, apis: MockApis) => {
  const { App } = getApp(undefined, undefined, apis);
  const schema = {
    type: 'void',
    name: 'root',
    'x-component': Component,
    'x-component-props': props,
  };

  const res = render(
    <App>
      <SchemaComponent schema={schema} />
    </App>,
  );

  await WaitApp();

  return res;
};
