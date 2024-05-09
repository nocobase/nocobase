/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Application,
  DEFAULT_DATA_SOURCE_KEY,
  DataSourceManagerProvider,
  DataSourceOptions,
  DataSource,
  SchemaComponent,
} from '@nocobase/client';
import { DataSourceProvider, useDataSourceKey } from '../../data-source/DataSourceProvider';
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import { AppSchemaComponentProvider } from '../../../application/AppSchemaComponentProvider';

describe('DataSourceProvider', () => {
  function renderComponent(dataSource?: string, status?: DataSourceOptions['status']) {
    const app = new Application({
      dataSourceManager: {
        collections: [{ name: 'a' }],
      },
    });

    const Demo = () => {
      const dataSourceKey = useDataSourceKey();

      return <div data-testid="demo">{dataSourceKey}</div>;
    };
    const dataSourceOptions: DataSourceOptions = {
      key: 'test',
      displayName: 'Test',
      status: status,
    };
    class TestDataSource extends DataSource {
      async getDataSource() {
        return dataSourceOptions;
      }
    }
    app.dataSourceManager.addDataSource(TestDataSource, dataSourceOptions);

    const schema = {
      name: 'root',
      type: 'void',
      'x-decorator': 'DataSourceProvider',
      'x-decorator-props': {
        dataSource,
      },
      'x-component': 'Demo',
    };

    render(
      <AppSchemaComponentProvider designable={true}>
        <DataSourceManagerProvider dataSourceManager={app.dataSourceManager}>
          <SchemaComponent schema={schema} components={{ Demo, DataSourceProvider }} />
        </DataSourceManagerProvider>
      </AppSchemaComponentProvider>,
    );

    return app.dataSourceManager.getDataSource(dataSource);
  }
  it('should render default dataSource', () => {
    renderComponent();
    expect(screen.getByTestId('demo')).toHaveTextContent(DEFAULT_DATA_SOURCE_KEY);
  });

  it('should render children when data source is available', () => {
    renderComponent('test');
    expect(screen.getByTestId('demo')).toHaveTextContent('test');
  });

  it('should render error state when data source is not found', () => {
    renderComponent('non-existent');
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(
      screen.getByText('The data source "non-existent" may have been deleted. Please remove this block.'),
    ).toBeInTheDocument();
  });

  it('should render loading state when data source is loading', async () => {
    const ds = renderComponent('test', 'loading');
    const fn = vitest.spyOn(ds, 'reload');
    expect(screen.getByText('Test data source loading...')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(fn).toBeCalled();
    });
  });

  it('should render loading state when data source is loading', async () => {
    const ds = renderComponent('test', 'reloading');
    const fn = vitest.spyOn(ds, 'reload');
    expect(screen.getByText('Test data source loading...')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(fn).toBeCalled();
    });
  });

  it('should render error state when data source loading fails', () => {
    renderComponent('test', 'loading-failed');
    expect(screen.getByText('Data Source "Test" loading failed')).toBeInTheDocument();
  });
});
