import React from 'react';
import { render, screen } from '@nocobase/test/client';

import { Application, DataSourceApplicationProvider, DataSourceProviderV2, useDataSourceKey } from '@nocobase/client';

describe('CollectionDataSourceProvider', () => {
  test('should work', () => {
    const app = new Application({
      dataSourceManager: {
        dataSources: [
          {
            key: 'a',
            displayName: 'a',
          },
        ],
      },
    });
    const Demo = () => {
      const name = useDataSourceKey();
      return <div data-testid="content">{name}</div>;
    };

    render(
      <DataSourceApplicationProvider dataSourceManager={app.dataSourceManager}>
        <DataSourceProviderV2 dataSource={'a'}>
          <Demo />
        </DataSourceProviderV2>
      </DataSourceApplicationProvider>,
    );

    expect(screen.getByTestId('content')).toHaveTextContent('a');
  });
});
