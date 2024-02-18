import {
  Application,
  DEFAULT_DATA_SOURCE_NAME,
  DataSourceManagerProviderV2,
  DataSourceOptionsV2,
  DataSourceV2,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import { DataSourceProviderV2, useDataSourceKey } from '../../data-source/DataSourceProvider';
import { render, screen } from '@nocobase/test/client';
import React from 'react';
import { AppSchemaComponentProvider } from '../../../application/AppSchemaComponentProvider';

describe('DataSourceProviderV2', () => {
  function renderComponent(dataSource?: string, status?: DataSourceOptionsV2['status']) {
    const app = new Application({
      dataSourceManager: {
        collections: [{ name: 'a' }],
      },
    });

    const Demo = () => {
      const dataSourceKey = useDataSourceKey();

      return <div data-testid="demo">{dataSourceKey}</div>;
    };
    const dataSourceOptions: DataSourceOptionsV2 = {
      key: 'test',
      displayName: 'Test Data Source',
      status: status,
    };
    class TestDataSource extends DataSourceV2 {
      async getDataSource() {
        return dataSourceOptions;
      }
    }
    app.dataSourceManager.addDataSource(TestDataSource, dataSourceOptions);

    const schema = {
      name: 'root',
      type: 'void',
      'x-decorator': 'DataSourceProviderV2',
      'x-decorator-props': {
        dataSource,
      },
      'x-component': 'Demo',
    };

    render(
      <AppSchemaComponentProvider designable={true}>
        <DataSourceManagerProviderV2 dataSourceManager={app.dataSourceManager}>
          <SchemaComponent schema={schema} components={{ Demo, DataSourceProviderV2 }} />
        </DataSourceManagerProviderV2>
      </AppSchemaComponentProvider>,
    );
  }
  it('should render default dataSource', () => {
    renderComponent();
    expect(screen.getByTestId('demo')).toHaveTextContent(DEFAULT_DATA_SOURCE_NAME);
  });

  it('should render children when data source is available', () => {
    renderComponent('test');
    expect(screen.getByTestId('demo')).toHaveTextContent('test');
  });

  it('should render error state when data source is not found', () => {
    renderComponent('non-existent');
    screen.debug();
    expect(document.querySelector('.ant-result')).toBeInTheDocument();
  });

  it('should render loading state when data source is loading', () => {
    renderComponent('test', 'loading');
    expect(screen.getByText('test data source loading...')).toBeInTheDocument();
  });

  it('should render error state when data source loading fails', () => {
    renderComponent('test', 'loading-failed');
    expect(screen.getByText('DataSource "test" loading failed')).toBeInTheDocument();
  });
});
