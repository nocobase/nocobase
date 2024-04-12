import { expect } from 'vitest';
import React, { ComponentType, FC, Fragment } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import MockAdapter from 'axios-mock-adapter';
import { AxiosInstance } from 'axios';
// @ts-ignore
import { Application, ApplicationOptions, DataBlockProvider, LocalDataSource, SchemaComponent } from '@nocobase/client';

import dataSourceMainCollections from './dataSourceMainCollections.json';
import dataSource2 from './dataSource2.json';
import usersListData from './usersListData.json';

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

export const getApp = (
  appOptions?: AppOrOptions,
  providers?: (ComponentType | [ComponentType, any])[],
  apis?: MockApis,
  enableMultipleDataSource?: boolean,
) => {
  const app = appOptions instanceof Application ? appOptions : new Application(appOptions);
  if (providers) {
    app.addProviders(providers);
  }

  app.getCollectionManager().addCollections(dataSourceMainCollections as any);

  if (enableMultipleDataSource) {
    app.dataSourceManager.addDataSource(LocalDataSource, dataSource2 as any);
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

export const renderApp = async (appOptions: AppOrOptions, apis?: MockApis) => {
  const { App, app } = getApp(appOptions, undefined, apis);
  render(<App />);

  await WaitApp();

  return app;
};

export const renderComponentWithApp = async (
  Component: ComponentType<any>,
  apis?: MockApis,
  appOptions?: AppOrOptions,
) => {
  const { App, app } = getApp(appOptions, [Component], apis);
  render(<App />);

  await WaitApp();

  return app;
};

export const renderHookWithApp = async (
  hook: () => any,
  Wrapper: ComponentType<any> = Fragment,
  apis?: MockApis,
  appOptions?: AppOrOptions,
) => {
  const { App } = getApp(appOptions, undefined, apis);
  const WrapperValue: FC<{ children: React.ReactNode }> = ({ children }) => (
    <App>
      <Wrapper>{children}</Wrapper>
    </App>
  );

  const res = renderHook(hook, { wrapper: WrapperValue });

  await WaitApp();

  return res;
};

interface RenderSchemaOptions<V = any, Props = {}> {
  schema?: any;
  appOptions?: AppOrOptions;
  apis?: MockApis;
  Component?: ComponentType<Props>;
  value?: V;
  props?: Props;
  onChange?: (value: V) => void;
  enableUserListDataBlock?: boolean;
  enableMultipleDataSource?: boolean;
}

export const renderSchema = async (options: RenderSchemaOptions) => {
  const {
    Component,
    enableUserListDataBlock,
    enableMultipleDataSource,
    value,
    props,
    appOptions,
    apis,
    onChange,
    schema: optionsSchema = {},
  } = options;
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

  if (!schema.name) {
    schema.name = 'test';
  }

  if (!schema.type) {
    schema.type = 'void';
  }

  if (enableUserListDataBlock && !apis['users:list']) {
    apis['users:list'] = usersListData;
  }

  const TestDemo = () => {
    if (!enableUserListDataBlock) {
      return <SchemaComponent schema={schema} />;
    }
    return (
      <DataBlockProvider collection={'users'} action="list">
        <SchemaComponent schema={schema} />
      </DataBlockProvider>
    );
  };

  const { App } = getApp(appOptions, [TestDemo], apis, enableMultipleDataSource);

  const res = render(<App />);

  await WaitApp();

  return res;
};

export const renderReadPrettySchema = (options: RenderSchemaOptions) => {
  return renderSchema({ ...options, schema: { ...(options.schema || {}), 'x-read-pretty': true } });
};
