import React from 'react';
import { render } from '@testing-library/react';
import { DataSourceManagerProvider, useDataSourceManager } from '@nocobase/client';

describe('DataSourceManagerProvider', () => {
  test('should render children', () => {
    const dataSourceManager = {} as any; // Replace with your actual data source manager object
    const { getByText } = render(
      <DataSourceManagerProvider dataSourceManager={dataSourceManager}>
        <div>Test Children</div>
      </DataSourceManagerProvider>,
    );
    expect(getByText('Test Children')).toBeInTheDocument();
  });
});

describe('useDataSourceManager', () => {
  test('should return the data source manager', () => {
    const dataSourceManager = {} as any; // Replace with your actual data source manager object
    const TestComponent = () => {
      const manager = useDataSourceManager();
      expect(manager).toBe(dataSourceManager);
      return null;
    };
    render(
      <DataSourceManagerProvider dataSourceManager={dataSourceManager}>
        <TestComponent />
      </DataSourceManagerProvider>,
    );
  });
});
