/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@nocobase/test/client';

import { Application } from '@nocobase/client';
import { DataSourceApplicationProvider } from '../../components/DataSourceApplicationProvider';
import { DataSourceProvider, useDataSourceKey } from '../../data-source/DataSourceProvider';

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
        <DataSourceProvider dataSource={'a'}>
          <Demo />
        </DataSourceProvider>
      </DataSourceApplicationProvider>,
    );

    expect(screen.getByTestId('content')).toHaveTextContent('a');
  });
});
