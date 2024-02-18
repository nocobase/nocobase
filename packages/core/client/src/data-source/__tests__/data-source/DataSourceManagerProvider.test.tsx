import React from 'react';
import { render } from '@testing-library/react';
import { DataSourceManagerProviderV2, useDataSourceManagerV2 } from '@nocobase/client';

describe('DataSourceManagerProviderV2', () => {
  test('should render children', () => {
    const dataSourceManager = {} as any; // Replace with your actual data source manager object
    const { getByText } = render(
      <DataSourceManagerProviderV2 dataSourceManager={dataSourceManager}>
        <div>Test Children</div>
      </DataSourceManagerProviderV2>,
    );
    expect(getByText('Test Children')).toBeInTheDocument();
  });
});

describe('useDataSourceManagerV2', () => {
  test('should return the data source manager', () => {
    const dataSourceManager = {} as any; // Replace with your actual data source manager object
    const TestComponent = () => {
      const manager = useDataSourceManagerV2();
      expect(manager).toBe(dataSourceManager);
      return null;
    };
    render(
      <DataSourceManagerProviderV2 dataSourceManager={dataSourceManager}>
        <TestComponent />
      </DataSourceManagerProviderV2>,
    );
  });
});
