import {
  Application,
  DEFAULT_DATA_SOURCE_KEY,
  DataSourceManagerProvider,
  DataSourceOptions,
  DataSource,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import { DataSourceProvider, useDataSourceKey } from '../../data-source/DataSourceProvider';
import { render, screen } from '@nocobase/test/client';
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
    expect(document.querySelector('.ant-result')).toBeInTheDocument();
  });

  it('should render loading state when data source is loading', () => {
    renderComponent('test', 'loading');
    expect(screen.getByText('Test data source loading...')).toBeInTheDocument();
  });

  it('should render error state when data source loading fails', () => {
    renderComponent('test', 'loading-failed');
    expect(screen.getByText('DataSource "Test" loading failed')).toBeInTheDocument();
  });
});
