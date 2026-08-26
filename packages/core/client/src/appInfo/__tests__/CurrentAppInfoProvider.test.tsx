/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderAppOptions, screen, waitFor } from '@nocobase/test/client';
import { CurrentAppInfoProvider, useCurrentAppInfo } from '@nocobase/client';
import React from 'react';

describe('CurrentAppInfoProvider', () => {
  it('should work', async () => {
    const Demo = () => {
      const result = useCurrentAppInfo();

      return <pre data-testid="current-app-info">{JSON.stringify(result?.data)}</pre>;
    };

    const Root = () => {
      return (
        <CurrentAppInfoProvider>
          <Demo />
        </CurrentAppInfoProvider>
      );
    };

    await renderAppOptions({
      noWrapperSchema: true,
      appOptions: {
        providers: [Root],
      },
      apis: {
        'app:getInfo': {
          data: {
            database: {
              dialect: 'mysql',
            },
            lang: 'zh-CN',
            version: '1.0.0',
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-app-info').textContent).toBe(
        JSON.stringify({
          database: {
            dialect: 'mysql',
          },
          lang: 'zh-CN',
          version: '1.0.0',
        }),
      );
    });
  });
});
