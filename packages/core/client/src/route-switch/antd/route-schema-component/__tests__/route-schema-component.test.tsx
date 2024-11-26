/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CurrentPageUidProvider, RouteSchemaComponent } from '@nocobase/client';
import { renderAppOptions, screen, waitFor } from '@nocobase/test/client';
import React from 'react';

describe('route-schema-component', () => {
  it('should render correctly', async () => {
    await renderAppOptions({
      designable: true,
      noWrapperSchema: true,
      appOptions: {
        router: {
          type: 'memory',
          initialEntries: ['/admin/test'],
          routes: {
            test: {
              path: '/admin/:name',
              element: (
                <CurrentPageUidProvider>
                  <RouteSchemaComponent />
                </CurrentPageUidProvider>
              ),
            },
          },
        },
      },
      apis: {
        '/uiSchemas:getProperties/test': {
          data: {
            type: 'void',
            properties: {
              test: {
                'x-component': 'div',
                'x-content': 'test',
                'x-component-props': {
                  'data-testid': 'test',
                },
              },
            },
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByTestId('test')).toBeInTheDocument();
      expect(screen.queryByTestId('test')).toHaveTextContent('test');
    });
  });
});
